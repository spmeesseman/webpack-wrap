/* eslint-disable jsdoc/valid-types */
/* eslint-disable jsdoc/no-undefined-types */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file utils/environment.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 */

const { existsSync } = require("fs");
const wpexports = require("../exports");
const typedefs = require("../types/typedefs");
const { isAbsolute, relative, sep } = require("path");
const WpBuildConsoleLogger = require("../utils/console");
const { apply, WpBuildError, isPromise, resolvePath, pickNot, isString } = require("../utils/utils");


/**
 * @class WpBuildApp
 * @implements {typedefs.IWpBuildApp}
 */
class WpBuildApp
{
    /** @type {typedefs.WpwBuild} */
    build;
    /** @type {Array<typedefs.IDisposable>} */
    disposables;
    /** @type {WpBuildError[]} */
    errors;
    /** @type {typedefs.WpBuildGlobalEnvironment} */
    global;
    /** @type {boolean} */
    isMain;
    /** @type {boolean} */
    isMainProd;
    /** @type {boolean} */
    isMainTest;
    /** @type {boolean} */
    isTest;
    /** @type {boolean} */
    isWeb;
    /** @type {WpBuildConsoleLogger} */
    logger;
    /** @type {typedefs.WpwWebpackMode} */
    mode;
    /** @type {typedefs.WpBuildRc} @private */
    rc;
    /** @type {typedefs.WpwSourceCode} */
    source;
    /** @type {typedefs.WebpackTarget} */
    target;
    /** @type {typedefs.WpwVsCodeConfig} */
    vscode;
    /** @type {WpBuildError[]} */
    warnings;
    /** @type {typedefs.WpwWebpackConfig} */
    wpc;


	/**
	 * @constructs WpBuildApp
	 * @param {typedefs.WpBuildRc} rc wpbuild rc configuration
	 * @param {typedefs.WpwBuild} build
	 */
	constructor(rc, build)
	{
        this.rc = rc;
        this.build = build;
        this.errors = [];
        this.warnings = [];
        this.disposables = [];
		this.applyAppRc();
        this.initLogger();
	}


