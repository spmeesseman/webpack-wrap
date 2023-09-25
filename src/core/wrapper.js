/* eslint-disable jsdoc/valid-types */
/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/**
 * @file src/core/wrapper.js
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
const { validateSchema, getSchemaVersion, applySchemaDefaults } = require("../utils/schema");
const {
    WpwError, apply, pick, isString, merge,asArray, isObject, WpwLogger, applyIf, resolvePath, pickNot
} = require("../utils");


/**
 * @extends {WpwBase}
 * @implements {typedefs.IWpwSchema}
 */
class WpwWrapper extends WpwBase
{
    /**
     * @type {typedefs.WpwRuntimeEnvArgs}
     */
    arge;
    /**
     * @type {typedefs.WpwCombinedRuntimeArgs}
     */
    args;
    /**
     * @type {typedefs.WebpackRuntimeArgs}
     */
    argv;
    /**
     * @type {WpwBuild[]}
     */
    builds;
    /**
     * @type {typedefs.IWpwBuildConfig[]}
     */
    buildConfigs;
    /**
     * @type {typedefs.WpwBuildBaseConfig}
     */
    development;
    /**
     * @type {typedefs.WpwLog}
     */
    log;
    /**
     * @type {typedefs.WpwWebpackMode}
     */
    mode;
    /**
     * @type {typedefs.WebpackConfigOverride}
     */
    overrides;
    /**
     * @type {typedefs.WpwRcPaths}
     */
    paths;
    /**
     * @type {typedefs.WpwPackageJson}
     */
    pkgJson;
    /**
     * @private
     * @type {string}
     */
    pkgJsonPath;
    /**
     * @type {typedefs.WpwBuildOptions}
     */
    options;
    /**
     * @type {typedefs.WpwBuildBaseConfig}
     */
    production;
    /**
     * @type {boolean}
     */
    publicInfoProject;
    /**
     * @type {string}
     */
    $schema;
    /**
     * @type {typedefs.WpwVersionString}
     */
    schemaVersion;
    /**
     * @type {typedefs.IWpwSourceConfig}
     */
    source;
    /**
     * @type {typedefs.WpwBuildBaseConfig}
     */
    test;
    /**
     * @type {typedefs.WpwVersionString}
     */
    version;
    /**
     * @type {typedefs.WpwVsCode}
     */
    vscode;
    /**
     * @type {typedefs.WpwVersionString}
     */
    wpwVersion;


    /**
     * Top level rc configuration wrapper.  Initializes build configurations and wraps
     * all build level wrappers.  Builds are initialized by merging each layer's
     * configuration from top level down, (i.e. the top level, `this`, and the current
     * mode/environement e.g. `production`) into each defined build config.
     *
     * @private
     * @param {typedefs.WebpackRuntimeArgs} argv
     * @param {typedefs.WpwRuntimeEnvArgs} arge
     */
    constructor(argv, arge)
    {
        super({ argv, arge });
        this.initConfig(argv, arge);
        this.initLogger();
        this.createBuildConfigs();
        validateSchema(this, "WpwSchema", this.logger);
        this.createBuilds();
    };


    get isSingleBuild() { return !!this.args.build && this.builds.length <= 1; }
    get buildCount() { return this.builds.length; }
    get pkgJsonFilePath() { return this.pkgJsonPath; }


    /**
     * @private
     * @param {Record<string, any>} dst
     * @param {string} file
     * @param {string} [dirPath]
     * @param {string[]} properties
     * @returns {string} {string} full path
     * @throws {WpwError}
     */
    applyJsonFromFile(dst, file, dirPath = resolve(), ...properties)
    {
        const path = join(dirPath, file);
        try
        {   let data = JSON5.parse(readFileSync(path, "utf8"));
            if (properties.length > 0) {
                data = pick(data, ...properties);
            }
            merge(dst, data);
            return path;
        }
        catch
        {   const parentDir = dirname(dirPath);
            if (parentDir === dirPath)
            {
                throw new WpwError({
                    code: WpwError.Code.ERROR_RESOURCE_MISSING,
                    message: `Could not locate or parse '${basename(file)}', check existence or syntax`
                });
            }
            return this.applyJsonFromFile(dst, file, parentDir);
        }
    }


