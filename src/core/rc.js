// @ts-check

/**
 * @file utils/app.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const JSON5 = require("json5");
const WpBuildApp = require("./app");
const { validate } = require("schema-utils");
const globalEnv = require("../utils/global");
const typedefs = require("../types/typedefs");
const { spawnSync } = require("child_process");
const WpBuildConsoleLogger = require("../utils/console");
const { readFileSync, mkdirSync, existsSync } = require("fs");
const { resolve, basename, join, dirname, sep, isAbsolute } = require("path");
const {
    isWpwBuildType, isWpBuildWebpackMode, isWebpackTarget, WpBuildRcPackageJsonProps
} = require("../types/constants");
const {
    WpBuildError, apply, pick, isString, merge, isArray, mergeIf, applyIf, resolvePath, asArray, uniq,
    findFilesSync, relativePath, isJsTsConfigPath
} = require("../utils/utils");


/**
 * @class
 * @implements {typedefs.IWpBuildRcSchema}
 */
class WpBuildRc
{
    /** @type {typedefs.WpBuildWebpackAliasConfig} */
    alias;
    /** @type {WpBuildApp[]} */
    apps;
    /** @type {typedefs.WpBuildCombinedRuntimeArgs} */
    args;
    /** @type {typedefs.WpwBuilds}  */
    builds;
    /** @type {string} */
    defaultTempDir;
    /** @type {string} */
    detailedDisplayName;
    /** @type {typedefs.WpwBuildModeConfig} */
    development;
    /** @type {string} */
    displayName;
    /** @type {typedefs.WpBuildGlobalEnvironment} */
    global;
    /** @type {typedefs.WpBuildRcLog} */
    log;
    /** @type {WpBuildConsoleLogger} */
    logger;
    /**
     * Top level mode passed on command line or calcualted using build definitions Note that the mode for
     * each defined build may not be of this top level mode
     * @type {typedefs.WpBuildWebpackMode}
     */
    mode;
    /** @type {string} */
    name;
    /** @type {typedefs.WpBuildRcPaths} */
    paths;
    /** @type {typedefs.WpBuildRcPackageJson} */
    pkgJson;
    /** @type {string} */
    pkgJsonPath;
    /** @type {typedefs.WpwBuildOptions} */
    options;
    /** @type {typedefs.WpwBuildModeConfig} */
    production;
    /** @type {boolean} */
    publicInfoProject;
    /** @type {{ [key: string ]: typedefs.IWpBuildRcSchema }} */
    schema;
    /** @type {string} */
    $schema;
    /** @type {string} */
    schemaDir;
    /** @type {typedefs.VersionString} */
    schemaVersion;
    /** @type {typedefs.WpwBuildModeConfig} */
    test;
    /** @type {typedefs.WpwBuildModeConfig} */
    testproduction;
    /** @type {typedefs.VersionString}/ */
    version;
    /** @type {typedefs.VersionString} */
    wpwVersion;


    /**
     * Top level rc configuration wrapper.  Initializes build configurations and Wraps
     * all build level 'WpBuildRcApp' instances.  Builds are initialized by merging
     * each layer's configuration from top level down, (i.e. the top level, `this`, and
     * the current mode/environement e.g. `production`) into each defined build config.
     *
     * @see {@link WpBuildRc.create WpBuildRc.create()} for wbbuild initiantiation process
     * @see {@link WpBuildApp} for build lvel wrapper defintion.  Stupidly named `app` (???).
     *
     * @class WpBuildRc
     * @private
     * @param {typedefs.WebpackRuntimeArgs} argv
     * @param {typedefs.WpBuildRuntimeEnvArgs} arge
     */
    constructor(argv, arge)
    {
        this.schema = {};
        this.schemaDir = resolve(__dirname, "..", "..", "schema");
        this.defaultTempDir = `node_modules${sep}.cache${sep}wpbuild${sep}temp`;
        Object.keys(arge).filter(k => isString(arge[k]) && /true|false/i.test(arge[k])).forEach((k) => {
            arge[k] = arge[k].toLowerCase() === "true";
        });
        apply(this, { apps: [], errors: [], warnings: [], args: apply({}, arge, argv), global: globalEnv, pkgJson: {} });
        const rcDefaults = this.applyJsonFromFile(this, ".wpbuildrc.defaults.json", this.schemaDir);
        const rcProject = this.applyJsonFromFile(this, ".wpbuildrc.json");
        this.logger = new WpBuildConsoleLogger({ envTag1: "rc", envTag2: "init", ...this.log });
		this.applyModeArgument(argv, arge);
        this.printBanner(arge, argv);
        this.validateSchema(rcDefaults.data);
        this.validateSchema(rcProject.data);
        this.applyVersions();
        this.pkgJsonPath = this.applyJsonFromFile(this.pkgJson, "package.json", resolve(), ...WpBuildRcPackageJsonProps).path;
        this.configureBuilds();
    };


