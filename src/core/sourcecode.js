// @ts-check

/**
 * @file utils/app.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const JSON5 = require("json5");
const { spawnSync } = require("child_process");
const WpwLogger = require("../utils/console");
const { readFileSync, existsSync, readdirSync } = require("fs");
const { fileExistsSync } = require("tsconfig-paths/lib/filesystem");
const { resolve, basename, join, dirname, isAbsolute } = require("path");
const {
    isString, merge, isArray, resolvePath, asArray, uniq, findFilesSync, relativePath, isJsTsConfigPath,
    typedefs, mergeIf, apply, WpwError
} = require("../utils");


/**
 * @implements {typedefs.IDisposable}
 * @implements {typedefs.IWpwSourceCode}
 * @implements {typedefs.IWpwSourceCodeApp}
 */
class WpwSourceCode
{
    /** @type {typedefs.TypeScript | undefined} */
    static typescript;
    /** @type {typedefs.WpwSourceCodeConfig} */
    config;
    /** @type {typedefs.WpwSourceCodeExtension} @private */
    exension;
    /** @type {WpwLogger} @private */
    logger;
    /** @type {typedefs.TypeScriptProgram | undefined} @private */
    program;
    /** @type {typedefs.WpwSourceCodeType} */
    type;


    /**
     * @param {typedefs.IWpwSourceCode} sourceConfig
	 * @param {typedefs.WpwBuild} build
     */
    constructor(sourceConfig, build)
    {
        const jtsconfigFileInfo = this.getJsTsConfigFileInfo(sourceConfig, build),
              defaultConfig = this.getDefaultConfig(sourceConfig.config),
              compilerOptions = sourceConfig.config.options?.compilerOptions || {};

        apply(this,
        {
            logger: build.logger,
            type: sourceConfig.type || "javascript",
            exension: sourceConfig.type === "typescript" ? "ts" : "js",
            config: merge(
                defaultConfig,
                jtsconfigFileInfo,
                {
                    options: /** @type {typedefs.WpwSourceCodeConfigOptions} */({ compilerOptions })
                }
            )
        });
    };


    dispose = () => this.cleanupProgram();


    get dotext() { return /** @type {typedefs.WpwSourceCodeDotExtensionApp} */(`.${this.exension}`); }
    get ext() { return /** @type {typedefs.WpwSourceCodeExtension} */(this.exension); }


    cleanupProgram = () =>
    {
        if (this.program)
        {   //
            // TODO - cleanup program ??
        }
    };


    /**
     * @param {typedefs.WpwSourceCodeConfigCompilerOptions | undefined} [compilerOptions] typescript compiler options
	 */
    createProgram = (compilerOptions) =>
    {
        const ts = WpwSourceCode.typescript = WpwSourceCode.typescript || require(require.resolve("typescript"));
        if (!ts) {
            throw WpwError.get("typescript.program is unavailable");
        }
        this.cleanupProgram();
        const programOptions = merge({}, this.config.options.compilerOptions, compilerOptions),
              options = this.wpwToTsCompilerOptions(programOptions, ts);
        this.program = ts.createProgram(
        {
            options,
            //
            // TODO - support project references
            //
            projectReferences: undefined,
            host: this.createCompilerHost(options, ts),
            rootNames: this.config.options.files
        });
    };


    /**
	 * @private
     * @param {typedefs.TypeScriptCompilerOptions} options typescript compiler options
     * @param {typedefs.TypeScript} ts
     * @throws {WpwError}
     */
    createCompilerHost = (options, ts) =>
    {
        const baseCompilerHost = ts.createCompilerHost(options);
        return merge({}, baseCompilerHost,
        {
            realpath: resolve,
            fileExists: fileExistsSync,
            getDirectories: readdirSync,
            directoryExists: fileExistsSync,
            readFile: (f) => readFileSync(f, "utf8")
        });
    };


