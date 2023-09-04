/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/**
 * @file utils/app.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const os = require("os");
const JSON5 = require("json5");
const WpBuildApp = require("./app");
const WpwSourceCode = require("./ts");
const WpwPlugin = require("../plugins/base");
const globalEnv = require("../utils/global");
const { readFileSync, mkdirSync, existsSync } = require("fs");
const { resolve, basename, join, dirname, sep } = require("path");
const { validateSchema, SchemaDirectory, getSchema, getSchemaVersion } = require("../utils/schema");
const { isWpwBuildType, isWpwWebpackMode, isWebpackTarget, WpwPackageJsonProps } = require("../types/constants");
const {
    WpBuildError, apply, pick, isString, merge, isArray, mergeIf, resolvePath, asArray, findFilesSync,
    relativePath, isObject, isObjectEmpty, WpBuildConsoleLogger, typedefs, isPromise
} = require("../utils");


/**
 * @implements {typedefs.IWpwRcSchema}
 */
class WpwRc
{
    /** @type {typedefs.WpwWebpackAliasConfig} */
    alias;
    /** @type {WpBuildApp[]} */
    apps;
    /** @type {typedefs.WpBuildCombinedRuntimeArgs} */
    args;
    /** @type {typedefs.WpwBuilds}  */
    builds;
    /** @type {string} */
    defaultTempDir;
    /** @type {typedefs.WpwBuildModeConfig} */
    development;
    /** @type {Array<typedefs.IDisposable>} */
    disposables;
    /** @type {typedefs.WpBuildGlobalEnvironment} */
    global;
    /** @type {typedefs.WpwLog} */
    log;
    /** @type {WpBuildConsoleLogger} @private */
    logger;
    /**
     * Top level mode passed on command line or calcualted using build definitions Note that the mode for
     * each defined build may not be of this top level mode
     * @type {typedefs.WpwWebpackMode}
     */
    mode;
    /** @type {typedefs.WpwRcPaths} */
    paths;
    /** @type {typedefs.WpwPackageJson} */
    pkgJson;
    /** @type {string} @private */
    pkgJsonPath;
    /** @type {typedefs.WpwBuildOptions} */
    options;
    /** @type {typedefs.WpwBuildModeConfig} */
    production;
    /** @type {boolean} */
    publicInfoProject;
    /** @type {string} */
    $schema;
    /** @type {typedefs.WpwVersionString} */
    schemaVersion;
    /** @type {WpwSourceCode} */
    sourceCode;
    /** @type {typedefs.WpwBuildModeConfig} */
    test;
    /** @type {typedefs.WpwBuildModeConfig} */
    testproduction;
    /** @type {*} */
    typescript;
    /** @type {typedefs.WpwVersionString}/ */
    version;
    /** @type {typedefs.WpwVersionString} */
    wpwVersion;


    /**
     * Top level rc configuration wrapper.  Initializes build configurations and Wraps
     * all build level 'WpBuildRcApp' instances.  Builds are initialized by merging
     * each layer's configuration from top level down, (i.e. the top level, `this`, and
     * the current mode/environement e.g. `production`) into each defined build config.
     * @see {@link WpwRc.create WpwRc.create()} for wbbuild initiantiation process
     * @see {@link WpBuildApp} for build lvel wrapper defintion.  Stupidly named `app` (???).
     * @private
     * @param {typedefs.WebpackRuntimeArgs} argv
     * @param {typedefs.WpBuildRuntimeEnvArgs} arge
     */
    constructor(argv, arge)
    {
        this.disposables = [];
        this.defaultTempDir = `node_modules${sep}.cache${sep}wpbuild${sep}temp`;
        Object.keys(arge).filter(k => isString(arge[k]) && /true|false/i.test(arge[k])).forEach((k) => {
            arge[k] = arge[k].toLowerCase() === "true";
        });
        apply(this, { apps: [], errors: [], warnings: [], args: apply({}, arge, argv), global: globalEnv, pkgJson: {} });
        const rcDefaults = this.applyJsonFromFile(this, ".wpbuildrc.defaults.json", SchemaDirectory);
        const rcProject = this.applyJsonFromFile(this, ".wpbuildrc.json");
        this.applyPackageJson();
        this.logger = new WpBuildConsoleLogger({ envTag1: "rc", envTag2: "init", ...this.log });
		this.applyModeArgument(argv, arge);
        this.printBanner(arge, argv);
        if (this.logger.level >= 4) {
            validateSchema(rcDefaults.data, this.logger);
        }
        validateSchema(rcProject.data, this.logger);
        this.applyVersions();
        this.configureBuilds();
    };


