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
const WpBuildConsoleLogger = require("../utils/console");
const { readFileSync, existsSync, readdirSync } = require("fs");
const { fileExistsSync } = require("tsconfig-paths/lib/filesystem");
const { resolve, basename, join, dirname, isAbsolute } = require("path");
const {
    isString, merge, isArray, resolvePath, asArray, uniq, findFilesSync, relativePath, isJsTsConfigPath,
    typedefs, mergeIf, apply, WpBuildError, applyIf
} = require("../utils");


/**
 * @implements {typedefs.IDisposable}
 * @implements {typedefs.IWpwSourceCode}
 * @implements {typedefs.IWpwSourceCodeApp}
 */
class WpwSourceCode
{
    /** @type {typedefs.TypeScriptCompilerHost | undefined} @private */
    static compilerHost;
    /** @type {typedefs.TypeScript | undefined} */
    static typescript;
    /** @type {typedefs.WpwBuild} */
    build;
    /** @type {typedefs.WpwSourceCodeConfig} */
    config;
    /** @type {typedefs.WpwSourceCodeExtension} */
    ext;
    /** @type {WpBuildConsoleLogger} @private */
    logger;
    /** @type {typedefs.TypeScriptProgram | undefined} @private */
    program;
    /** @type {typedefs.WpwSourceCodeType} */
    type;


    /**
	 * @param {typedefs.IWpwSourceCode} sourceCodeOptions
	 * @param {typedefs.WpwBuild} build
	 * @param {WpBuildConsoleLogger} logger
     */
    constructor(sourceCodeOptions, build, logger)
    {
        const compilerOptionsCc = merge({}, sourceCodeOptions.config.options?.compilerOptions);
        apply(this, {
            build,
            logger,
            type: sourceCodeOptions.type,
            ext: sourceCodeOptions.type === "typescript" ? "ts" : "js",
            config: merge(this.getSourceCodeConfig(sourceCodeOptions.config), this.getJsTsConfig(build) || {})
        });
        merge(this.config.options, { compilerOptions: compilerOptionsCc });
        if (this.type === "typescript" || build.type === "types")
        {
            WpwSourceCode.typescript = WpwSourceCode.typescript || require(require.resolve("typescript"));
        }
    };


    dispose = () => { /* TODO - cleanup program ?? */ };


    /**
     * @param {typedefs.WpwSourceCodeConfigCompilerOptions | undefined} [compilerOptions] typescript compiler options
	 */
    createProgram = (compilerOptions) =>
    {
        if (this.program)
        {   //
            // TODO - cleanup program ??
        }   //
        const options = this.touchCompilerOptions(merge({}, this.build.source.config.options.compilerOptions, compilerOptions));
        this.program = WpwSourceCode.typescript?.createProgram(
        {
            options,
            //
            // TODO - support project references
            //
            projectReferences: undefined,
            host: this.createCompilerHost(options),
            rootNames: this.config.options.files
        });
    };


    /**
	 * @private
     * @param {typedefs.TypeScriptCompilerOptions} options typescript compiler options
     * @throws {WpBuildError}
     */
    createCompilerHost = (options) =>
    {
        if (!WpwSourceCode.typescript) {
            throw WpBuildError.get("typescript program is unavailable", "core/sourcecode.js");
        }
        const baseCompilerHost = WpwSourceCode.typescript.createCompilerHost(options);
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
     */
    emit = (file, writeFileCb, cancellationToken, emitOnlyDts, transformers) =>
    {
        console.log("EMITTTT");
        if (this.program)
        {
            const result = this.program.emit(file, writeFileCb, cancellationToken, emitOnlyDts, transformers);
            if (result.emittedFiles)
            {
                // TODO
            }
            else if (result.emitSkipped)
            {
                // TODO
            }
            if (result.diagnostics)
            {
                // TODO
                result.diagnostics.forEach((d) =>
                {
                });
            }
            return result;
        }
    };


    /**
     * @private
     * @param {typedefs.WpwBuild} build
     * @returns {string | undefined}
     */
    findJsTsConfig = (build) =>
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

        if (isJsTsConfigPath(build.source.config.path))
        {
            const curPath = resolvePath(build.paths.base, build.source.config.path);
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
     * @param {typedefs.WpwBuild} build
     * @returns {typedefs.WpwSourceCodeConfig | undefined}
     */
    getJsTsConfig = (build) =>
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

        const path = this.findJsTsConfig(build);
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
    getSourceCodeConfig = (config) =>
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
     * @returns {typedefs.TypeScriptCompilerOptions}
     */
    touchCompilerOptions = (options) =>
    {
        if (WpwSourceCode.typescript)
        {
            return mergeIf({
                jsx: WpwSourceCode.typescript.JsxEmit[options.jsx || 0],
                moduleResolution: (options.moduleResolution ?
                    WpwSourceCode.typescript.ModuleResolutionKind[options.moduleResolution] : null) ||
                    WpwSourceCode.typescript.ModuleResolutionKind.NodeJs
            }, options);
        }
        return {};
    };

}


module.exports = WpwSourceCode;