    /**
     * @param {typedefs.TypeScriptSourceFile} [file]
     * @param {typedefs.TypeScriptWriteFileCallback} [writeFileCb]
     * @param {typedefs.TypeScriptCancellationToken} [cancellationToken]
     * @param {boolean} [emitOnlyDts]
     * @param {typedefs.TypeScriptCustomTransformers} [transformers]
     * @throws {WpwError}
     */
    emit = (file, writeFileCb, cancellationToken, emitOnlyDts, transformers) =>
    {
        if (!this.program) {
            throw WpwError.get("typescript.program is not initialized");
        }

        const logger = this.logger;
        logger.start("typescript.emit");
        logger.value("   source file", file, 2);
        logger.value("   emit types only", emitOnlyDts, 2);
        logger.value("   compiler options", JSON.stringify(this.program.getCompilerOptions()), 3);

        const result = this.program.emit(file, writeFileCb, cancellationToken, emitOnlyDts, transformers);

        if (result.emittedFiles)
        {
            logger.value(`  emitted ${result.emittedFiles.length} files`, 1);
        }
        if (result.emitSkipped)
        {
            logger.value("  emit skipped", 1);
        }
        if (result.diagnostics)
        {
            let dCount = 0;
            logger.value(`  ${result.diagnostics.length} diagnostic messages exist`, 1);
            result.diagnostics.forEach((d) =>
            {
                logger.write(`  diagnostic ${++dCount}`, 1, "", logger.icons.color.warning);
                logger.write(`     code: ${d.code}`, 1, "", logger.icons.color.warning);
                logger.write(`     category: ${d.category}`, 1, "", logger.icons.color.warning);
                logger.write(`     message: ${d.messageText}`, 1, "", logger.icons.color.warning);
            });
        }

        logger.write("typescript.emit completed");
        return result;
    };


    /**
     * @private
     * @param {typedefs.IWpwSourceCode} sourceConfig
     * @param {typedefs.IWpwBuildConfig} build
     * @returns {string | undefined}
     */
    findJsTsConfig = (sourceConfig, build) =>
    {
        const cfgFiles = this.type === "typescript" ? [ "tsconfig", ".tsconfig" ] : [ "jsconfig", ".jsconfig" ];
        /**
         * @param {string | undefined} base
         * @returns {string | undefined}
         */
        const _find = (base) =>
        {
            let tsCfg;
            if (base)
            {
                for (const cfgFile of cfgFiles)
                {
                    tsCfg = join(base, `${cfgFile}.${build.name}.json`);
                    if (!existsSync(tsCfg))
                    {
                        tsCfg = join(base, `${cfgFile}.${build.target}.json`);
                        if (!existsSync(tsCfg))
                        {
                            tsCfg = join(base, `${cfgFile}.${build.mode}.json`);
                            if (!existsSync(tsCfg))
                            {
                                tsCfg = join(base, `${cfgFile}.${build.type}.json`);
                                if (!existsSync(tsCfg))
                                {
                                    tsCfg = join(base, build.name, `${cfgFile}.json`);
                                    if (!existsSync(tsCfg))
                                    {
                                        tsCfg = join(base, build.type || build.name, `${cfgFile}.json`);
                                        if (!existsSync(tsCfg)) {
                                            tsCfg = join(base, `${cfgFile}.json`);
                                        }
                                    } else { break; }
                                } else { break; }
                            } else { break; }
                        } else { break; }
                    } else { break; }
                }
                return tsCfg;
            }
        };

        if (isJsTsConfigPath(sourceConfig.config.path))
        {
            const curPath = resolvePath(build.paths.base, sourceConfig.config.path);
            if (curPath && existsSync(curPath)) {
                return curPath;
            }
        }

        const tryPaths = [
            build.paths.src, join(build.paths.ctx, build.name), join(build.paths.base, build.name),
            join(build.paths.ctx, build.type), join(build.paths.base, build.type), build.paths.ctx, build.paths.base
        ];
        for (const base of tryPaths)
        {
            const configFile = _find(base);
            if (configFile && existsSync(configFile)) {
                return configFile;
            }
        }
        let globFiles = findFilesSync(`**/${cfgFiles[0]}.${build.mode}.json`, { cwd: build.paths.base, dot: true, absolute: true });
        if (globFiles.length > 0) {
            return globFiles[0];
        }
        globFiles = findFilesSync(`**/${cfgFiles[0]}.json`, { cwd: build.paths.base, dot: true, absolute: true });
        if (globFiles.length === 1) {
            return globFiles[0];
        }
    };


