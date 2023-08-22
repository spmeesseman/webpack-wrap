/* eslint-disable jsdoc/valid-types */
/* eslint-disable jsdoc/no-undefined-types */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file utils/environment.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const { existsSync } = require("fs");
const wpexports = require("../exports");
const typedefs = require("../types/typedefs");
const WpBuildConsoleLogger = require("../utils/console");
const { isAbsolute, relative, sep, dirname } = require("path");
const {
    apply, WpBuildError, isPromise, findTsConfig, getTsConfig, isArray, findFilesSync,
    resolvePath, relativrPath
} = require("../utils/utils");


/**
 * @class WpBuildApp
 * @implements {typedefs.IWpBuildApp}
 */
class WpBuildApp
{
    /**
     * @type {typedefs.WpBuildCombinedRuntimeArgs}
     */
    args;
    /**
     * @type {typedefs.WpBuildRcBuild}
     */
    build;
    /**
     * @type {Array<typedefs.IDisposable>}
     */
    disposables;
    /**
     * @type {WpBuildError[]}
     */
    errors;
    /**
     * @type {boolean}
     */
    isMain;
    /**
     * @type {boolean}
     */
    isMainProd;
    /**
     * @type {boolean}
     */
    isMainTest;
    /**
     * @type {boolean}
     */
    isTest;
    /**
     * @type {boolean}
     */
    isWeb;
    /**
     * @type {typedefs.WpBuildGlobalEnvironment}
     */
    global;
    /**
     * @type {WpBuildConsoleLogger}
     */
    logger;
    /**
     * @type {typedefs.WpBuildWebpackMode}
     */
    mode;
    /**
     * @type {typedefs.WpBuildRcPackageJson}
     */
    pkgJson;
    /**
     * @type {typedefs.WpBuildRc}
     */
    rc;
    /**
     * @type {typedefs.WpBuildRcSourceCodeType}
     */
    source;
    /**
     * @type {typedefs.WebpackTarget}
     */
    target;
    /**
     * @type {typedefs.WpBuildAppTsConfig | undefined}
     */
    tsConfig;
    /**
     * @type {typedefs.WpBuildWebpackConfig}
     */
    wpc;
    /**
     * @type {typedefs.WpBuildRcVsCode}
     */
    vscode;


	/**
	 * @class WpBuildApp
	 * @param {typedefs.WpBuildRc} rc wpbuild rc configuration
	 * @param {typedefs.WpBuildRcBuild} build
	 */
	constructor(rc, build)
	{
        this.rc = rc;
        this.build = build;
        this.errors = [];
        this.disposables = [];
		this.applyAppRc();
        this.initLogger();
	}

    /**
     * @function
     * @async
     */
    dispose = async () =>
    {
        for (const d of this.disposables.splice(0))
        {
            const result = d.dispose();
            if (isPromise(result)) {
                await result;
            }
        }
        this.logger.write(`dispose app wrapper instance for build '${this.build.name}'`, 3);
        this.logger.dispose();
    };


	/**
	 * @function
	 * @private
	 */
	applyAppRc = () =>
	{
        const b = this.build;
		apply(this,
		{
            args: this.rc.args,
			global: this.rc.global,
            isTest: b.mode === "test" || b.type === "tests" || b.name.startsWith("test"),
			isWeb: b.type === "webapp" || b.target.startsWith("web"),
			isMain: b.type === "module",
			isMainProd: b.type === "module" && b.mode === "production",
			isMainTest: b.type === "module" && b.mode === "test",
            mode: b.mode || this.rc.mode,
            paths: b.paths,
            pkgJson: this.rc.pkgJson,
            target: b.target,
            source: b.source || this.rc.source,
            vscode: b.vscode
		});
	};


