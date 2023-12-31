/* eslint-disable jsdoc/valid-types */
/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/**
 * @file src/core/wrapper.js
 * @version 0.0.1
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const os = require("os");
const JSON5 = require("json5");
const WpwBase = require("./base");
const WpwBuild = require("./build");
const WpwLogger = require("../utils/log");
const WpwError = require("../utils/message");
const getConfig = require("../utils/config");
const typedefs = require("../types/typedefs");
const { resolvePath } = require("../utils/utils");
const { readFileSync, existsSync, mkdirSync } = require("fs");
const { resolve, basename, join, dirname, sep } = require("path");
const { WpwPackageJsonKeys, WpwBuildBaseConfigKeys } = require("../types/constants");
const { validateSchema, getSchemaVersion, applySchemaDefaults } = require("../utils/schema");
const { apply, pick, isString, merge, asArray, isObject, applyIf, pickNot } = require("@spmeesseman/type-utils");


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
     * @type {typedefs.WpwPluginConfig[]}
     */
    plugins;
    /**
     * @type {typedefs.WpwBuildOptions}
     */
    options;
    /**
     * @type {typedefs.WpwBuildBaseConfig}
     */
    production;
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
     * @type {typedefs.WpwVsCode}
     */
    vscode;


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
        this.logger.start("initialize build wrapper", 1);
        this.createBuildConfigs();
        validateSchema(this, "WpwSchema", this.logger);
        this.createBuilds();
        this.logger.success("build wrapper initialization complete", 1);
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
                    message: `could not locate or parse '${basename(file)}', check existence or syntax`
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
        const nameData = this.pkgJson.name.split("/");
        apply(this.pkgJson, {
            scopedName: {
                name: nameData.length > 1 ? nameData[1] : nameData[0],
                scope: nameData.length > 1 ? nameData[0] : undefined
            }
        });
    }


    /**
     * Startup function to be called by bin/wpwrap or webpack.config.js.
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
        this.createDependencyBuilds();
        if (this.builds.length > 0)
        {
            for (const build of this.builds) { build.webpackExports(); }
        }
        else
        {   this.logger.warning("0 builds found, dumping all configurations:");
            this.logger.write(JSON.stringify(this.buildConfigs, null, 4), undefined, "", this.logger.icons.color.warning);
            this.logger.write("exit");
        }
    }


	/**
	 * @private
	 */
    createDependencyBuilds()
    {
        const dependentBuilds = [];
        this.logger.write("   create dependency build configurations", 2);

        for (const build of this.builds.filter(b => !!b.options.wait || (isObject(b.entry) &&!!b.entry.dependOn)))
        {
            if (isObject(build.entry) && build.entry.dependOn)
            {
                build.options.wait = apply(build.options.wait, { enabled: true });
                applyIf(build.options.wait, { mode: "event", items: [{ name: Object.keys(build.entry)[0] }]});
            }

            const wait = /** @type {typedefs.IWpwPluginConfigWait} */(build.options.wait);
            for (const waitConfig of asArray(wait.items))
            {
                let isBuilt = false;
                const depBuildConfig = this.buildConfigs.find(b => b.name === waitConfig.name);

                if (!depBuildConfig) { continue; }

                if (depBuildConfig.type === "types" && depBuildConfig.options.types?.bundle) {
                    isBuilt = existsSync(join(depBuildConfig.paths.dist, depBuildConfig.name + ".d.ts"));
                }
                else if (depBuildConfig.type === "script" && depBuildConfig.options.script)
                {
                    if (depBuildConfig.paths.dist && depBuildConfig.paths.dist !== "dist") {
                        isBuilt = existsSync(depBuildConfig.paths.dist);
                    }
                    else
                    {   asArray(depBuildConfig.options.script.items).forEach((s) =>
                        {
                            isBuilt ||= asArray(s.output).every(p => existsSync(resolvePath(this.pkgJsonPath, p)));
                        });
                    }
                }
                else { isBuilt = existsSync(depBuildConfig.paths.dist); }

                let depBuild = this.builds.find(b => b.name === depBuildConfig.name);
                if (isBuilt && !depBuild) { continue; }

                if (!depBuild)
                {
                    this.logger.write(`      auto-enable dependency build '${depBuildConfig.name}`, 2);
                    depBuild = new WpwBuild(apply(depBuildConfig, { auto: true }), this);
                    dependentBuilds.push(depBuild);
                }
                else if (!depBuild.options.wait || !depBuild.options.wait.enabled)
                {
                    this.logger.write(`      auto-apply wait options to dependency build '${waitConfig.name}`, 2);
                }

                depBuild.options.wait = apply(depBuild.options.wait, { enabled: true });
                applyIf(depBuild.options.wait, { mode: "event" });
            }
        }

        if (dependentBuilds.length > 0)
        {
            this.builds.push(...dependentBuilds);
            this.logger.write(`   added ${dependentBuilds.length} dependency build configurations`, 2);
        }
        else {
            this.logger.write("   0 dependency build configurations found", 2);
        }
    }


	/**
	 * @private
	 */
    createBuildConfigs()
    {
        this.logger.write("   merge and create build configurations", 1);
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


    dispose() { this.logger.dispose(); }


    /**
     * @private
     * @param {typedefs.IWpwBuildBaseConfig} config
     * @returns {Omit<typedefs.IWpwBuildBaseConfig, "builds">}
     */
    getBasePropertyConfig(config) { return pickNot(pick(config, ...WpwBuildBaseConfigKeys), "builds"); }


    /**
     * @param {string} nameOrType
     * @returns {typedefs.WpwBuild | undefined}
     */
    getBuild(nameOrType) { return this.builds.find(b => b.type === nameOrType || b.name === nameOrType); }


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
            buildConfigs: [], errors: [], pkgJson: {}, plugins: [], warnings: []
        });
        applySchemaDefaults(this, "WpwSchema");
        this.applyPackageJson();
        merge(this, getConfig(dirname(this.pkgJsonPath)));
    }


    /**
     * @private
     */
    initLogger()
    {
        const l = this.logger = new WpwLogger(merge({}, this.log, { envTag1: "wpw", envTag2: "main", name: this.pkgJson.displayName }));
        l.write("   mode  : " + l.withColor(this.mode, l.colors.grey), 1, "", 0, l.colors.white);
        l.write("   argv  : " + l.withColor(this.jsonStringifySafe(this.argv), l.colors.grey), 1, "", 0, l.colors.white);
        l.write("   env   : " + l.withColor(this.jsonStringifySafe(this.arge), l.colors.grey), 1, "", 0, l.colors.white);
        l.sep();
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
               tempDir = ostemp ? `${ostemp}${sep}${this.pkgJson.scopedName.name}` : defaultTempDir,
               temp = resolve(tempDir, `${buildConfig.name}${sep}${buildConfig.mode}`);
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
                else { options[k].enabled = true; }
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
