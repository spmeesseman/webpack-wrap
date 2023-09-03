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
const { resolve, basename, join, dirname, isAbsolute } = require("path");
const {
    isString, merge, isArray, resolvePath, asArray, uniq, findFilesSync, relativePath, isJsTsConfigPath, typedefs
} = require("../utils");
const { fileExistsSync } = require("tsconfig-paths/lib/filesystem");


/**
 * @implements {typedefs.IDisposable}
 */
class WpwSourceCode
{
    /** @type {any} @private */
    compilerHost;
    /** @type {any} @private */
    program;
    /** @type {typedefs.WpwRc}/ */
    rc;
    /** @type {*} */
    typescript;


    /**
	 * @param {typedefs.WpwBuild} build
     * @param {typedefs.WpwRc} rc
     */
    constructor(build, rc)
    {
        this.rc = rc;
        const config = this.getJsTsConfig(build);
        const compilerOptionsCc = merge({}, build.source.config.options.compilerOptions);
        merge(build.source.config, config, { options: { compilerOptions: compilerOptionsCc }});
        build.source.ext = build.source.type === "typescript" ? "ts" : "js";
        if (build.source.type === "typescript") {
            this.configureTypescript(build);
        }
    };

    dispose = () => {};


    /**
	 * @private
	 * @param {typedefs.WpwBuild} build
	 */
    configureTypescript = (build) =>
    {
        this.typescript = require(require.resolve("typescript"));
        if (!this.compilerHost) {
            this.compilerHost = this.createCompilerHost(build);
        }
        if (!this.program)
        {
            this.program = this.typescript.createProgram({
                rootNames: build.source.config.options.files,
                options: build.source.config.options,
                projectReferences: undefined,
                host: this.compilerHost
            });
        }
    }

    /**
	 * @param {typedefs.WpwBuild} build
     * @returns {any}
     */
    createCompilerHost = (build) =>
    {
        const baseCompilerHost = this.typescript.typescript.createCompilerHost(build.source.config.options);
        return merge({},
            baseCompilerHost,
            {
                fileExists: fileExistsSync,
                readFile: readFileSync,
                directoryExists: fileExistsSync,
                getDirectories: readdirSync,
                realpath: resolve
            }
        );
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

}


module.exports = WpwSourceCode;