    dispose = async () =>
    {
        for (const d of this.disposables.splice(0))
        {
            const result = d.dispose();
            if (isPromise(result)) {
                await result;
            }
        }
        this.logger.write("dispose main wrapper instance", 3);
        this.logger.dispose();
    };


    get hasTests() { return !!this.builds.find(b => b.type === "tests" || b.name.toLowerCase().startsWith("test")); }
    get hasTypes() { return !!this.getBuild("types"); }
    get isSingleBuild() { return !!this.args.build && this.apps.length <= 1; }
    get buildCount() { return this.apps.length; }


    /**
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
     * @private
     * @param {typedefs.WebpackRuntimeArgs} argv
     * @param {typedefs.WpBuildRuntimeEnvArgs} arge
     */
    applyModeArgument = (argv, arge) =>
    {
        apply(this, { mode: this.getMode(arge, argv, true) });
        if (!isWpwWebpackMode(this.mode)) {
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
     * @private
     */
    applyPackageJson = () =>
    {
        const pkgJson = this.applyJsonFromFile(this.pkgJson, "package.json", resolve(), ...WpwPackageJsonProps);
        this.pkgJsonPath = pkgJson.path;
        const nameData = pkgJson.data.name.split("/");
        apply(this.pkgJson, {
            scopedName: {
                name: nameData.length > 1 ? nameData[1] : nameData[0],
                scope: nameData.length > 1 ? nameData[0] : undefined
            }
        });
    };


    /**
     * @private
     */
    applyVersions = () =>
    {
        const wpwVersion = JSON.parse(readFileSync(resolve(__dirname, "../../package.json"), "utf8")).version;
        apply(this, { schemaVersion: getSchemaVersion(), version: this.pkgJson.version, wpwVersion });
    };


    /**
     * Base entry function to initialize build configurations and provide the webpack
     * configuration export(s) to webpack.config.js.
     * @see example {@link file:///./../examples/webpack.config.js}
     * @param {typedefs.WebpackRuntimeArgs} argv
     * @param {typedefs.WpBuildRuntimeEnvArgs} arge
     * @returns {typedefs.WpwWebpackConfig[]} arge
     */
    static create = (argv, arge) =>
    {
        const wpConfigs = [];
        const rc = new WpwRc(argv, arge); // Create the top level build wrapper

        if (rc.hasTypes)// Some build require types to be built, auto-add the types build if defined, and
        {               // a dependency of the single build
            const typesBuild = rc.getBuild("types");
            if (typesBuild && arge.build !== typesBuild.name && (!rc.isSingleBuild || !existsSync(typesBuild.paths.dist)))
            {
                for (const a of rc.apps)
                {
                    const dependsOnTypes = (isObject(a.build.entry) && a.build.entry.dependOn === "types");
                    if (!rc.isSingleBuild || dependsOnTypes)
                    {
                        const waitConfig = WpwPlugin.getOptionsConfig("wait", a);
                        if (asArray(waitConfig.items).find(t => t.target === "types"))
                        {
                            rc.apps.push(new WpBuildApp(rc, merge({}, typesBuild)));
                            apply(typesBuild, { auto: true });
                            break;
                        }
                    }
                }
            }
        }

        if (rc.isSingleBuild && rc.apps.length === 0) // if single build, allow logger to auto-adjust the env-tag length
        {
            rc.builds.forEach(b => { b.log.pad.envTag = undefined; });
        }

        rc.apps.push(
            ...rc.builds.filter(
                (b) => (!arge.build || b.name === arge.build) && !rc.apps.find((a) => a.build.type === b.type)
            )
            .map((b) => new WpBuildApp(rc, merge({}, b)))
        );

        for (const app of rc.apps)
        {
            if (!app.build.mode || !app.build.target || !app.build.type) {
                throw WpBuildError.getErrorProperty("type", "utils/app.js");
            }
            wpConfigs.push(app.buildApp());
            apply(app.build, { active: true });
        }

        return wpConfigs;
    };


	/**
	 * Merges the base rc level and the environment level configurations into each
	 * build configuration and update`this.builds` with fully configured build defs.
	 * @private
	 */
    configureBuilds = () =>
    {
        const _log = (/** @type {typedefs.WpwBuild}  */build, /** @type {string}  */msg) => {
            this.logger.write(`   ${msg} build ${this.logger.withColor(build.name, this.logger.colors.italic)}`, 2);
        };

        /**  @template D, S */
        const _applyProperty = (/** @type {string}  */property, /** @type {D}  */dst, /** @type {S}  */src) =>
        {
            if (src[property])
            {
                if (!dst[property]) {
                    dst[property] = merge({}, src[property]);
                }
                else {
                    mergeIf(dst[property], src[property]);
                }
            }
        };

        const _applyRc = (/** @type {typedefs.WpwBuild}  */dst, /** @type {typedefs.WpwBuildModeConfigBase}  */src) =>
        {
            _applyProperty("paths", dst, src);
            _applyProperty("options", dst, src);
            _applyProperty("alias", dst, src);
            _applyProperty("source", dst, src);
            _applyProperty("vscode", dst, src);
            _applyProperty("log", dst, src);
            if (dst.log.color) {
                const clr = dst.log.color;
                apply(dst.log.colors, { valueStar: clr, buildBracket: clr, tagBracket: clr, infoIcon: clr });
            }
            apply(dst, { mode: dst.mode || this.mode, target: this.getTarget(dst), type: this.getType(dst) });
            return dst;
        };

        this.logger.write("configure defined builds", 1);

        this.initializeBaseRc(this);
        this.builds.forEach((build) => {
            _log(build, "apply base configuration to");
            _applyRc(build, this);
        });

        const modeRc = /** @type {Partial<typedefs.WpwBuildModeConfig>} */(this[this.mode]);
        asArray(modeRc?.builds).forEach((modeBuild) =>
        {
            const baseBuild = this.builds.find(base => base.name === modeBuild.name);
            if (baseBuild) {
                this.initializeBaseRc(modeBuild);
                _log(baseBuild, "apply mode configuration to");
                _applyRc(baseBuild, modeBuild);
            }
            else {
                _log(modeBuild, "add");
                _log(modeBuild, "apply base configuration to");
                this.builds.push(_applyRc(merge({}, modeBuild), this));
            }
        });

        this.builds.forEach((build) =>
        {
            _log(build, "validate and initialize configuration for ");
            this.initializeBaseRc(build);
            this.resolvePaths(build);
            this.configureSourceCode(build);
            this.resolveAliasPaths(build);
            for (const [ option, config ] of Object.entries(build.options))
            {
                if (!config || config.enabled === false || isObjectEmpty(config)) {
                    delete build.options[option];
                }
            }
            validateSchema(build, this.logger, "build");
        });

        this.logger.write("build configuration complete", 2);
    };


	/**
	 * @private
	 * @param {typedefs.WpwBuild} build
	 */
    configureSourceCode = (build) =>
    {
        const buildSourceConfig = merge({}, build.source);
        build.source = new WpwSourceCode(buildSourceConfig, build, this.logger);
        this.disposables.push(/** @type {WpwSourceCode} */(build.source));
    };


    /**
     * @param {string} name
     * @returns {typedefs.WpBuildApp | undefined}
     */
    getApp = (name) => this.apps.find(a => a.build.type === name || a.build.name === name);


    /**
     * @param {string} name
     * @returns {typedefs.WpwBuild | undefined}
     */
    getBuild = (name) => this.builds.find(b => b.type === name || b.name === name);


    /**
     * @private
     * @template {boolean | undefined} T
     * @template {typedefs.WebpackMode | typedefs.WpwWebpackMode} R = T extends false | undefined ? typedefs.WebpackMode : typedefs.WpwWebpackMode
     * @param {typedefs.WpBuildRuntimeEnvArgs} arge Webpack build environment
     * @param {typedefs.WebpackRuntimeArgs} argv Webpack command line args
     * @param {T} [wpBuild] Convert to WpwWebpackMode @see {@link typedefs.WpwWebpackMode WpwWebpackMode}
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
     * @private
     * @param {typedefs.WpwBuildModeConfigBase} rc
     */
    initializeBaseRc = (rc) =>
    {
        if (!rc.options) { rc.options = {}; }
        if (!rc.log) {
            rc.log = WpBuildConsoleLogger.defaultOptions();
        }
        else
        {   if (!rc.log.colors) {
                rc.log.colors = WpBuildConsoleLogger.defaultOptions().colors;
            }
            else if (!rc.log.colors.default) {
                rc.log.colors.default = WpBuildConsoleLogger.defaultOptions().colors.default;
            }
            if (!rc.log.pad) {
                rc.log.pad = WpBuildConsoleLogger.defaultOptions().pad;
            }
        }
        if (!rc.paths) {
            rc.paths = { base: ".", src: "src", dist: "dist", ctx: ".", temp: this.defaultTempDir };
        }
        else
        {   if (!rc.paths.base) { rc.paths.base = "."; }
            if (!rc.paths.src) { rc.paths.src = "src"; }
            if (!rc.paths.dist) { rc.paths.dist = "dist"; }
            if (!rc.paths.ctx) { rc.paths.ctx = "."; }
            if (!rc.paths.temp) { rc.paths.temp = this.defaultTempDir; }
        }
        if (!rc.source)
        {
            rc.source = {
                type: "javascript", ext: "ts",
                config: { options: { compilerOptions: {}, files: [] }, excludeAbs: [], includeAbs: [] }
            };
        }
        else
        {   if (!rc.source.type) {
                rc.source.type = "javascript";
            }
            if (!rc.source.config) {
                rc.source.config = {
                    options: { compilerOptions: {}, files: [] }, excludeAbs: [], includeAbs: []
                };
            }
            else if (!rc.source.config.options) {
                rc.source.config.options = { compilerOptions: {}, files: [] };
            }
        }
    };


    /**
     * @private
     * @param {typedefs.WpBuildRuntimeEnvArgs} arge
     * @param {typedefs.WebpackRuntimeArgs} argv
     */
    printBanner = (arge, argv) =>
    {
        const name = this.pkgJson.displayName || this.pkgJson.scopedName.name;
        WpBuildConsoleLogger.printBanner(
            name, this.pkgJson.version || "1.0.0",
            ` Start Webpack Build for ${this.pkgJson.name}`,
            (l) => {
                l.write("   Mode  : " + l.withColor(this.mode, l.colors.grey), 1, "", 0, l.colors.white);
                l.write("   Argv  : " + l.withColor(JSON.stringify(argv), l.colors.grey), 1, "", 0, l.colors.white);
                l.write("   Env   : " + l.withColor(JSON.stringify(arge), l.colors.grey), 1, "", 0, l.colors.white);
                l.sep();
            }, this.logger
        );
    };


    /**
     * @private
     * @param {typedefs.WpwBuild} build
     */
    resolveAliasPaths = (build) =>
    {
        if (!build.alias) { return; }

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
                if (paths) asArray(paths).forEach((p) => _pushAlias(key, resolvePath(jstsDir, p)), this);
            });
        }

