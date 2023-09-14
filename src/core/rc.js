/* eslint-disable jsdoc/valid-types */
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
const WpwBase = require("./base");
const WpwBuild = require("./build");
const typedefs = require("../types/typedefs");
const { readFileSync, existsSync, mkdirSync } = require("fs");
const { resolve, basename, join, dirname, sep } = require("path");
const { WpwPackageJsonKeys, WpwBuildBaseConfigKeys } = require("../types/constants");
const { validateSchema, SchemaDirectory, getSchemaVersion } = require("../utils/schema");
const {
    WpwError, apply, pick, isString, merge,asArray, isObject, WpwLogger, clone, applyIf, resolvePath, pickNot
} = require("../utils");


/**
 * @extends {WpwBase}
 * @implements {typedefs.IWpwSchema}
 */
class WpwRc extends WpwBase
{
    /** @type {typedefs.WpwWebpackAliasConfig} */
    alias;
    /** @type {WpwBuild[]} */
    apps;
    /** @type {typedefs.WpwRuntimeEnvArgs} */
    arge;
    /** @type {typedefs.WpwCombinedRuntimeArgs} */
    args;
    /** @type {typedefs.WebpackRuntimeArgs} */
    argv;
    /** @type {typedefs.WpwBuildConfig[]} */
    builds;
    /** @type {typedefs.WpwBuildBaseConfig} */
    development;
    /** @type {typedefs.WpwLog} */
    log;
    /** @type {typedefs.WpwWebpackMode} */
    mode;
    /** @type {typedefs.WpwRcPaths} */
    paths;
    /** @type {typedefs.WpwPackageJson} */
    pkgJson;
    /** @type {string} @private */
    pkgJsonPath;
    /** @type {typedefs.WpwBuildOptions} */
    options;
    /** @type {typedefs.WpwBuildBaseConfig} */
    production;
    /** @type {boolean} */
    publicInfoProject;
    /** @type {string} */
    $schema;
    /** @type {typedefs.WpwVersionString} */
    schemaVersion;
    /** @type {typedefs.IWpwSourceCode} */
    source;
    /** @type {typedefs.WpwBuildBaseConfig} */
    test;
    /** @type {typedefs.WpwVersionString}/ */
    version;
    /** @type {typedefs.WpwVsCode}/ */
    vscode;
    /** @type {typedefs.WpwVersionString} */
    wpwVersion;