    /**
     * @private
     */
    applyPackageJson()
    {
        this.pkgJsonPath = this.applyJsonFromFile(this.pkgJson, "package.json", resolve(), ...WpwPackageJsonKeys);
        this.version = this.pkgJson.version;
        const nameData = this.pkgJson.name.split("/");
        apply(this.pkgJson, {
            scopedName: {
                name: nameData.length > 1 ? nameData[1] : nameData[0],
                scope: nameData.length > 1 ? nameData[0] : undefined
            }
        });
    }


    /**
     * Base entry function on startup
     *
     * @param {typedefs.WebpackRuntimeArgs} argv
     * @param {typedefs.WpwRuntimeEnvArgs} arge
     * @returns {typedefs.WpwWebpackConfig[]} WpwWebpackConfig[] array of webpack configuration exports
     */
    static create = (argv, arge) => new WpwWrapper(argv, arge).builds.map(b => b.wpc);


    /**
     * @private
     */
    createBuilds()
    {
        this.builds.push(
            ...this.buildConfigs.filter(
                (b) => (!this.arge.build || b.name === this.arge.build || b.type === this.arge.build)
            )
            .map(b => new WpwBuild(b, this))
        );
        this.maybeAddTypesBuild();
        this.builds.forEach(b => b.webpackExports());
        if (this.builds.length === 0)
        {
            this.logger.warning("no builds created, dumping configurations:");
            this.logger.write(JSON.stringify(this.buildConfigs, null, 4), undefined, "", this.logger.icons.color.warning);
            this.logger.write("exit");
        }
    }


	/**
	 * @private
	 */
    createBuildConfigs()
    {
        this.logger.write("merge all levels of build configurations to root config", 1);
        const rootBaseConfig = this.getBasePropertyConfig(this),
              baseBuildConfigs = this.builds.splice(0),
              modeConfig = /** @type {typedefs.IWpwBuildBaseConfig} */(this[this.mode]),
              modeBaseConfig = this.getBasePropertyConfig(modeConfig),
              modeBuildConfigs = modeConfig.builds,
              emptyConfig = () => /** @type {typedefs.IWpwBuildConfig} */({});
        //
        // First loop all builds that were defined in wpwrc.builds
        //
        baseBuildConfigs.forEach((config) =>
        {
            this.buildConfigs.push(merge(emptyConfig(), rootBaseConfig, config, modeBaseConfig));
        });
        //
        // Process the current environment's config.  Add all builds defined in the env config that
        // aren't defined at root level, and apply the base config and mode cconfig to each. If the
        // build "is" defined already at root level, merge in the environment config.
        //
        modeBuildConfigs.forEach((config) =>
        {
            let rootBuildConfig = this.buildConfigs.find(bc => bc.name === config.name);
            if (!rootBuildConfig)
            {
                rootBuildConfig = merge(emptyConfig(), rootBaseConfig, modeBaseConfig);
                this.buildConfigs.push(rootBuildConfig);
            }
            merge(rootBuildConfig, config);
        });
        //
        // Resolve all configured paths to absolute and apply color transformations
        //
        this.buildConfigs.forEach((config) =>
        {
            applyIf(config, { mode: this.mode });
            if (config.log.color) {
                const c = config.log.color;
                applyIf(config.log.colors, { valueStar: c, buildBracket: c, tagBracket: c, infoIcon: c });
            }
            this.touchBuildOptionsEnabled(config.options);
            this.resolvePaths(config);
        });
    }


    /**
     * @private
     * @param {typedefs.IWpwBuildBaseConfig} config
     * @returns {Omit<typedefs.IWpwBuildBaseConfig, "builds">}
     */
    getBasePropertyConfig(config) { return pickNot(pick(config, ...WpwBuildBaseConfigKeys), "builds"); }


    /**
     * @param {string} nameOrType
     * @returns {typedefs.IWpwBuildConfig | undefined}
     */
    getBuildConfig(nameOrType) { return this.buildConfigs.find(b => b.type === nameOrType || b.name === nameOrType); }