    /**
     * Called by top level rc wrapper after instantiating this app wrapper instance.
     * Calls each ./exports/* default export to construct a {@link typedefs.WpBuildWebpackConfig webpack build configuration}.
     *
     * @function
     * @returns {typedefs.WpBuildWebpackConfig}
     */
    buildWebpackConfig = () =>
    {
        const build = this.build;
        this.wpc = {
            context: build.paths.ctx || build.paths.base,
            entry: {},
            mode: build.mode === "test" ? "none" : build.mode,
            module: { rules: [] },
            name: `${this.rc.name}|${this.pkgJson.version}|${build.name}|${build.mode}|${build.target}`,
            output: {},
            plugins: [],
            resolve: {},
            target: build.target
        };
        wpexports.cache(this);          // Asset cache
        wpexports.experiments(this);    // Set any experimental flags that will be used
        wpexports.entry(this);          // Entry points for built output
        wpexports.externals(this);      // External modules
        wpexports.ignorewarnings(this); // Warnings from the compiler to ignore
        wpexports.optimization(this);   // Build optimization
        wpexports.minification(this);   // Minification / Terser plugin options
        wpexports.output(this);         // Output specifications
        wpexports.devtool(this);        // Dev tool / sourcemap control
        wpexports.resolve(this);        // Resolve config
        wpexports.rules(this);          // Loaders & build rules
        wpexports.stats(this);          // Stats i.e. console output & webpack verbosity
        wpexports.watch(this);          // Watch-mode options
        wpexports.plugins(this);        // Plugins - exports.plugins() inits all plugin.plugins
        this.printBuildProperties();
        return this.wpc;
    };


    /**
     * @function
     * @returns {typedefs.WpBuildWebpackConfig}
     */
    configureAppBuild = () =>
    {
        this.configureTypescript();
        this.resolveAliasPaths();
        if (this.build.type === "types")
        {
            apply(this.build.plugins, {
                tsbundle: true,
                tscheck: false
            });
        }
        else if (this.build.type === "tests")
        {
            apply(this.build.plugins, {
                tsbundle: true,
                tscheck: false
            });
        }
        else {
            apply(this.build.plugins, {
                tscheck: this.source === "typescript"
            });
        }
        return this.buildWebpackConfig();
    };


	/**
	 * @function
	 * @private
	 */
    configureTypescript = () =>
    {
        const build = this.build;
        if (build.source === "typescript")
        {
            build.paths.tsconfig = build.paths.tsconfig ?
                                   resolvePath(build.paths.base, build.paths.tsconfig) :
                                   findTsConfig(build);
            if (build.paths.tsconfig)
            {
                this.tsConfig = getTsConfig(build);
                if (!this.tsConfig) {
                    // build.paths.tsconfig = undefined;
                    // this.warnings.push("Could not locate tsconfig file while configuring build" + build.name);
                    throw WpBuildError.getErrorMissing("tsconfig file", "utils/rc.js");
                }
            }
        }
    };


    /**
     * @function
     * @param {string} name
     * @returns {typedefs.WpBuildApp | undefined}
     */
    getApp = (name) => this.rc.getApp(name);


    /**
     * @function
     * @param {string} name
     * @returns {typedefs.WpBuildRcBuild | undefined}
     */
    getAppBuild = (name) => this.rc.getBuild(name);


    /**
     * @function
     * @template {typedefs.WpBuildAppGetPathOptions | undefined} P
     * @template {string | undefined} [R = P extends { stat: true } ? string | undefined : string]
     * @param {P} [options]
     * @returns {R}
     */
    getBasePath = (options) => (!options || !options.ctx ? this.getRcPath("base", options) : this.getRcPath("ctx", options));


    /**
     * @function
     * @template {typedefs.WpBuildAppGetPathOptions | undefined} P
     * @template {string | undefined} [R = P extends { stat: true } ? string | undefined : string]
     * @param {P} [options]
     * @returns {R}
     */
    getContextPath = (options) => this.getRcPath("ctx", options);


    /**
     * @function
     * @template {typedefs.WpBuildAppGetPathOptions | undefined} P
     * @template {string | undefined} [R = P extends { stat: true } ? string | undefined : string]
     * @param {P} [options]
     * @returns {R}
     */
    getDistPath = (options) => /** @type {R} */(this.getRcPath("dist", options));


