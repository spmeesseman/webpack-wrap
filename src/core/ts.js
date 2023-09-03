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
const { readFileSync, existsSync, readdirSync } = require("fs");
const { fileExistsSync } = require("tsconfig-paths/lib/filesystem");
const { resolve, basename, join, dirname, isAbsolute } = require("path");
const {
    isString, merge, isArray, resolvePath, asArray, uniq, findFilesSync, relativePath,
    isJsTsConfigPath, typedefs, mergeIf
} = require("../utils");


/** @typedef {import("typescript")} TypeScript */
/** @typedef {import("typescript").Program} TypeScriptProgram */
/** @typedef {import("typescript").SourceFile} TypeScriptSourceFile */
/** @typedef {import("typescript").CompilerHost} TypeScriptCompilerHost */
/** @typedef {import("typescript").CompilerOptions} TypeScriptCompilerOptions */
/** @typedef {import("typescript").CancellationToken} TypeScriptCancellationToken */
/** @typedef {import("typescript").WriteFileCallback} TypeScriptWriteFileCallback */
/** @typedef {import("typescript").CustomTransformers} TypeScriptCustomTransformers */
/** @typedef {import("typescript").ModuleResolutionKind} TypeScriptModuleResolutionKind*/


/**
 * @implements {typedefs.IDisposable}
 */
class WpwSourceCode
{
    /** @type {TypeScriptCompilerHost} @private */
    static compilerHost;
    /** @type {TypeScriptProgram} @private */
    program;
    /** @type {typedefs.WpwRc}/ */
    rc;
    /** @type {TypeScript} @private */
    ts;
    /** @type {TypeScript} */
    static typescript;


    /**
	 * @param {typedefs.WpwBuild} build
     * @param {typedefs.WpwRc} rc
     */
    constructor(build, rc)
    {
        this.rc = rc;
        this.ts = WpwSourceCode.typescript;
        const config = this.getJsTsConfig(build),
              compilerOptionsCc = merge({}, build.source.config.options.compilerOptions);
        merge(build.source.config, config);
        merge(build.source.config.options, { compilerOptions: compilerOptionsCc });
        build.source.ext = build.source.type === "typescript" ? "ts" : "js";
        if (build.source.type === "typescript" || build.type === "types")
        {
            this.ts = this.ts || require(require.resolve("typescript"));
            this.configurProgram(build);
        }
    };

    dispose = () => {};


    /**
	 * @private
	 * @param {typedefs.WpwBuild} build
	 */
    configurProgram = (build) =>
    {
        WpwSourceCode.compilerHost = WpwSourceCode.compilerHost || this.createCompilerHost(build);
        this.program = this.ts.createProgram(
        {
            host: WpwSourceCode.compilerHost,
            rootNames: build.source.config.options.files,
            projectReferences: undefined,
            options: this.touchCompilerOptions(build.source.config.options.compilerOptions)
        });
    };


    /**
	 * @private
	 * @param {typedefs.WpwBuild} build
     * @returns {TypeScriptCompilerHost}
     */
    createCompilerHost = (build) =>
    {
        const baseCompilerHost = this.ts.createCompilerHost(
            this.touchCompilerOptions(build.source.config.options.compilerOptions)
        );
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
     * @param {TypeScriptSourceFile} [file]
     * @param {TypeScriptWriteFileCallback} [writeFileCb]
     * @param {TypeScriptCancellationToken} [cancellationToken]
     * @param {boolean} [emitOnlyDts]
     * @param {TypeScriptCustomTransformers} [transformers]
     */
    emit = (file, writeFileCb, cancellationToken, emitOnlyDts, transformers) =>
    {
        const result = this.program.emit(file, writeFileCb, cancellationToken, emitOnlyDts, transformers);
        if (result.emittedFiles) {
            // TODO
        }
        else if (result.emitSkipped) {
            // TODO
        }
        if (result.diagnostics) {
            // TODO
        }
        return result;
    };


    /**
     * @private
     * @param {typedefs.WpwBuild} build
     * @returns {string | undefined}
     */
    findJsTsConfig = (build) =>
    {
        const cfgFiles = build.source.type === "typescript" ? [ "tsconfig", ".tsconfig" ] : [ "jsconfig", ".jsconfig" ];
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
     * @param {typedefs.WpwSourceCodeConfigCompilerOptions} options
     * @returns {TypeScriptCompilerOptions}
     */
    touchCompilerOptions = (options) =>
    {
        return mergeIf({
            jsx: this.ts.JsxEmit[options.jsx || 0],
            moduleResolution: (options.moduleResolution ?
                                this.ts.ModuleResolutionKind[options.moduleResolution] : null) ||
                              this.ts.ModuleResolutionKind.NodeJs
        }, options);
    };

}


module.exports = WpwSourceCode;