    /**
     * @private
     * @template {boolean | undefined} T
     * @template {T extends false | undefined ? Exclude<typedefs.WebpackMode, undefined> : Exclude<typedefs.WpwWebpackMode, undefined>} R
     * @param {typedefs.WpwRuntimeEnvArgs | typedefs.WpwCombinedRuntimeArgs} arge Webpack build environment
     * @param {typedefs.WebpackRuntimeArgs | typedefs.WpwCombinedRuntimeArgs | undefined | null} argv Webpack command line args
     * @param {T} [wpw] Convert to WpwWebpackMode @see {@link typedefs.WpwWebpackMode WpwWebpackMode}, i.e. convert mode `none` to mode `test`
     * @returns {R}
     */
    getMode(arge, argv, wpw)
    {
        let mode = argv?.mode || arge.mode || "production";
        if (wpw === true && mode === "none") { mode = "test"; }
        else if (!wpw && mode === "test") { mode = "none"; }
        return /** @type {R} */(mode);
    }


    /**
     * @private
     * @param {typedefs.WebpackRuntimeArgs} argv
     * @param {typedefs.WpwRuntimeEnvArgs} arge
     */
    initConfig(argv, arge)
    {
        Object.keys(arge).filter(k => isString(arge[k]) && /true|false/i.test(arge[k])).forEach((k) => {
            arge[k] = arge[k].toLowerCase() === "true";
        });
        apply(this,
        {
            schemaVersion: getSchemaVersion(),
            mode: this.getMode(arge, argv, true),
            arge, argv, args: apply({}, arge, argv),
            buildConfigs: [], errors: [], pkgJson: {}, warnings: [],
            wpwVersion: JSON.parse(readFileSync(resolve(__dirname, "../../package.json"), "utf8")).version
        });
        applySchemaDefaults(this, "WpwSchema");
        this.applyJsonFromFile(this, ".wpwrc.json");
        this.applyPackageJson();
    }


    /**
     * @private
     */
    initLogger()
    {
        this.logger = new WpwLogger(merge({}, this.log, { envTag1: "wpw", envTag2: "main" }));
        this.printBanner();
    }


    /**
     * @private
     */
    maybeAddTypesBuild()
    {
        const typesBuild = this.getBuildConfig("types");
        if (typesBuild && this.args.build !== typesBuild.name && (!this.isSingleBuild || !existsSync(typesBuild.paths.dist)))
        {
            for (const b of this.builds)
            {
                const dependsOnTypes = (isObject(b.entry) && b.entry.dependOn === "types") ||
                                        b.options.wait?.items?.find(w => w.name === "types");
                if (!this.isSingleBuild || dependsOnTypes)
                {
                    if (asArray(b.options.wait?.items).find(t => t.name === "types"))
                    {
                        this.builds.push(new WpwBuild(apply(typesBuild, { auto: true }), this));
                        break;
                    }
                }
            }
        }
    }


    /**
     * @private
     */
    printBanner()
    {
        const name = this.pkgJson.displayName || this.pkgJson.scopedName.name;
        WpwLogger.printBanner(name, this.pkgJson.version || "1.0.0", ` Start Webpack Build for ${this.pkgJson.name}`,
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
                   `${buildConfig.name}${sep}${buildConfig.mode}`
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
     * @private
     * @param {typedefs.WpwBuildOptions | undefined} options
     */
    touchBuildOptionsEnabled(options)
    {
        if (!options) { return; }
        Object.keys(options).forEach((k) =>
        {
            applySchemaDefaults(options[k], "WpwBuildOptions", k);
            if (isObject(options[k]))
            {
                if (options[k].enabled === false) {
                    delete options[k];
                }
                else {
                    options[k].enabled = true;
                }
            }
            else if (options[k] === true) {
                options[k].enabled = { enabled: true };
            }
            else if (options[k] === false) {
                delete options[k];
            }
            else {
                throw new WpwError({ code: WpwError.Code.ERROR_SCHEMA, message: `invalid build options [${k}]` });
            }
        });
    }

}


module.exports = WpwWrapper;