    /**
     * @function
     * @template {typedefs.WpBuildAppGetPathOptions | undefined} P
     * @template {string | undefined} [R = P extends { stat: true } ? string | undefined : string]
     * @param {typedefs.WpBuildRcPathsKey} pathKey
     * @param {P} [options]
     * @returns {R}
     */
    getRcPath = (pathKey, options) =>
    {
        let path;
        const opts = /** @type {typedefs.WpBuildAppGetPathOptions} */(apply({}, options)),
              basePath = (opts.ctx ? this.build.paths.ctx : this.build.paths.base) || process.cwd();

        const _getPath = /** @param {string | undefined} path */(path) =>
        {
            if (path)
            {
                if (opts.rel)
                {
                    if (isAbsolute(path))
                    {
                        if (opts.stat && !existsSync(path)) {
                            path = undefined;
                        }
                        else {
                            path = relative(basePath, path);
                            if (opts.dot) {
                                path = "." + (opts.psx ? "/" : sep) + path;
                            }
                        }
                    }
                    else
                    {
                        if (opts.stat && !existsSync(resolvePath(basePath, path))) {
                            path = undefined;
                        }
                        else if (opts.dot && !(/^\.[\\\/]/).test(path)) {
                            path = "." + (opts.psx ? "/" : sep) + path;
                        }
                    }
                }
                else
                {
                    if (!isAbsolute(path)) {
                        path = resolvePath(basePath, path);
                    }
                    if (opts.stat && !existsSync(resolvePath(basePath, path))) {
                        path = undefined;
                    }
                }

                return path ? (!opts.psx ? path : path.replace(/\\/g, "/")) : undefined;
            }
        };

        const buildName = opts.build || this.build.name,
              build = this.rc.builds.find(b => b.name === buildName || b.type === buildName);
        if (build) {
            path = _getPath(build.paths[pathKey]);
        }

        return /** @type {R} */(path || _getPath(this.build.paths[pathKey]) || _getPath(this.rc.paths[pathKey]) || _getPath(basePath));
    };


    /**
     * @function
     * @template {typedefs.WpBuildAppGetPathOptions | undefined} P
     * @template {string | undefined} [R = P extends { stat: true } ? string | undefined : string]
     * @param {P} [options]
     * @returns {R}
     */
    getSrcPath = (options) => this.getRcPath("src", options);


    /**
     * @function
     * @private
     */
    initLogger = () =>
    {
        apply(this.build.log, { envTag1: this.build.name , envTag2: this.target.toString() });
        const l = this.logger = new WpBuildConsoleLogger(this.build.log);
        this.global.buildCount = this.global.buildCount || 0;
        l.value(
            `Start Webpack build ${++this.global.buildCount}`,
            l.tag(this.build.name) + " " + l.tag(this.target),
            undefined, undefined, l.icons.color.start, l.colors.white
        );
    };