    /**
     * Top level rc configuration wrapper.  Initializes build configurations and Wraps
     * all build level 'WpBuildRcApp' instances.  Builds are initialized by merging
     * each layer's configuration from top level down, (i.e. the top level, `this`, and
     * the current mode/environement e.g. `production`) into each defined build config.
     *
     * @see {@link WpwRc.create WpwRc.create()} for wbbuild initiantiation process
     * @see {@link WpwBuild} for build lvel wrapper defintion.  Stupidly named `app` (???).
     * @private
     * @param {typedefs.WebpackRuntimeArgs} argv
     * @param {typedefs.WpwRuntimeEnvArgs} arge
     */
    constructor(argv, arge)
    {
        super({ argv, arge });
        Object.keys(arge).filter(k => isString(arge[k]) && /true|false/i.test(arge[k])).forEach((k) => {
            arge[k] = arge[k].toLowerCase() === "true";
        });
        apply(this,
        {
            args: apply({}, arge, argv),
            mode: this.getMode(arge, argv, true),
            arge, argv, apps: [], errors: [], pkgJson: {}, warnings: []
        });
        // applySchemaDefaults(this, "WpwSchema");
        this.applyJsonFromFile(this, ".wpbuildrc.defaults.json", SchemaDirectory);
        this.applyJsonFromFile(this, ".wpbuildrc.json");
        this.applyPackageJson();
        this.initializeLogger();
        this.applyVersions();
        this.mergeBuildConfigs();
        validateSchema(this, "WpwSchema", this.logger);
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
     * @throws {WpwError}
     */
    applyJsonFromFile(thisArg, file, dirPath = resolve(), ...properties)
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
            if (parentDir === dirPath)
            {
                throw new WpwError({
                    code: WpwError.Msg.ERROR_RESOURCE_MISSING,
                    message: `Could not locate or parse '${basename(file)}', check existence or syntax`
                });
            }
            return this.applyJsonFromFile(thisArg, file, parentDir);
        }
    }

    /**
     * @private
     */
    applyPackageJson()
    {
        const pkgJson = this.applyJsonFromFile(this.pkgJson, "package.json", resolve(), ...WpwPackageJsonKeys);
        this.pkgJsonPath = pkgJson.path;
        const nameData = pkgJson.data.name.split("/");
        apply(this.pkgJson, {
            scopedName: {
                name: nameData.length > 1 ? nameData[1] : nameData[0],
                scope: nameData.length > 1 ? nameData[0] : undefined
            }
        });
    }


    /**
     * @private
     */
    applyVersions()
    {
        const wpwVersion = JSON.parse(readFileSync(resolve(__dirname, "../../package.json"), "utf8")).version;
        apply(this, { schemaVersion: getSchemaVersion(), version: this.pkgJson.version, wpwVersion });
    }


    /**
     * @private
     * @param {typedefs.IWpwBuildBaseConfig} config
     * @returns {Omit<typedefs.IWpwBuildBaseConfig, "builds">}
     */
    getBasePropertyConfig(config) { return pickNot(pick(config, ...WpwBuildBaseConfigKeys), "builds"); }


    /**
     * Base entry function to initialize build configurations and provide the webpack
     * configuration export(s) to webpack.config.js.
     *
     * @param {typedefs.WebpackRuntimeArgs} argv
     * @param {typedefs.WpwRuntimeEnvArgs} arge
     * @returns {typedefs.WpwWebpackConfig[]} arge
     */
    static create(argv, arge)
    {
        const rc = new WpwRc(argv, arge); // Create the top level build wrapper
        rc.maybeAddTypesBuild();
        //
        // Instantiate all 'app' instances first, then call buildWrapper() on each one to
        // return the webpack config, as some configuration exports will need information
        // from the other defined builds
        //
        rc.apps.push(
            ...rc.builds.filter(
                (b) => (!arge.build || b.name === arge.build) && !rc.apps.find((a) => a.type === b.type)
            )
            .map((build) => new WpwBuild(build, rc))
        );
        //
        // Call app.buildWrapper() on each 'app' instance to create the webpack configuration
        // for each active build, and return the array of resulting configurtaions.  These are
        // exported to the webpack process in the caller module and the compilation begins.
        //
        return rc.apps.map((build) =>
        {
            if (!build.mode || !build.target || !build.type) {
                throw WpwError.getErrorProperty("type");
            }
            build.active = true;
            return build.webpackExports();
        });
    }


    /**
     * @param {string} nameOrType
     * @returns {typedefs.WpwBuild | undefined}
     */
    getBuild(nameOrType) { return this.apps.find(a => a.type === nameOrType || a.name === nameOrType); }


    /**
     * @private
     * @template {boolean | undefined} T
     * @template {T extends false | undefined ? Exclude<typedefs.WebpackMode, undefined> : Exclude<typedefs.WpwWebpackMode, undefined>} R
     * @param {typedefs.WpwRuntimeEnvArgs | typedefs.WpwCombinedRuntimeArgs} arge Webpack build environment
     * @param {typedefs.WebpackRuntimeArgs | typedefs.WpwCombinedRuntimeArgs | undefined | null} argv Webpack command line args
     * @param {T} [wpBuild] Convert to WpwWebpackMode @see {@link typedefs.WpwWebpackMode WpwWebpackMode}, i.e. convert mode `none` to mode `test`
     * @returns {R}
     */
    getMode(arge, argv, wpBuild)
    {
        let mode = argv?.mode || arge.mode || "production";
        if (wpBuild === true && mode === "none") { mode = "test"; }
        else if (!wpBuild && mode === "test") { mode = "none"; }
        return /** @type {R} */(mode);
    }


    initializeLogger()
    {
        this.logger = new WpwLogger(merge({}, this.log, { envTag1: "wpw", envTag2: "main" }));
        this.printBanner();
    }


    maybeAddTypesBuild()
    {
        if (this.hasTypes) // Some build require types to be built, auto-add the types build if defined, and
        {               // a dependency of the single build
            const typesBuild = this.getBuild("types");
            if (typesBuild && this.args.build !== typesBuild.name && (!this.isSingleBuild || !existsSync(typesBuild.paths.dist)))
            {
                for (const a of this.apps)
                {
                    const dependsOnTypes = (isObject(a.entry) && a.entry.dependOn === "types") ||
                                           a.options.wait?.items?.find(w => w.name === "types");
                    if (!this.isSingleBuild || dependsOnTypes)
                    {
                        if (asArray(a.options.wait?.items).find(t => t.name === "types"))
                        {
                            this.apps.push(new WpwBuild(apply(typesBuild, { auto: true }), this));
                            break;
                        }
                    }
                }
            }
        }
    }


	/**
	 * Add all defined builds to the root builds array, i.e. those defined in root 'builds'
     * already, and/or defined in the current environment's config. Merge in all levels of
     * build configurations, including root level, environment level, and the individual
     * build config itself havign the highest merge priority.
     *
	 * @private
	 */
    mergeBuildConfigs()
    {
        const configs = /** @type {typedefs.IWpwBuildConfig[]} */[],
              rootBaseConfig = this.getBasePropertyConfig(this),
              baseBuildConfigs = clone(this.builds),
              modeConfig = /** @type {typedefs.IWpwBuildBaseConfig} */(this[this.mode]),
              modeBaseConfig = this.getBasePropertyConfig(modeConfig),
              modeBuildConfigs = modeConfig.builds,
              emptyConfig = () => /** @type {typedefs.IWpwBuildConfig} */({});

        this.logger.write("merge all levels of build configurations to root config", 1);
        //
        // First loop all builds that werw defeined in sechema.builds `baseBuildConfigs`. Then merge
        // in both thw base configuration properties in the root level schema/rc, and then the build
        // configuration itself
        //
        baseBuildConfigs.forEach((config) =>
        {
            this.touchBuildOptionsEnabled(config.options);
            configs.push(merge(emptyConfig(), rootBaseConfig, config, modeBaseConfig));
        });
        //
        // Process the current environment's config.  Add all builds defined in the env config that
        // aren't defined at root level, and pply the root base config and mode base cconfig to each.
        // If the build "is" defined already at root level, then merge in the environment config.
        //
        modeBuildConfigs.forEach((config) =>
        {
            let rootBuildConfig = configs.find(bc => bc.name === config.name);
            if (!rootBuildConfig)
            {
                this.touchBuildOptionsEnabled(modeBaseConfig.options);
                rootBuildConfig = merge(emptyConfig(), rootBaseConfig, modeBaseConfig);
                configs.push(rootBuildConfig);
            }
            merge(rootBuildConfig, config);
        });
        //
        // Resolve all defined paths in all root level build config to an absolute path.  If the build
        // config defines `log.color`, then apply that color to some of the base color properties if
        // they are not specifically defined already.
        //
        configs.forEach((config) =>
        {
            applyIf(config, { mode: this.mode });
            if (config.log.color) {
                const c = config.log.color;
                applyIf(config.log.colors, { valueStar: c, buildBracket: c, tagBracket: c, infoIcon: c });
            }
            this.resolvePaths(config);
        });
        this.builds = configs;
    }


    /**
     * @private
     */
    printBanner()
    {
        const name = this.pkgJson.displayName || this.pkgJson.scopedName.name;
        WpwLogger.printBanner(
            name, this.pkgJson.version || "1.0.0",
            ` Start Webpack Build for ${this.pkgJson.name}`,
            (l) => {
                l.write("   Mode  : " + l.withColor(this.mode, l.colors.grey), 1, "", 0, l.colors.white);
                l.write("   Argv  : " + l.withColor(this.jsonStringifySafe(this.argv), l.colors.grey), 1, "", 0, l.colors.white);
                l.write("   Env   : " + l.withColor(this.jsonStringifySafe(this.arge), l.colors.grey), 1, "", 0, l.colors.white);
                l.sep();
            }, this.logger
        );
    }


    /**
     * @private
     * @param {typedefs.IWpwBuildConfig} buildConfig
     */
    resolvePaths = (buildConfig) =>
    {
         const paths = buildConfig.paths,
               base = dirname(this.pkgJsonPath),
               // @ts-ignore
               ostemp = os.tmpdir ? os.tmpdir() : os.tmpDir(),
               defaultTempDir = `node_modules${sep}.cache${sep}wpwrap${sep}temp`,
               temp = resolve(
                   ostemp ? `${ostemp}${sep}${this.pkgJson.scopedName.name}` : defaultTempDir,
                   `${buildConfig.target}${sep}${buildConfig.mode}`
               );
        paths.base = base;
        paths.temp = paths.temp && paths.temp !== defaultTempDir ? paths.temp : temp;
        paths.ctx = paths.ctx ? resolvePath(base, paths.ctx) : base;
        paths.src = resolvePath(base, paths.src || "src");
        paths.dist = resolvePath(base, paths.dist || "dist");
        if (!existsSync(paths.temp)) {
            mkdirSync(paths.temp, { recursive: true });
        }
    };


    /**
     * @param {typedefs.WpwBuildOptions | undefined} options
     */
    touchBuildOptionsEnabled(options)
    {
        if (!options) { return; }
        Object.keys(options).filter(k => isObject(options[k])).forEach((k) =>
        {
            options[k].enabled = options[k].enabled !== false ? true : false;
        });
    }

}


module.exports = WpwRc;