    get hasTests() { return !!this.builds.find(b => b.type === "tests" || b.name.toLowerCase().startsWith("test")); }
    get hasTypes() { return !!this.getBuild("types"); }
    get isSingleBuild() { return !!this.args.build && this.apps.length <= 1; }


    /**
     * @function
     * @private
     * @template {Record<string, any>} T
     * @param {T} thisArg
     * @param {string} file
     * @param {string} [dirPath]
     * @param {string[]} properties
     * @returns {{ path: string; data: T; }}
     * @throws {WpBuildError}
     */
    applyJsonFromFile = (thisArg, file, dirPath = resolve(), ...properties) =>
    {
        const path = join(dirPath, file);
        try
        {   let data = JSON5.parse(readFileSync(path, "utf8"));
            if (properties.length > 0) {
                data = pick(data, ...properties);
            }
            apply(thisArg, data);
            return { path, data };
        }
        catch
        {   const parentDir = dirname(dirPath);
            if (parentDir === dirPath) {
                throw new WpBuildError(`Could not locate or parse '${basename(file)}', check existence or syntax`, "utils/rc.js");
            }
            return this.applyJsonFromFile(thisArg, file, parentDir);
        }
    };


    /**
     * @function
     * @private
     * @param {typedefs.WebpackRuntimeArgs} argv
     * @param {typedefs.WpBuildRuntimeEnvArgs} arge
     */
    applyModeArgument = (argv, arge) =>
    {
        apply(this, { mode: this.getMode(arge, argv, true) });
        if (!isWpBuildWebpackMode(this.mode)) {
            throw WpBuildError.getErrorMissing("mode", "utils/rc.js");
        }
        // if (argv.mode && !isWebpackMode(this.mode))
        // {
        //     argv.mode = "none";
        //     if (process.argv.includes("--mode")) {
        //         process.argv[process.argv.indexOf("--mode") + 1] = "none";
        //     }
        // }
    };


