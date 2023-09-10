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
const { readFileSync, existsSync, mkdirSync } = require("fs");
const { resolve, basename, join, dirname, sep } = require("path");
const { validateSchema, SchemaDirectory, getSchemaVersion } = require("../utils/schema");
const { isWpwWebpackMode, WpwPackageJsonKeys, WpwBuildBaseConfigKeys } = require("../types/constants");
const {
    WpwError, apply, pick, isString, merge,asArray, isObject, WpwLogger, typedefs, isPromise, clone, mergeIf, isNulled, applyIf, resolvePath, findFilesSync, relativePath, isArray
} = require("../utils");

const defaultTempDir = `node_modules${sep}.cache${sep}wpbuild${sep}temp`;


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
    /** @type {string} */
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
    /** @type {WpwSourceCode} */
    sourceCode;
    /** @type {typedefs.WpwBuildBaseConfig} */
    test;
    /** @type {typedefs.WpwBuildBaseConfig} */
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
        Object.keys(arge).filter(k => isString(arge[k]) && /true|false/i.test(arge[k])).forEach((k) => {
            arge[k] = arge[k].toLowerCase() === "true";
        });
        apply(this, { apps: [], errors: [], warnings: [], args: apply({}, arge, argv), pkgJson: {} });
        const rcDefaults = this.applyJsonFromFile(this, ".wpbuildrc.defaults.json", SchemaDirectory);
        const rcProject = this.applyJsonFromFile(this, ".wpbuildrc.json");
        this.applyPackageJson();
        this.builds = this.builds || [];
        this.logger = new WpwLogger({ envTag1: "wpw", envTag2: "wrapper", ...this.log });
		this.applyModeArgument(argv, arge);
        this.printBanner(arge, argv);
        if (this.logger.level >= 4) { validateSchema(rcDefaults.data, this.logger); }
        validateSchema(rcProject.data, this.logger);
        this.applyVersions();
        this.mergeBuildConfigs();
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
            if (parentDir === dirPath) {
                throw new WpwError(`Could not locate or parse '${basename(file)}', check existence or syntax`);
            }
            return this.applyJsonFromFile(thisArg, file, parentDir);
        }
    }


    /**
     * @private
     * @param {typedefs.WebpackRuntimeArgs} argv
     * @param {typedefs.WpBuildRuntimeEnvArgs} arge
     */
    applyModeArgument(argv, arge)
    {
        apply(this, { mode: this.getMode(arge, argv, true) });
        if (!isWpwWebpackMode(this.mode)) {
            throw WpwError.getErrorMissing("mode");
        }
        // if (argv.mode && !isWebpackMode(this.mode))
        // {
        //     argv.mode = "none";
        //     if (process.argv.includes("--mode")) {
        //         process.argv[process.argv.indexOf("--mode") + 1] = "none";
        //     }
        // }
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
	 * Add all defined builds to the root builds array, i.e. those defined in root already,
     * and/or defined in the current environment's config. The {@link WpwBuild} instance will
     * apply all urther merging logic to the deifferent levels of configuration.
     *
	 * @private
	 */
    mergeBuildConfigs()
    {
        /** @type {typedefs.IWpwBuildBaseConfig[]} */
        const buildConfigs = [],
              baseBuildConfig = this.getBasePropertyConfig(this),
              baseBuildConfigs = clone(this.builds),
              modeConfig = /** @type {typedefs.IWpwBuildBaseConfig} */(this[this.mode]),
              modeBaseConfig = this.getBasePropertyConfig(modeConfig),
              modeBuildConfigs = modeConfig.builds || [];

        /**  @template D, S */
        const _applyConfigProperty = (/** @type {string}  */property, /** @type {D}  */dst, /** @type {S}  */src) =>
        {
            if (src[property])
            {
                if (isNulled(dst[property])) {
                    dst[property] = clone(src[property]);
                }
                else {
                    mergeIf(dst[property], src[property]);
                }
            }
        };

        const _applyRConfig= (/** @type {typedefs.IWpwBuildConfig}  */dst, /** @type {typedefs.IWpwBuildBaseConfig}  */src) =>
        {
            _applyConfigProperty("paths", dst, src);
            _applyConfigProperty("options", dst, src);
            _applyConfigProperty("alias", dst, src);
            _applyConfigProperty("source", dst, src);
            _applyConfigProperty("vscode", dst, src);
            _applyConfigProperty("log", dst, src);
            if (dst.log.color) {
                const clr = dst.log.color;
                applyIf(dst.log.colors, { valueStar: clr, buildBracket: clr, tagBracket: clr, infoIcon: clr });
            }
            apply(dst, { mode: dst.mode });
            return dst;
        };

        this.builds = [];
        this.logger.write("configure all defined builds", 1);

        baseBuildConfigs.forEach((config) => { buildConfigs.push(merge({}, baseBuildConfig, config)); });

        modeBuildConfigs.forEach((config) =>
        {
            const exBuildConfig = buildConfigs.find(bc => bc.name === config.name);
            if (!exBuildConfig)
            {
                buildConfigs.push(merge({}, modeBaseConfig, config));
            }
            else {
                merge(exBuildConfig, modeBaseConfig, config);
            }
        });

        baseBuildConfigs.forEach((config) =>
        {
            this.builds.push(new WpwBuild(config, this));
        });

        this.logger.write("build configuration complete", 2);
    }


    /**
     * @private
     * @param {typedefs.IWpwBuildBaseConfig} config
     * @returns {typedefs.IWpwBuildBaseConfig}
     */
    getBasePropertyConfig(config) { return pick(config, ...WpwBuildBaseConfigKeys); };


    /**
     * Base entry function to initialize build configurations and provide the webpack
     * configuration export(s) to webpack.config.js.
     *
     * @param {typedefs.WebpackRuntimeArgs} argv
     * @param {typedefs.WpBuildRuntimeEnvArgs} arge
     * @returns {typedefs.WpwWebpackConfig[]} arge
     */
    static create(argv, arge)
    {
        const rc = new WpwRc(argv, arge); // Create the top level build wrapper
        rc.maybeAddTypesBuild();
        //
        // if only a single build (specified by command line arg 'build'), then allow logger
        // to determine envtag length
        //
        if (rc.isSingleBuild && rc.apps.length === 0)
        {
            rc.builds.forEach(b => { b.log.pad.envTag = undefined; });
        }
        //
        // Instantiate all 'app' instances first, then call buildWrapper() on each one to
        // return the webpack config, as some configuration exports will need information
        // from the other defined builds
        //
        rc.apps.push(
            ...rc.builds.filter(
                (b) => (!arge.build || b.name === arge.build) && !rc.apps.find((a) => a.build.type === b.type)
            )
            .map((build) =>
            {
                build.initialize();
                return new WpBuildApp(rc, build);
            })
        );
        //
        // Call app.buildWrapper() on each 'app' instance to create the webpack configuration
        // for each active build, and return the array of resulting configurtaions.  These are
        // exported to the webpack process in the caller module and the compilation begins.
        //
        return rc.apps.map((app) =>
        {
            if (!app.build.mode || !app.build.target || !app.build.type) {
                throw WpwError.getErrorProperty("type");
            }
            app.build.active = true;
            return app.buildWrapper();
        });
    }


    /**
     * @param {string} nameOrType
     * @returns {typedefs.WpBuildApp | undefined}
     */
    getBuildWrapper(nameOrType) { return this.apps.find(a => a.build.type === nameOrType || a.build.name === nameOrType); }


    /**
     * @param {string} nameOrType
     * @returns {typedefs.WpwBuild | undefined}
     */
    getBuild(nameOrType) {return  this.getBuildWrapper(nameOrType)?.build; }


    /**
     * @private
     * @param {typedefs.IWpwBuildBaseConfig} rc
     * @returns {typedefs.IWpwBuildBaseConfig}
     */
    mergeDefaultConfig = () =>
    {
        if (!this.options) { this.options = {}; }
        if (!this.log) {
            this.log = WpwLogger.defaultOptions();
        }
        else
        {   if (!this.log.colors) {
                this.log.colors = WpwLogger.defaultOptions().colors;
            }
            else if (!this.log.colors.default) {
                this.log.colors.default = WpwLogger.defaultOptions().colors.default;
            }
            if (!this.log.pad) {
                this.log.pad = WpwLogger.defaultOptions().pad;
            }
        }
        if (!this.paths) {
            this.paths = { base: ".", src: "src", dist: "dist", ctx: ".", temp: defaultTempDir };
        }
        else
        {   if (!this.paths.base) { this.paths.base = "."; }
            if (!this.paths.src) { this.paths.src = "src"; }
            if (!this.paths.dist) { this.paths.dist = "dist"; }
            if (!this.paths.ctx) { this.paths.ctx = "."; }
            if (!this.paths.temp) { this.paths.temp = defaultTempDir; }
        }
        if (!this.source)
        {
            this.source = {
                type: "javascript",
                config: { options: { compilerOptions: {}, files: [] }, excludeAbs: [], includeAbs: [] }
            };
        }
        else
        {
            if (!this.source.type) {
                this.source.type = "javascript";
                this.source.type = "js";
            }
            if (!this.source.config) {
                this.source.config = {
                    options: { compilerOptions: {}, files: [] }, excludeAbs: [], includeAbs: []
                };
            }
            else if (!this.source.config.options) {
                this.source.config.options = { compilerOptions: {}, files: [] };
            }
        }
        return rc;
    };


    /**
     * @private
     * @template {boolean | undefined} T
     * @template {typedefs.WebpackMode | typedefs.WpwWebpackMode} R = T extends false | undefined ? typedefs.WebpackMode : typedefs.WpwWebpackMode
     * @param {typedefs.WpBuildRuntimeEnvArgs} arge Webpack build environment
     * @param {typedefs.WebpackRuntimeArgs} argv Webpack command line args
     * @param {T} [wpBuild] Convert to WpwWebpackMode @see {@link typedefs.WpwWebpackMode WpwWebpackMode}
     * @returns {R}
     */
    getMode(arge, argv, wpBuild)
    {
        let mode = argv.mode || arge.mode || "production";
        if (wpBuild === true && mode === "none") { mode = "test"; }
        else if (!wpBuild && mode === "test") { mode = "none"; }
        return /** @type {R} */(mode);
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
                    const dependsOnTypes = (isObject(a.build.entry) && a.build.entry.dependOn === "types") ||
                                           a.build.options.wait?.items?.find(w => w.name === "types");
                    if (!this.isSingleBuild || dependsOnTypes)
                    {
                        if (asArray(a.build.options.wait?.items).find(t => t.name === "types"))
                        {
                            typesBuild.initialize();
                            this.apps.push(new WpBuildApp(this, apply(typesBuild, { auto: true })));
                            break;
                        }
                    }
                }
            }
        }
    }


    /**
     * @private
     * @param {typedefs.WpBuildRuntimeEnvArgs} arge
     * @param {typedefs.WebpackRuntimeArgs} argv
     */
    printBanner(arge, argv)
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
    }


    /**
     * @private
     * @param {typedefs.IWpwBuildConfig} buildConfig
     */
    resolveAliasPaths = (buildConfig) =>
    {
        if (!this.alias) { return; }

        const alias = this.alias,
              jstsConfig = buildConfig.source.config,
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
            const basePath = this.paths.base,
                  srcPath = relativePath(basePath, this.paths.src),
                  envGlob = `**/${srcPath}/**/{env,environment,target}/${buildConfig.target}/`,
                  envDirs = findFilesSync(envGlob, { cwd: basePath, absolute: true, dotRelative: false });
            envDirs.forEach((path) => _pushAlias(":env", path), this);
        }
    };


	/**
	 * @private
     * @param {typedefs.IWpwBuildConfig} buildConfig
	 */
	resolvePaths = (buildConfig) =>
	{
        const paths = this.paths,
              base = dirname(this.pkgJsonPath),
              // @ts-ignore
              ostemp = os.tmpdir ? os.tmpdir() : os.tmpDir(),
			  temp = resolve(
                  ostemp ? `${ostemp}${sep}${this.pkgJson.scopedName.name}` : defaultTempDir,
                  `${buildConfig.target}${sep}${buildConfig.mode}`
              );
		if (!existsSync(temp)) {
			mkdirSync(temp, { recursive: true });
		}
        paths.base = base;
        paths.temp = paths.temp && paths.temp !== defaultTempDir ? paths.temp : temp;
        paths.ctx = paths.ctx ? resolvePath(base, paths.ctx) : base;
        paths.src = resolvePath(base, paths.src || "src");
        paths.dist = resolvePath(base, paths.dist || "dist");
	};

}


module.exports = WpwRc;