    get buildCount() { return this.rc.buildCount; }
    get cmdLine() { return this.rc.args; }
    get pkgJson() { return this.rc.pkgJson; }


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
        if (this.warnings.length > 0) {
            this.logger.warning("REPORTED NON-FATAL WARNINGS FOR THIS BUILD:");
            this.warnings.splice(0).forEach(w => this.printNonFatalIssue(w, this.logger.warning));
        }
        if (this.errors.length > 0) {
            this.logger.warning("REPORTED NON-FATAL ERRORS FOR THIS BUILD:");
            this.errors.splice(0).forEach(e => this.printNonFatalIssue(e, this.logger.error));
        }
        this.logger.write(`dispose app wrapper instance for build '${this.build.name}'`, 3);
        this.logger.dispose();
    };


    /**
     * @function
     * @param {WpBuildError | string} e
     * @param {string} [pad]
     */
    addError = (e, pad) =>
    {
        if (isString(e)) {
            e = WpBuildError.get(e, "n/a");
        }
        this.logger.error(e, pad);
        this.errors.push(e);
    };


    /**
     * @function
     * @param {WpBuildError | string} w
     * @param {string} [pad]
     */
    addWarning = (w, pad) =>
    {
        if (isString(w)) {
            w = WpBuildError.get(w, "n/a");
        }
        this.logger.warning(w.message, pad);
        this.warnings.push(w);
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
			global: this.rc.global,
            isTest: b.mode === "test" || b.type === "tests" || b.name.startsWith("test"),
			isWeb: b.type === "webapp" || b.target.startsWith("web"),
			isMain: b.type === "module",
			isMainProd: b.type === "module" && b.mode === "production",
			isMainTest: b.type === "module" && b.mode === "test",
            mode: b.mode || this.rc.mode,
            paths: b.paths,
            target: b.target,
            source: b.source,
            vscode: b.vscode
		});
	};


    /**
     * @function
     * @returns {typedefs.WpwWebpackConfig}
     */
    buildApp = () =>
    {
        if (this.build.source.type === "typescript")
        {
            apply(this.build.options, {
                tsbundle: this.build.type === "types" && this.build.options.tsbundle !== false,
                tscheck: this.build.options.tscheck !== false
            });
        }
        //
        // TODO: implement TS API createProgram() and check syntax in JS using akllowJS:true compiulr option
        //
        return this.buildWebpackConfig();
    };


    /**
     * Called by top level rc wrapper after instantiating this app wrapper instance.
     * Calls each ./exports/* default export to construct a {@link typedefs.WpwWebpackConfig webpack build configuration}.
     *
     * @function
     * @private
     * @returns {typedefs.WpwWebpackConfig}
     */
    buildWebpackConfig = () =>
    {
        const build = this.build;
        this.wpc = {
            context: build.paths.ctx || build.paths.base,
            entry: {},
            mode: build.mode === "test" ? "none" : build.mode,
            module: { rules: [] },
            name: `${this.pkgJson.scopedName.scope}|${this.pkgJson.version}|${build.name}|${build.mode}|${build.target}`,
            output: {},
            plugins: [],
            resolve: {},
            target: build.target
        };
        try
        {   wpexports.cache(this);          // Asset cache
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
            this.printWpcProperties();
        }
        catch (e)
        {   this.logger.blank(undefined, this.logger.icons.color.error);
            this.logger.error("An error was encountered while creating the webpack configuration export");
            this.logger.error("Using the following build parameters:");
            this.logger.blank(undefined, this.logger.icons.color.error);
            this.printBuildProperties();
            this.logger.blank(undefined, this.logger.icons.color.error);
            throw e;
        }
        return this.wpc;
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
     * @returns {typedefs.WpwBuild | undefined}
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
     * @param {typedefs.WpwRcPathsKey} pathKey
     * @param {P} [options]
     * @returns {R}
     */
    getRcPath = (pathKey, options) =>
    {
        let path;
        const opts = /** @type {typedefs.WpBuildAppGetPathOptions} */(apply({}, options)),
              basePath = (opts.ctx ? this.build.paths.ctx : this.build.paths.base) || process.cwd(),
              buildName = opts.build || this.build.name,
              build = this.rc.builds.find(b => b.name === buildName || b.type === buildName);

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
        l.write("Base Configuration:", 1, "", 0, l.colors.white);
        l.value("   name", this.pkgJson.scopedName.name, 1);
        if (this.pkgJson.scopedName.scope) {
            l.value("   npm scope", this.pkgJson.scopedName.scope, 1);
        }
        l.value("   mode", this.rc.mode, 1);
        l.value("   logging level", this.rc.log.level, 1);
        l.value("   app version", this.pkgJson.version, 1);
        l.value("   wpw version", this.rc.wpwVersion, 2);
        l.value("   wpw schema version", this.rc.schemaVersion, 2);
        l.value("   # of active builds", this.rc.apps.length, 2);
        l.value("   active build names", this.rc.apps.map(a => a.build.name).join(", "), 2);
        l.value("   # of defined builds", this.rc.builds.length, 2);
        l.value("   defined build names", this.rc.builds.map(b => b.name).join(", "), 2);
        l.sep();
        l.write("Build Configuration:", 1, "", 0, l.colors.white);
        l.value("   name", this.build.name, 1);
        l.value("   type", this.build.type, 1);
        l.value("   target", this.build.target, 1);
        l.write("   flags", 2);
        l.value("      is main", this.isMain, 2);
        l.value("      is main test", this.isMainTest, 2);
        l.value("      is main production", this.isMainProd, 2);
        l.value("      is test", this.isTest, 2);
        l.value("      is web", this.isWeb, 2);
        l.value("      is vscode extension", this.build.vscode && this.build.vscode.type && this.build.vscode.type !== "none", 2);
        l.value("   source code type", this.build.source.type, 2);
        l.value("   logging level", this.build.log.level, 2);
        l.value("   alias configuration", JSON.stringify(this.build.alias), 3);
        l.value("   log configuration", JSON.stringify(this.build.log), 3);
        l.value("   options configuration", JSON.stringify(this.build.options), 3);
        l.value("   paths configuration", JSON.stringify(this.build.paths), 3);
        l.sep();
        l.write("Build Options:", 2, "", 0, l.colors.white);
        l.value("   testsuite enabled", !!this.build.options.testsuite, 2);
        l.value("   types enabled", !!this.build.options.types, 2);
        l.value("   tsbundle enabled", !!this.build.options.tsbundle, 2);
        l.value("   tscheck enabled", !!this.build.options.tscheck, 2);
        l.value("   upload enabled", !!this.build.options.upload, 2);
        l.value("   options configuration", JSON.stringify(this.build.options), 3);
        l.sep();
        l.write("Build Paths:", 2, "", 0, l.colors.white);
        l.value("   base/project directory", this.getRcPath("base"), 2);
        l.value("   context directory", this.getRcPath("ctx", { rel: true }), 2);
        l.value("   distribution directory", this.getDistPath({ rel: true }), 2);
        l.value("   distribution tests directory", this.getDistPath({ rel: true, build: "tests" }), 2);
        l.value("   distribution types directory", this.getDistPath({ rel: true, build: "types" }), 2);
        l.value("   source directory", this.getSrcPath({ rel: true }), 2);
        l.value("   source tests directory", this.getSrcPath({ rel: true, build: "tests" }), 2);
        l.value("   source types directory", this.getSrcPath({ rel: true, build: "types" }), 2);
        l.value("   temp directory", this.getRcPath("temp"), 2);
        l.sep();
        l.write("Source Code Configuration:", 1, "", 0, l.colors.white);
        l.value("   source code type", this.build.source.type, 1);
        l.value("   ts/js config file", this.build.source.config.file, 2);
        l.value("   ts/js config directory", this.build.source.config.dir, 2);
        l.value("   ts/js config path", this.build.source.config.path, 2);
        l.value("   source code base configuration", JSON.stringify(pickNot(this.build.source.config, "raw", "options")), 3);
        l.value("   ts/js configured options", JSON.stringify(pickNot(this.build.source.config.options, "compilerOptions", "files")), 3);
        l.value("   ts/js configured compiler options", JSON.stringify(this.build.source.config.options.compilerOptions), 3);
        l.value("   ts/js configured files", JSON.stringify(this.build.source.config.options.files), 4);
        l.sep();
    };


    /**
     * @function
     * @private
     * @param {WpBuildError} e
     * @param {Function} fn
     */
    printNonFatalIssue = (e, fn) =>
    {
        fn.call(this.logger, `Location: ${e.file}`);
        fn.call(this.logger, "   " + e.message);
    };


    /**
     * @function
     * @private
     * @member logEnvironment
     */
     printWpcProperties = () =>
     {
         const l = this.logger;
         l.write("Webpack Configuration:", 1, "", 0, l.colors.white);
         l.value("   build name", this.wpc.name, 1);
         l.value("   mode", this.wpc.mode, 1);
         l.value("   target",this.wpc.target, 1);
         l.value("   infrastructure logging level", this.wpc.infrastructureLogging?.level || "none", 2);
         l.value("   context directory", this.wpc.context, 1);
         l.value("   output directory", this.wpc.output.path, 1);
         l.value("   entry", JSON.stringify(this.wpc.entry), 3);
         l.value("   resolve", JSON.stringify(this.wpc.resolve), 3);
         l.value("   output", JSON.stringify(this.wpc.output), 3);
         l.value("   rules", JSON.stringify(this.wpc.module.rules), 3);
         l.sep();
     };

}


module.exports = WpBuildApp;
