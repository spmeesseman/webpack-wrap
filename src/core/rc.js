/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/**
 * @file utils/app.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const JSON5 = require("json5");
const WpBuildApp = require("./app");
const WpwSourceCode = require("./sourcecode");
const WpwPlugin = require("../plugins/base");
const globalEnv = require("../utils/global");
const { readFileSync, existsSync } = require("fs");
const { resolve, basename, join, dirname, sep } = require("path");
const { validateSchema, SchemaDirectory, getSchemaVersion } = require("../utils/schema");
const { isWpwWebpackMode, WpwPackageJsonProps } = require("../types/constants");
const {
    WpBuildError, apply, pick, isString, merge, isArray, resolvePath, asArray, findFilesSync,
    relativePath, isObject, WpwLogger, typedefs, isPromise, clone, mergeIf
} = require("../utils");
const WpwBuild = require("./build");


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
    /** @type {typedefs.WpwBuild[]} */
    builds;
    /** @type {typedefs.IWpwBuild[]} */
    buildConfigs;
    /** @type {typedefs.WpwBuildModeConfig} */
    development;
    /** @type {Array<typedefs.IDisposable>} */
    disposables;
    /** @type {typedefs.WpBuildGlobalEnvironment} */
    global;
    /** @type {typedefs.WpwLog} */
    log;
    /** @type {WpwLogger} @private */
    logger;
    /** @type {typedefs.WpwWebpackMode} */
    mode;
    /** @type {typedefs.WpwRcPaths} */
    paths;
    /** @type {typedefs.WpwPackageJson} */
    pkgJson;
    /** @type {string} */
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
     *
     * @see {@link WpwRc.create WpwRc.create()} for wbbuild initiantiation process
     * @see {@link WpBuildApp} for build lvel wrapper defintion.  Stupidly named `app` (???).
     * @private
     * @param {typedefs.WebpackRuntimeArgs} argv
     * @param {typedefs.WpBuildRuntimeEnvArgs} arge
     */
    constructor(argv, arge)
    {
        this.disposables = [];
        Object.keys(arge).filter(k => isString(arge[k]) && /true|false/i.test(arge[k])).forEach((k) => {
            arge[k] = arge[k].toLowerCase() === "true";
        });
        apply(this, { apps: [], errors: [], warnings: [], args: apply({}, arge, argv), global: globalEnv, pkgJson: {} });
        const rcDefaults = this.applyJsonFromFile(this, ".wpbuildrc.defaults.json", SchemaDirectory);
        const rcProject = this.applyJsonFromFile(this, ".wpbuildrc.json");
        this.applyPackageJson();
        this.logger = new WpwLogger({ envTag1: "rc", envTag2: "init", ...this.log });
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
            if (isPromise(result)) { await result; }
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
            merge(thisArg, data);
            return { path, data };
        }
        catch
        {   const parentDir = dirname(dirPath);
            if (parentDir === dirPath) {
                throw new WpBuildError(`Could not locate or parse '${basename(file)}', check existence or syntax`);
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
            throw WpBuildError.getErrorMissing("mode");
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
	 * Merges the base rc level and the environment level configurations into each
	 * build configuration and update`this.builds` with fully configured build defs
     *
	 * @private
	 */
    configureBuilds = () =>
    {
        //
        // Merge the base rc config into the build
        //
        this.logger.write("configure defined builds", 1);

        const baseRc = {
            options: this.options,
            paths: this.paths,
            log: this.log,
            alias: this.alias
        };

        this.buildConfigs = clone(this.builds);
        this.builds = [];
        // this.buildConfigs.forEach((buildConfig) => { mergeIf(buildConfig, baseRc); });

        const modeRc = /** @type {Partial<typedefs.WpwBuildModeConfig>} */(this[this.mode]);
        asArray(modeRc?.builds).forEach((modeBuildRc) =>
        {
            // const baseBuild = this.buildConfigs.find(base => base.name === modeBuild.name);
            // if (baseBuild) {
            //     merge(baseBuild, modeBuild);
            // }
            // else {
            //     this.buildConfigs.push(mergeIf(merge({}, modeBuild), baseRc));
            // }
            this.buildConfigs.push(merge({}, modeBuildRc));
        });

        this.buildConfigs.forEach((config) =>
        {
            this.builds.push(new WpwBuild(config, this, this.logger));
        });

        this.logger.write("build configuration complete", 2);
    };


    /**
     * Base entry function to initialize build configurations and provide the webpack
     * configuration export(s) to webpack.config.js.
     *
     * @see example {@link file:///./../examples/webpack.config.js}
     * @param {typedefs.WebpackRuntimeArgs} argv
     * @param {typedefs.WpBuildRuntimeEnvArgs} arge
     * @returns {typedefs.WpwWebpackConfig[]} arge
     */
    static create = (argv, arge) =>
    {
        const wpConfigs = [];
        const rc = new WpwRc(argv, arge); // Create the top level build wrapper
                          //
        if (rc.hasTypes) // Some build require types to be built, auto-add the types build if defined, and
        {               // a dependency of the single build
            const typesBuild = rc.getBuild("types");
            if (typesBuild && arge.build !== typesBuild.name && (!rc.isSingleBuild || !existsSync(typesBuild.paths.dist)))
            {
                for (const a of rc.apps)
                {
                    const dependsOnTypes = (isObject(a.build.entry) && a.build.entry.dependOn === "types");
                    if (!rc.isSingleBuild || dependsOnTypes)
                    {
                        const waitConfig = WpwPlugin.getBuildOptions("wait", a);
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
                throw WpBuildError.getErrorProperty("type");
            } //
             // Alias paths needed to be initialzed "after" app` instance is created (notably the `app.source` instance)
            //
            rc.resolveAliasPaths(app);
            wpConfigs.push(app.buildApp());
            apply(app.build, { active: true });
        }

        return wpConfigs;
    };


    /**
     * @param {string} nameOrType
     * @returns {typedefs.WpBuildApp | undefined}
     */
    getApp = (nameOrType) => this.apps.find(a => a.build.type === nameOrType || a.build.name === nameOrType);


    /**
     * @param {string} nameOrType
     * @returns {typedefs.WpwBuild | undefined}
     */
    getBuild = (nameOrType) => this.getApp(nameOrType)?.build;


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
     * @param {typedefs.WpBuildRuntimeEnvArgs} arge
     * @param {typedefs.WebpackRuntimeArgs} argv
     */
    printBanner = (arge, argv) =>
    {
        const name = this.pkgJson.displayName || this.pkgJson.scopedName.name;
        WpwLogger.printBanner(
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
     * @param {typedefs.WpBuildApp} app
     */
    resolveAliasPaths = (app) =>
    {
        if (!app.build.alias) { return; }

        const alias = app.build.alias,
              jstsConfig = app.source.config,
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
            const basePath = app.build.paths.base,
                  srcPath = relativePath(basePath, app.build.paths.src),
                  envGlob = `**/${srcPath}/**/{env,environment,target}/${app.build.target}/`,
                  envDirs = findFilesSync(envGlob, { cwd: basePath, absolute: true, dotRelative: false });
            envDirs.forEach((path) => _pushAlias(":env", path), this);
        }
    };

}


module.exports = WpwRc;