    /**
     * @private
     * @param {typedefs.IWpwSourceCode} sourceConfig
     * @param {typedefs.IWpwBuildConfig} build
     * @returns {typedefs.WpwSourceCodeConfig | undefined}
     */
    getJsTsConfigFileInfo = (sourceConfig, build) =>
    {
        const _getData= (/** @type {string} */ file, /** @type {string} */ dir) =>
        {
            const result = spawnSync("npx", [ "tsc", `-p ${file}`, "--showConfig" ], { cwd: dir, encoding: "utf8", shell: true }),
                  data = result.stdout,
                  start = data.indexOf("{"),
                  end = data.lastIndexOf("}") + 1,
                  raw = data.substring(start, end);
            return { raw, json: /** @type {typedefs.WpwSourceCodeConfigOptions} */(JSON5.parse(raw)) };
        };

        const path = this.findJsTsConfig(sourceConfig, build);
        if (path)
        {
            const exclude = [], include = [],
                  dir = dirname(path),
                  file = basename(path),
                  json = /** @type {typedefs.WpwSourceCodeConfigOptions} */({});

            asArray(json.extends).map(e => resolve(dir, e)).filter(e => existsSync(e)).forEach((extendFile) =>
            {
                merge(json, _getData(basename(extendFile), dirname(extendFile)).json);
            });

            const buildJson = _getData(file, dir);
            merge(json, buildJson.json);

            if (!json.files) { json.files = []; }
            if (!json.include) { json.include = []; }
            if (!json.exclude) { json.exclude = []; }
            if (!json.compilerOptions) { json.compilerOptions = {}; }

            if (json.compilerOptions.rootDir) {
                include.push(resolve(dir, json.compilerOptions.rootDir));
            }
            if (json.compilerOptions.rootDirs) {
                json.compilerOptions.rootDirs.forEach(d => include.push(resolve(dir, d)));
            }

            if (isArray(json.include, false))
            {
                include.push(
                    ...json.include.filter(p => !include.includes(p))
                       .map((path) => isAbsolute(path) ? path : resolve(dir, path.replace(/\*/g, "")))
                );
            }
            else if (isString(json.include)) {
                include.push(json.include);
            }

            if (isArray(json.exclude, false))
            {
                exclude.push(...json.exclude.map(
                	(glob) => {
                		let base = dir;
                		glob = glob.replace(/\\/g, "/");
                		while (glob.startsWith("../")) {
                			base = resolve(base, "..");
                			glob = glob.replace("../", "");
                		}
                		const rel = relativePath(build.paths.ctx, base);
                		return ((rel ? rel + "/" : "") + glob).replace(/\*\*/g, "(?:.*?)").replace(/\*/g, "(?:.*?)");
                	}
                ));
            }

            return { dir, file, path, options: json, raw: buildJson.raw, includeAbs: uniq(include), excludeAbs: uniq(exclude) };
        }
    };


    /**
     * @private
     * @param {typedefs.WpwSourceCodeConfig} config
     * @returns {typedefs.WpwSourceCodeConfig}
     */
    getDefaultConfig = (config) =>
    {
        const cfg = merge({}, config);
        if (!cfg.options)
        {
            apply(cfg,  { options: { compilerOptions: {}, files: [] }});
        }
        else
        {   if (!cfg.options.compilerOptions) {
                cfg.options.compilerOptions = {};
            }
            if (!cfg.options.files) {
                cfg.options.files = [];
            }
        }
        if (!cfg.excludeAbs) {
            cfg.excludeAbs = [];
        }
        if (!cfg.includeAbs) {
            cfg.includeAbs = [];
        }
        return cfg;
    };


    /**
     * @private
     * @param {typedefs.WpwSourceCodeConfigCompilerOptions} options typescript compiler options
     * @param {typedefs.TypeScript} ts
     * @returns {typedefs.TypeScriptCompilerOptions}
     */
    wpwToTsCompilerOptions = (options, ts) =>
    {
        return mergeIf({
            jsx: ts.JsxEmit[options.jsx || 0],
            module: options.module ? ts.ModuleKind[options.module] : ts.ModuleKind.CommonJS,
            target: options.target ? ts.ScriptTarget[options.target] : ts.ScriptTarget.ES2020,
            moduleResolution: (options.moduleResolution ?
                ts.ModuleResolutionKind[options.moduleResolution] : null) || ts.ModuleResolutionKind.NodeJs
        }, options);
    };

}


module.exports = WpwSourceCode;