   /**
    * @function
    * @private
    * @member logEnvironment
    */
    printBuildProperties = () =>
    {
        const l = this.logger;
        l.sep();
        l.write("Global Configuration:", 1, "", 0, l.colors.white);
        Object.keys(this.global).filter(k => typeof this.global[k] !== "object").forEach(
            (k) => l.value(`   ${k}`, this.global[k], 1)
        );
        l.sep();
        l.write("Rc Configuration:", 1, "", 0, l.colors.white);
        l.value("   name", this.rc.name, 1);
        l.value("   mode", this.rc.mode, 1);
        l.value("   version", this.rc.pkgJson.version, 1);
        l.value("   # of builds", this.rc.builds.length, 2);
        l.value("   # of active builds", this.rc.apps.length, 2);
        l.sep();
        l.write("Build Configuration:", 1, "", 0, l.colors.white);
        l.value("   name", this.build.name, 1);
        l.value("   type", this.build.type, 1);
        l.value("   target", this.build.target, 1);
        l.value("   source type", this.build.source, 2);
        l.value("   is vscode extension", this.build.vscode && this.build.vscode.type && this.build.vscode.type !== "none", 2);
        l.value("   alias configuration", JSON.stringify(this.build.alias), 3);
        l.value("   log configuration", JSON.stringify(this.build.log), 3);
        l.value("   exports configuration", JSON.stringify(this.build.exports), 3);
        l.value("   paths configuration", JSON.stringify(this.build.paths), 3);
        l.sep();
        l.write("Build Plugins Configuration:", 2, "", 0, l.colors.white);
        l.value("   testsuite enabled", !!this.build.plugins.testsuite, 2);
        l.value("   types enabled", !!this.build.plugins.types, 2);
        l.value("   tsbundle enabled", !!this.build.plugins.tsbundle, 2);
        l.value("   tscheck enabled", !!this.build.plugins.tscheck, 2);
        l.value("   upload enabled", !!this.build.plugins.upload, 2);
        l.value("   plugins configuration", JSON.stringify(this.build.plugins), 3);
        l.sep();
        l.write("Build Paths Configuration:", 2, "", 0, l.colors.white);
        l.value("   base/project directory", this.getRcPath("base"), 2);
        l.value("   context directory", this.getRcPath("ctx", { rel: true }), 2);
        l.value("   distribution directory", this.getDistPath({ rel: true }), 2);
        l.value("   distribution tests directory", this.getDistPath({ rel: true, build: "tests" }), 2);
        l.value("   distribution types directory", this.getDistPath({ rel: true, build: "types" }), 2);
        l.value("   source directory", this.getSrcPath({ rel: true }), 2);
        l.value("   source tests directory", this.getSrcPath({ rel: true, build: "tests" }), 2);
        l.value("   source types directory", this.getSrcPath({ rel: true, build: "types" }), 2);
        l.value("   temp directory", this.getRcPath("temp"), 2);
        l.value("   tsconfig path", this.build.paths.tsconfig, 2);
        l.sep();
        l.write("Webpack Configuration:", 1, "", 0, l.colors.white);
        l.value("   mode", this.wpc.mode, 1);
        l.value("   target",this.wpc.target, 1);
        l.value("   context directory", this.wpc.context, 1);
        l.value("   output directory", this.wpc.output.path, 1);
        l.value("   entry", JSON.stringify(this.wpc.entry), 3);
        l.value("   resolve", JSON.stringify(this.wpc.resolve), 3);
        l.value("   output", JSON.stringify(this.wpc.output), 3);
        l.value("   rules", JSON.stringify(this.wpc.module.rules), 3);
        l.sep();
    };


    /**
     * @function
     * @private
     */
    resolveAliasPaths = () =>
    {
        const build = this.build,
              alias = this.build.alias,
              tsConfig = this.tsConfig,
              tscPaths = tsConfig?.json.compilerOptions.paths;

        const _pushAlias = (/** @type {string} */ key, /** @type {string} */ path) =>
        {
            const value = alias[key];
            if (isArray(value))
            {
                if (value.includes(path)) {
                    this.rc.warnings.push(`tsconfig alias extractions have same key/value ${value} / ${path}`);
                }
                else {
                    value.push(path);
                }
            }
            else { alias[key] = [ path ]; }
        };

        if (tscPaths)
        {
            Object.entries(tscPaths).filter(p => isArray(p)).forEach(([ key, paths ]) =>
            {
                paths.forEach((p) => _pushAlias(key, resolvePath(dirname(tsConfig.path), p)), this);
            });
        }

        if (!alias[":env"])
        {
            const basePath = build.paths.base,
                  srcPath = relativrPath(basePath, build.paths.src),
                  envGlob = `**/${srcPath}/**/{env,environment,target}/${build.target}/`,
                  envDirs = findFilesSync(envGlob, { cwd: basePath, absolute: true, dotRelative: false });
            if (envDirs.length >= 0)
            {
                envDirs.forEach((path) => _pushAlias(":env", path), this);
            }
        }
    };

}


module.exports = WpBuildApp;