    /**
     * @function
     * @private
     */
    applyVersions = () =>
    {
        let schemaVersion = "0.0.1";
        const wpwVersion = require("../../package.json").version,
              match = this.$schema.match(/\/v([0-9]+\\.[0-9]+\\.[0-9]+(?:-(?:pre|alpha|beta)\\.[0-9]+)?)\//);
        if (match) {
            schemaVersion = match[1];
        }
        apply(this, { schemaVersion, version: this.pkgJson.version, wpwVersion });
    };


    /**
     * Base entry function to initialize build configurations and provide the webpack
     * configuration export(s) to webpack.config.js.
     * @see ample {@link file:///./../examples/webpack.config.js swebpack.config.js}
     *
     * @param {typedefs.WebpackRuntimeArgs} argv
     * @param {typedefs.WpBuildRuntimeEnvArgs} arge
     * @returns {typedefs.WpBuildWebpackConfig[]} arge
     */
    static create = (argv, arge) =>
    {
        const rc = new WpBuildRc(argv, arge); // Create the top level build wrapper

        if (rc.hasTypes)// Some build require types to be built, auto-add the types build if defined, and
        {               // a dependency of the single build
            const typesBuild = rc.getBuild("types");
            if (typesBuild && arge.build !== typesBuild.name && (!rc.isSingleBuild || !existsSync(typesBuild.paths.dist)))
            {
                rc.apps.push(new WpBuildApp(rc, merge({}, typesBuild)));
                apply(typesBuild, { auto: true });
            }
        }

        if (rc.isSingleBuild && rc.apps.length === 0) // if single build, allow logger to auto-adjust the env-tag length
        {
            rc.builds.forEach(b => { b.log.pad.envTag = undefined; });
        }

        rc.apps.push(
            ...rc.builds.filter((b) => !arge.build || b.name === arge.build).map((b) => new WpBuildApp(rc, merge({}, b)))
        );

        const wpConfigs = [];
        for (const app of rc.apps)
        {
            if (!app.build.mode || !app.build.target || !app.build.type) {
                throw WpBuildError.getErrorProperty("type", "utils/app.js");
            }
            wpConfigs.push(app.buildApp());
            apply(app.build, { active: true });
        }

        return wpConfigs;
    }


	/**
	 * Merges the base rc level and the environment level configurations into each
	 * build configuration and update`this.builds` with fully configured build defs.
	 *
	 * @function
	 * @private
	 */
    configureBuilds = () =>
    {
        const _applyBase = (/** @type {typedefs.WpwBuild} */dst, /** @type {typedefs.WpwBuildModeConfigBase} */src) =>
        {
            dst.mode = dst.mode || this.mode;
            if (this.initializeBaseRc(dst) && this.initializeBaseRc(src))
            {
                const ccColors = merge({}, dst.log.colors);
                dst.target = this.getTarget(dst);
                dst.type = this.getType(dst);
                applyIf(dst.paths, src.paths);
                mergeIf(dst.options, src.options);
                mergeIf(dst.log, src.log);
                mergeIf(dst.log.pad, src.log.pad);
                mergeIf(dst.alias, src.alias);
                mergeIf(dst.source, src.source);
                mergeIf(dst.vscode, src.vscode);
                mergeIf(dst.log.colors, src.log.colors);
                if (dst.log.color) {
                    dst.log.colors.valueStar = ccColors.valueStar || dst.log.color;
                    dst.log.colors.buildBracket = ccColors.buildBracket || dst.log.color;
                    dst.log.colors.tagBracket = ccColors.tagBracket || dst.log.color;
                    dst.log.colors.infoIcon = ccColors.infoIcon || dst.log.color;
                }
            }
            return dst;
        };

        this.builds.forEach((build) => _applyBase(build, this));
        const modeRc = /** @type {Partial<typedefs.WpwBuildModeConfig>} */(this[this.mode]);
        asArray(modeRc?.builds).forEach((modeBuild) =>
        {
            const baseBuild = this.builds.find(base => base.name === modeBuild.name);
            if (baseBuild) {
                _applyBase(baseBuild, modeBuild);
            }
            else {
                this.builds.push(_applyBase(merge({}, modeBuild), this));
            }
        });

        this.builds.forEach((build) =>
        {
            this.resolvePaths(build);
            this.configureSourceCode(build);
            this.resolveAliasPaths(build);
            this.validateSchema(build, "build");
        });
    };


	/**
	 * @function
	 * @private
	 * @param {typedefs.WpwBuild} build
	 */
    configureSourceCode = (build) =>
    {
        const config = this.getJsTsConfig(build);
        const compilerOptionsCc = merge({}, build.source.config.options.compilerOptions);
        merge(build.source.config, config, { options: { compilerOptions: compilerOptionsCc }});
    };


    /**
     * @function
     * @private
     * @param {typedefs.WpwBuild} build
     * @returns {string | undefined}
     */
    findJsTsConfig = (build) =>
    {
        const cfgFile = build.source.type === "typescript" ? "tsconfig" : "jsconfig";
        /**
         * @param {string | undefined} base
         * @returns {string | undefined}
         */
        const _find = (base) =>
        {
            if (base)
            {
                let tsCfg = join(base, `${cfgFile}.${build.name}.json`);
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
                                }
                            }
                        }
                    }
                }
                return tsCfg;
            }
        };

        if (isJsTsConfigPath(build.source[cfgFile]))
        {
            const curPath = resolvePath(build.paths.base, build.source[cfgFile]);
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
        const globFiles = findFilesSync(`**/${cfgFile}.${build.mode}.json`, { cwd: build.paths.base, absolute: true });
        if (globFiles.length > 0) {
            return globFiles[0];
        }
    };


    /**
     * @function
     * @param {string} name
     * @returns {typedefs.WpBuildApp | undefined}
     */
    getApp = (name) => this.apps.find(a => a.build.type === name || a.build.name === name);


    /**
     * @function
     * @param {string} name
     * @returns {typedefs.WpwBuild | undefined}
     */
    getBuild = (name) => this.builds.find(b => b.type === name || b.name === name);


    /**
     * @function
     * @private
     * @param {typedefs.WpwBuild} build
     * @returns {typedefs.WpwRcSourceCodeConfig | undefined}
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
            return { raw, json: /** @type {typedefs.WpwRcSourceCodeConfigOptions} */(JSON5.parse(raw)) };
        };

        const path = this.findJsTsConfig(build);
        if (path)
        {
            const exclude = [], include = [],
                  dir = dirname(path),
                  file = basename(path),
                  json = /** @type {typedefs.WpwRcSourceCodeConfigOptions} */({});

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
     * @function
     * @private
     * @template {boolean | undefined} T
     * @template {typedefs.WebpackMode | typedefs.WpBuildWebpackMode} R = T extends false | undefined ? typedefs.WebpackMode : typedefs.WpBuildWebpackMode
     * @param {typedefs.WpBuildRuntimeEnvArgs} arge Webpack build environment
     * @param {typedefs.WebpackRuntimeArgs} argv Webpack command line args
     * @param {T} [wpBuild] Convert to WpBuildWebpackMode @see {@link typedefs.WpBuildWebpackMode WpBuildWebpackMode}
     * @returns {R}
     */
    getMode = (arge, argv, wpBuild) =>
    {
        let mode = argv.mode || arge.mode || "production";
        if (wpBuild === true && mode === "none") { mode = "test"; }
        else if (!wpBuild && mode === "test") { mode = "none"; }
        return /** @type {R} */(mode);
    };


    /**
     * @function
     * @private
     * @param {typedefs.WpwBuild} build
     */
    getTarget = (build) =>
    {
        let target = build.target;
        if (!isWebpackTarget(target))
        {
            target = "node";
            if (isWebpackTarget(this.args.target)) { target = this.args.target; }
            else if ((/web(?:worker|app|view)/).test(build.name) || build.type === "webapp") { target = "webworker"; }
            else if ((/web|browser/).test(build.name)) { target = "web"; }
            else if ((/module|node/).test(build.name) || build.type === "module") { target = "node"; }
        }
        return target;
    };


    /**
     * @function
     * @private
     * @param {typedefs.WpwBuild} build
     */
    getType = (build) =>
    {
        let type = build.type;
        if (!type)
        {
            type = "module";
            if (isWpwBuildType(build.name)) { type = build.name; }
            else if ((/web(?:worker|app|view)/).test(build.name)) { type = "webapp"; }
            else if ((/tests?/).test(build.name)) { type = "tests"; }
            else if ((/typ(?:es|ings)/).test(build.name)) { type = "types"; }
            else if (build.target === "webworker") { type = "webapp"; }
        }
        return type;
    };


    /**
     * @function
     * @private
     * @param {typedefs.WpwBuildModeConfigBase} rc
     * @returns {rc is Required<typedefs.WpwBuildModeConfigBase>}
     */
    initializeBaseRc = (rc) =>
    {
        if (!rc.options) { rc.options = {}; }
        if (!rc.alias) { rc.alias = {}; }
        if (!rc.vscode) { rc.vscode = { type: "none" }; }
        else if (!rc.vscode.type) { rc.vscode.type = "none"; }
        if (!rc.log) { rc.log = WpBuildConsoleLogger.defaultOptions(); }
        else {
            if (!rc.log.colors) { rc.log.colors = WpBuildConsoleLogger.defaultOptions().colors; }
            else if (!rc.log.colors.default) { rc.log.colors.default = WpBuildConsoleLogger.defaultOptions().colors.default; }
            if (!rc.log.pad) { rc.log.pad = WpBuildConsoleLogger.defaultOptions().pad; }
        }
        if (!rc.paths) { rc.paths = { base: ".", src: "src", dist: "dist", ctx: ".", temp: this.defaultTempDir }; }
        else {
            if (!rc.paths.base) { rc.paths.base = "."; }
            if (!rc.paths.src) { rc.paths.src = "src"; }
            if (!rc.paths.dist) { rc.paths.dist = "dist"; }
            if (!rc.paths.ctx) { rc.paths.ctx = "."; }
            if (!rc.paths.temp) { rc.paths.temp = this.defaultTempDir; }
        }
        if (!rc.source) { rc.source = { type: "typescript", config: { options: { compilerOptions: {} }, excludeAbs: [], includeAbs: [] }}; }
        else {
            if (!rc.source.type) { rc.source.type = "typescript"; }
            if (!rc.source.config) { rc.source.config = { options: { compilerOptions: {} }, excludeAbs: [], includeAbs: [] }; }
            if (!rc.source.config.options) { rc.source.config.options = { compilerOptions: {} }; }
        }
        return true;
    };


    /**
     * @function
     * @private
     * @param {typedefs.WpBuildRuntimeEnvArgs} arge
     * @param {typedefs.WebpackRuntimeArgs} argv
     */
    printBanner = (arge, argv) =>
    {
        WpBuildConsoleLogger.printBanner(
            this.displayName, this.pkgJson.version || "1.0.0",
            ` Start ${this.detailedDisplayName || this.displayName} Webpack Build`,
            (l) => {
                l.write("   Mode  : " + l.withColor(this.mode, l.colors.grey), 1, "", 0, l.colors.white);
                l.write("   Argv  : " + l.withColor(JSON.stringify(argv), l.colors.grey), 1, "", 0, l.colors.white);
                l.write("   Env   : " + l.withColor(JSON.stringify(arge), l.colors.grey), 1, "", 0, l.colors.white);
                l.sep();
            }, this.logger
        );
    };


    /**
     * @function
     * @private
     * @param {typedefs.WpwBuild} build
     */
    resolveAliasPaths = (build) =>
    {
        const alias = build.alias,
              jstsConfig = build.source.config,
              jstsDir = jstsConfig.dir,
              jstsPaths = jstsConfig.options.compilerOptions.paths;

        const _pushAlias = (/** @type {string} */ key, /** @type {string} */ path) =>
        {
            const value = alias[key];
            if (isArray(value))
            {
                if (!value.includes(path)) {
                    value.push(path);
                }
            }
            else { alias[key] = [ path ]; }
        };

        if (jstsDir && jstsPaths)
        {
            Object.entries(jstsPaths).filter(p => isArray(p)).forEach(([ key, paths ]) =>
            {
                if (paths) {
                    asArray(paths).forEach((p) => _pushAlias(key, resolvePath(jstsDir, p)), this);
                }
            });
        }

        if (!alias[":env"])
        {
            const basePath = build.paths.base,
                  srcPath = relativePath(basePath, build.paths.src),
                  envGlob = `**/${srcPath}/**/{env,environment,target}/${build.target}/`,
                  envDirs = findFilesSync(envGlob, { cwd: basePath, absolute: true, dotRelative: false });
            if (envDirs.length >= 0) {
                envDirs.forEach((path) => _pushAlias(":env", path), this);
            }
        }
    };


	/**
	 * @function
	 * @private
	 * @param {typedefs.WpwBuild} build
	 */
	resolvePaths = (build) =>
	{
        const base = dirname(this.pkgJsonPath),
              ostemp = process.env.TEMP || process.env.TMP,
			  temp = resolve(ostemp ? `${ostemp}${sep}${this.name}` : this.defaultTempDir, build.mode);
		if (!existsSync(temp)) {
			mkdirSync(temp, { recursive: true });
		}
        build.paths.base = base;
        build.paths.temp = build.paths.temp && build.paths.temp !== this.defaultTempDir ? build.paths.temp : temp;
        build.paths.ctx = build.paths.ctx ? resolvePath(base, build.paths.ctx) : base;
        build.paths.src = resolvePath(base, build.paths.src || "src");
        build.paths.dist = resolvePath(base, build.paths.dist || "dist");
	};


    /**
     * @function
     * @private
     * @param {*} options
     * @param {string} [subschema]
     */
    validateSchema = (options, subschema) =>
    {
        const schemaFile = `.wpbuildrc.schema.${subschema ? `${subschema}.` : ""}json`;
        try {
            const schemaKey = "Wpw" + (subschema ? `.${subschema}` : ""),
                  schema = this.schema[schemaKey] || JSON5.parse(readFileSync(join(this.schemaDir, schemaFile), "utf8"));
            validate(schema, options, { name: schemaKey, baseDataPath: subschema });
            this.schema[schemaKey] = schema;
        }
        catch (e) {
            throw WpBuildError.get(`schema validation failed for ${schemaFile}: ${e.message}`, "core/rc/js");
        }
    };

}


module.exports = WpBuildRc;