        if (!alias[":env"])
        {
            const basePath = build.paths.base,
                  srcPath = relativePath(basePath, build.paths.src),
                  envGlob = `**/${srcPath}/**/{env,environment,target}/${build.target}/`,
                  envDirs = findFilesSync(envGlob, { cwd: basePath, absolute: true, dotRelative: false });
            envDirs.forEach((path) => _pushAlias(":env", path), this);
        }
    };


	/**
	 * @private
	 * @param {typedefs.WpwBuild} build
	 */
	resolvePaths = (build) =>
	{
        const base = dirname(this.pkgJsonPath),
              // @ts-ignore
              ostemp = os.tmpdir ? os.tmpdir() : os.tmpDir(),
			  temp = resolve(ostemp ? `${ostemp}${sep}${this.pkgJson.scopedName.name}` : this.defaultTempDir, build.mode);
		if (!existsSync(temp)) {
			mkdirSync(temp, { recursive: true });
		}
        build.paths.base = base;
        build.paths.temp = build.paths.temp && build.paths.temp !== this.defaultTempDir ? build.paths.temp : temp;
        build.paths.ctx = build.paths.ctx ? resolvePath(base, build.paths.ctx) : base;
        build.paths.src = resolvePath(base, build.paths.src || "src");
        build.paths.dist = resolvePath(base, build.paths.dist || "dist");
	};

}


module.exports = WpwRc;
