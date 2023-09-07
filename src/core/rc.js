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
const WpwBase = require("./base");
const WpBuildApp = require("./app");
const WpwBuild = require("./build");
const WpwSourceCode = require("./sourcecode");
const { readFileSync, existsSync } = require("fs");
const { resolve, basename, join, dirname } = require("path");
const { validateSchema, SchemaDirectory, getSchemaVersion } = require("../utils/schema");
const { isWpwWebpackMode, WpwPackageJsonProps } = require("../types/constants");
const {
    WpBuildError, apply, pick, isString, merge,asArray, isObject, WpwLogger, typedefs, isPromise, clone
} = require("../utils");


/**
 * @extends {WpwBase}
 * @implements {typedefs.IWpwRcSchema}
 */
class WpwRc extends WpwBase
{
    /** @type {typedefs.WpwWebpackAliasConfig} */
    alias;
    /** @type {WpBuildApp[]} */
    apps;
    /** @type {typedefs.WpBuildCombinedRuntimeArgs} */
    args;
    /** @type {typedefs.WpwBuild[]} */
    builds;
    /** @type {typedefs.WpwBuildModeConfig} */
    development;
    /** @type {Array<typedefs.IDisposable>} */
    disposables;
    /** @type {typedefs.WpwLog} */
    log;
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
        super({});
        this.disposables = [];
        Object.keys(arge).filter(k => isString(arge[k]) && /true|false/i.test(arge[k])).forEach((k) => {
            arge[k] = arge[k].toLowerCase() === "true";
        });
        apply(this, { apps: [], errors: [], warnings: [], args: apply({}, arge, argv), pkgJson: {} });
        const rcDefaults = this.applyJsonFromFile(this, ".wpbuildrc.defaults.json", SchemaDirectory);
        const rcProject = this.applyJsonFromFile(this, ".wpbuildrc.json");
        this.applyPackageJson();
        this.logger = new WpwLogger({ envTag1: "rc", envTag2: "init", ...this.log });
		this.applyModeArgument(argv, arge);
        this.printBanner(arge, argv);
        if (this.logger.level >= 4) { validateSchema(rcDefaults.data, this.logger); }
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
        this.logger.write("dispose main rc wrapper instance", 3);
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
        this.logger.write("configure all defined builds", 1);
        const buildConfigs = clone(this.builds || []);
        this.builds = [];
        const modeRc = /** @type {Partial<typedefs.WpwBuildModeConfig>} */(this[this.mode]);
        asArray(modeRc?.builds).filter(mc => !buildConfigs.find(bc => mc.name === bc.name)).forEach((modeBuildRc) =>
        {
            buildConfigs.push(merge({}, modeBuildRc));
        });
        buildConfigs.forEach((config) =>
        {
            this.builds.push(new WpwBuild(config, this));
        });
        this.disposables.push(...this.builds);
        this.logger.write("build configuration complete", 2);
    };


    /**
     * Base entry function to initialize build configurations and provide the webpack
     * configuration export(s) to webpack.config.js.
     *
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
                        if (asArray(a.build.options.wait?.items).find(t => t.target === "types"))
                        {
                            rc.apps.push(new WpBuildApp(rc, typesBuild));
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
            .map((build) => new WpBuildApp(rc, build))
        );

        for (const app of rc.apps)
        {
            if (!app.build.mode || !app.build.target || !app.build.type) {
                throw WpBuildError.getErrorProperty("type");
            }
            wpConfigs.push(app.buildWrapper());
            apply(app.build, { active: true });
        }

        return wpConfigs;
    };


    /**
     * @param {string} nameOrType
     * @returns {typedefs.WpBuildApp | undefined}
     */
    getBuildWrapper = (nameOrType) => this.apps.find(a => a.build.type === nameOrType || a.build.name === nameOrType);


    /**
     * @param {string} nameOrType
     * @returns {typedefs.WpwBuild | undefined}
     */
    getBuild = (nameOrType) => this.getBuildWrapper(nameOrType)?.build;


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

}


module.exports = WpwRc;
