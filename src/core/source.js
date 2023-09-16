// @ts-check

/**
 * @file src/core/source.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const JSON5 = require("json5");
const typedefs = require("../types/typedefs");
const WpwLogger = require("../utils/console");
const { spawnSync } = require("child_process");
const { readFileSync, existsSync, readdirSync } = require("fs");
const { fileExistsSync } = require("tsconfig-paths/lib/filesystem");
const { resolve, basename, join, dirname, isAbsolute } = require("path");
const {
    apply, isString, merge, isArray, resolvePath, asArray, findFilesSync, relativePath,
    isJsTsConfigPath, mergeIf, WpwError, pickNot
} = require("../utils");


/**
 * @implements {typedefs.IDisposable}
 * @implements {typedefs.IWpwSourceConfig}
 */
class WpwSource
{
    /** @type {typedefs.TypeScript | undefined} */
    static typescript;
    /** @type {typedefs.IWpwSourceTsConfig} */
    config;
    /** @type {typedefs.IWpwSourceTsConfigFile} */
    configFile;
    /** @type {typedefs.WpwSourceExtension} */
    ext;
    /** @type {WpwLogger} @private */
    logger;
    /** @type {typedefs.WpwSourceOptions} */
    options;
    /** @type {typedefs.TypeScriptProgram | undefined} @private */
    program;
    /** @type {typedefs.WpwSourceType} */
    type;


    /**
     * @param {typedefs.IWpwSourceConfig} sourceConfig
	 * @param {typedefs.WpwBuild} build
     */
    constructor(sourceConfig, build)
    {
        this.logger = build.logger;
        apply(this, {
            type: sourceConfig.type || "javascript",
            ext: sourceConfig.type === "typescript" ? "ts" : "js"
        }, sourceConfig);
        const configFileInfo = this.getJsTsConfigFileInfo(sourceConfig, build);
        if (configFileInfo)
        {
            const configFile = /** @type {typedefs.WpwSourceTsConfigFile} */(pickNot(configFileInfo, "config")),
                  compilerOptions = sourceConfig.config?.compilerOptions || {};
            merge(this, { configFile, config: merge({}, configFileInfo.config, { compilerOptions }) });
        }
    };


    dispose() { this.cleanupProgram(); }


    get dotext() { return /** @type {typedefs.WpwSourceDotExtensionApp} */(`.${this.ext}`); }


    cleanupProgram()
    {
        if (this.program)
        {   //
            // TODO - cleanup program ??
        }
    }


    /**
     * @param {typedefs.WpwSourceConfigCompilerOptions | undefined} [compilerOptions] typescript compiler options
     * @param {string[]} [files]
	 */
    createProgram(compilerOptions, files)
    {
        const ts = WpwSource.typescript = WpwSource.typescript || require(require.resolve("typescript"));
        if (!ts) {
            throw WpwError.get({ code: WpwError.Msg.ERROR_TYPESCRIPT, message: "typescript.program is unavailable" });
        }
        this.cleanupProgram();
        const programOptions = merge({}, this.config.compilerOptions, compilerOptions),
              options = this.wpwToTsCompilerOptions(programOptions, ts);
        this.program = ts.createProgram(
        {
            options,
            // options: {
            //     configFilePath: this.config.path
            // },
            //
            // TODO - support project references
            //
            projectReferences: undefined,
            host: this.createCompilerHost(options, ts),
            // rootNames: [ "src" ]
            rootNames: files || this.config.files
            // rootNames: []
        });
    }


    /**
	 * @private
     * @param {typedefs.TypeScriptCompilerOptions} options typescript compiler options
     * @param {typedefs.TypeScript} ts
     * @throws {WpwError}
     */
    createCompilerHost(options, ts)
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
    }


    /**
     * @param {typedefs.TypeScriptSourceFile} [file]
     * @param {typedefs.TypeScriptWriteFileCallback} [writeFileCb]
     * @param {typedefs.TypeScriptCancellationToken} [cancellationToken]
     * @param {boolean} [emitOnlyDts]
     * @param {typedefs.TypeScriptCustomTransformers} [transformers]
     * @throws {WpwError}
     */
    emit(file, writeFileCb, cancellationToken, emitOnlyDts, transformers)
    {
        if (!this.program) {
            throw WpwError.get({ code: WpwError.Msg.ERROR_TYPESCRIPT, message: "typescript.program is not initialized" });
        }

        const logger = this.logger;
        logger.start("typescript.emit", 1);
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
            const diagMsgCt = logger.withColor(result.diagnostics.length.toString(), logger.colors.bold);
            logger.write(`emit request produced ${diagMsgCt} diagnostic messages`);
            result.diagnostics.forEach((d) =>
            {
                logger.write(`diagnostic ${++dCount}`, undefined, "", logger.icons.color.warning);
                logger.write(`   code: ${d.code}`, undefined, "", logger.icons.color.warning);
                logger.write(`   category: ${d.category}`, undefined, "", logger.icons.color.warning);
                logger.write(`   message: ${d.messageText}`, undefined, "", logger.icons.color.warning);
                logger.write(`   start: ${d.start}`, undefined, "", logger.icons.color.warning);
                logger.write(`   file: ${d.file}`, undefined, "", logger.icons.color.warning);
            });
        }

        logger.write("typescript.emit completed");
        return result;
    }


    /**
     * @private
     * @param {typedefs.IWpwSourceConfig} sourceConfig
     * @param {typedefs.WpwBuild} build
     * @returns {string | undefined}
     */
    findJsTsConfig(sourceConfig, build)
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

        const cfgPath = sourceConfig.configFile?.path;
        if (isJsTsConfigPath(cfgPath))
        {
            const curPath = resolvePath(build.paths.base, cfgPath);
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
     * @param {typedefs.IWpwSourceConfig} sourceConfig
     * @param {typedefs.WpwBuild} build
     * @returns {(typedefs.WpwSourceTsConfigFile & { config: typedefs.WpwSourceTsConfig}) | undefined}
     */
    getJsTsConfigFileInfo(sourceConfig, build)
    {
        const _getData= (/** @type {string} */ file, /** @type {string} */ dir) =>
        {
            const result = spawnSync("npx", [ "tsc", `-p ${file}`, "--showConfig" ], { cwd: dir, encoding: "utf8", shell: true }),
                  data = result.stdout,
                  start = data.indexOf("{"),
                  end = data.lastIndexOf("}") + 1,
                  raw = data.substring(start, end);
            return { raw, json: /** @type {typedefs.WpwSourceTsConfig} */(JSON5.parse(raw)) };
        };

        const path = this.findJsTsConfig(sourceConfig, build);
        if (path)
        {
            const exclude = [], include = [],
                  dir = dirname(path),
                  file = basename(path),
                  json = /** @type {typedefs.WpwSourceTsConfig} */({});

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

            return { dir, file, path, config: json, raw: buildJson.raw };
        }
    }


    /**
     * @private
     * @param {typedefs.WpwSourceConfigCompilerOptions} options typescript compiler options
     * @param {typedefs.TypeScript} ts
     * @returns {typedefs.TypeScriptCompilerOptions}
     */
    wpwToTsCompilerOptions(options, ts)
    {
        return mergeIf({
            configFilePath: this.configFile.path,
            jsx: ts.JsxEmit[options.jsx || 0],
            module: options.module ? ts.ModuleKind[options.module] : ts.ModuleKind.CommonJS,
            target: options.target ? ts.ScriptTarget[options.target] : ts.ScriptTarget.ES2020,
            moduleResolution: (options.moduleResolution ?
                ts.ModuleResolutionKind[options.moduleResolution] : null) || ts.ModuleResolutionKind.NodeJs
        }, options);
    }

}


module.exports = WpwSource;
