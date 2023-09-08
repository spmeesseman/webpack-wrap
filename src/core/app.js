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
 *//** */

const WpwBase = require("./base");
const { existsSync } = require("fs");
const wpexports = require("../exports");
const typedefs = require("../types/typedefs");
const WpwLogger = require("../utils/console");
const { isAbsolute, relative, sep } = require("path");
const { apply, WpwError, isPromise, resolvePath, pickNot } = require("../utils");


/**
 * @extends {WpwBase}
 * @implements {typedefs.IDisposable}
 * @implements {typedefs.IWpBuildApp}
 */
class WpBuildApp extends WpwBase
{
    /** @type {typedefs.WpwBuild} */
    build;
    /** @type {Array<typedefs.IDisposable>} */
    disposables;
    /** @type {WpwError[]} */
    errors;
    /** @type {WpwError[]} */
    info;
    /** @type {typedefs.WpwRc} @private */
    rc;
    /** @type {WpwError[]} */
    warnings;
    /** @type {typedefs.WpwWebpackConfig} */
    wpc;


	/**
	 * @constructs WpBuildApp
	 * @param {typedefs.WpwRc} rc wpbuild rc configuration
	 * @param {typedefs.WpwBuild} build
	 */
	constructor(rc, build)
	{
        super({});
        this.info = [];
        this.errors = [];
        this.warnings = [];
        this.disposables = [];
        this.rc = rc;
        this.build = build;
        this.initLogger();
        this.addSuggestions();
	}


    get buildCount() { return this.rc.buildCount; }
    get cmdLine() { return this.rc.args; }
    get isOnlyBuild() { return this.rc.isSingleBuild; }
    get pkgJson() { return this.rc.pkgJson; }
    get source() { return this.build.source; }


    dispose = async () =>
    {
        for (const d of this.disposables.splice(0))
        {
            const result = d.dispose();
            if (isPromise(result)) {
                await result;
            }
        }
        const l = this.logger;
        if (this.info.length > 0) {
            l.warning("REPORTED INFORMATIONAL MESSAGES FOR THIS BUILD:");
            this.info.splice(0).forEach(e => this.printNonFatalIssue(e, l.warning));
        }
        if (this.warnings.length > 0) {
            l.warning("REPORTED NON-FATAL WARNINGS FOR THIS BUILD:");
            this.warnings.splice(0).forEach(w => this.printNonFatalIssue(w, l.warning));
        }
        if (this.errors.length > 0) {
            l.warning("REPORTED ERRORS FOR THIS BUILD:");
            this.errors.splice(0).forEach(e => this.printNonFatalIssue(e, l.error));
        }
        l.write(`dispose app wrapper instance for build '${this.build.name}'`, 3);
        l.dispose();
    };


    /**
     * @param {typedefs.WpwErrorCode} code
     * @param {typedefs.WebpackCompilation} [compilation]
     * @param {Error | string} [detail]
     * @param {string} [pad]
     */
    addError = (code, compilation, detail, pad) => this.addMessage(code, compilation, detail, pad);


    /**
     * @param {typedefs.WpwInfoCode} code
     * @param {string} [detail]
     * @param {string} [pad]
     */
    addInfo = (code, detail, pad) => this.addMessage(code, undefined, detail, pad);


    /**
     * @private
     * @param {typedefs.WpwMessageCode} code defined error, info, or warning code
     * @param {typedefs.WebpackCompilation} [compilation] If set, build will bail
     * @param {Error | string} [detail] additional detail about the error / warning / event
     * @param {string} [pad]
     */
    addMessage = (code, compilation, detail, pad) =>
    {
        const l = this.logger,
              icons = this.logger.icons;
        if (/WPW[0-2][0-9][0-9]/.test(code))
        {
            const i = WpwError.get(WpwError.Msgs[code], this.wpc, detail);
            l.write(i.message, 1, pad, icons.blue.info, l.colors.white);
            this.info.push(i);
        }
        else if (/WPW[3-5][0-9][0-9]/.test(code))
        {
            const w = WpwError.get(WpwError.Msgs[code], this.wpc, detail);
            l.write(w.message, undefined, pad, icons.color.warning, l.colors.yellow);
            this.warnings.push(w);
            compilation?.warnings.push(w);
        }
        else if (/WPW[6-8][0-9][0-9]/.test(code))
        {
            const e = WpwError.get(WpwError.Msgs[code], this.wpc, detail);
            l.write(e.message, undefined, pad, icons.color.error, l.colors.red);
            this.errors.push(e);
            compilation?.errors.push(e);
        }
        else if (/WPW9[0-9][0-9]/.test(code)) {
            l.write("reserved message type", undefined, pad, icons.color.warning);
        }
        else {
            l.warning("unknown message type", pad);
        }
    };


    /**
     * @private
     */
    addSuggestions = () =>
    {
        const buildOptions = this.build.options;
        if (this.source.type === "typescript")
        {
            if (!buildOptions.tscheck && this.build.type !== "types")
            {
                this.addInfo(WpwError.Msg.INFO_SHOULD_ENABLE_TSCHECK);
            }
        }
        if (this.build.type === "tests" && (!this.build.options.vendormod || !this.build.options.vendormod.nyc))
        {
            this.addInfo(WpwError.Msg.INFO_SHOULD_ENABLE_VENDORMOD_NYC);
        }
    };


    /**
     * @param {typedefs.WpwWarningCode} code
     * @param {typedefs.WebpackCompilation} [compilation]
     * @param {string} [detail]
     * @param {string} [pad]
     */
    addWarning = (code, compilation, detail, pad) => this.addMessage(code, compilation, detail, pad);


    /**
     * @returns {typedefs.WpwWebpackConfig}
     */
    buildWrapper = () =>
    {
        this.wpc = this.getDefaultWebpackExports();
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
     * @param {string} name
     * @returns {typedefs.WpwBuild | undefined}
     */
    getBuild = (name) => this.rc.getBuild(name);


    /**
     * @param {string} name
     * @returns {typedefs.WpBuildApp | undefined}
     */
    getBuildWrapper = (name) => this.rc.getBuildWrapper(name);


    /**
     * @template {typedefs.WpBuildAppGetPathOptions | undefined} P
     * @template {P extends { stat: true } ? string | undefined : string} R
     * @param {P} [options]
     * @returns {R}
     */
    getBasePath = (options) => (!options || !options.ctx ? this.getRcPath("base", options) : this.getRcPath("ctx", options));


    /**
     * @template {typedefs.WpBuildAppGetPathOptions | undefined} P
     * @template {P extends { stat: true } ? string | undefined : string} R
     * @param {P} [options]
     * @returns {R}
     */
    getContextPath = (options) => this.getRcPath("ctx", options);


    /**
     * @private
     * @returns {typedefs.WpwWebpackConfig}
     */
    getDefaultWebpackExports = () =>
    {
        const build = this.build;
        return {
            cache: { type: "memory" },
            context: build.paths.ctx || build.paths.base,
            entry: {},
            mode: build.mode === "test" ? "none" : build.mode,
            module: { rules: [] },
            name: `${this.pkgJson.scopedName.scope}|${this.pkgJson.version}|${build.name}|${build.mode}|${build.target}`,
            output: { path: this.getDistPath() }, // { path: this.getDistPath({ rel: true }) }
            plugins: [],
            resolve: {},
            target: build.target
        };
    };


    /**
     * @template {typedefs.WpBuildAppGetPathOptions | undefined} P
     * @template {P extends { stat: true } ? string | undefined : string} R
     * @param {P} [options]
     * @returns {R}
     */
    getDistPath = (options) => /** @type {R} */(this.getRcPath("dist", options));


    /**
     * @private
     * @template {typedefs.WpBuildAppGetPathOptions | undefined} P
     * @template {P extends { stat: true } ? string | undefined : string} R
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
     * @template {typedefs.WpBuildAppGetPathOptions | undefined} P
     * @template {P extends { stat: true } ? string | undefined : string} R
     * @param {P} [options]
     * @returns {R}
     */
    getSrcPath = (options) => this.getRcPath("src", options);


    /**
     * @private
     */
    initLogger = () =>
    {
        apply(this.build.log, { envTag1: this.build.name , envTag2: this.build.target.toString() });
        const l = this.logger = new WpwLogger(this.build.log);
        this.global.buildCount = this.global.buildCount || 0;
        l.value(
            `Start Webpack build ${++this.global.buildCount}`,
            l.tag(this.build.name) + " " + l.tag(this.build.target),
            undefined, undefined, l.icons.color.start, l.colors.white
        );
    };


   /**
    * @private
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
        l.value("   source code type", this.source.type, 2);
        l.value("   is vscode extension", !!this.build.vscode && !!this.build.vscode.type, 2);
        l.value("   logging level", this.build.log.level, 2);
        l.value("   alias configuration", JSON.stringify(this.build.alias), 3);
        l.value("   log configuration", JSON.stringify(this.build.log), 3);
        l.value("   options configuration", JSON.stringify(this.build.options), 3);
        l.value("   paths configuration", JSON.stringify(this.build.paths), 3);
        l.sep();
        l.write("Build Options:", 2, "", 0, l.colors.white);
        l.value("   testsuite enabled", !!this.build.options.testsuite, 2);
        l.value("   types enabled", !!this.build.options.types, 2);
        l.value("   tsbundle enabled", !!this.build.options.types?.bundle, 2);
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
        l.value("   source code ext", this.source.ext, 1);
        l.value("   source code type", this.source.type, 1);
        l.value("   ts/js config file", this.source.config.file, 2);
        l.value("   ts/js config directory", this.source.config.dir, 2);
        l.value("   ts/js config path", this.source.config.path, 2);
        l.value("   sourcecode configured options", JSON.stringify(pickNot(this.build.source.config, "raw", "options")), 3);
        l.value("   ts/js configured options", JSON.stringify(pickNot(this.build.source.config.options, "compilerOptions", "files")), 3);
        l.value("   ts/js configured compiler options", JSON.stringify(this.build.source.config.options.compilerOptions), 3);
        l.value("   ts/js configured files", JSON.stringify(this.build.source.config.options.files), 4);
        l.sep();
    };


    /**
     * @private
     * @param {WpwError} e
     * @param {Function} fn
     * @param {string} [icon]
     */
    printNonFatalIssue = (e, fn, icon) =>
    {
        if (!icon || fn.name !== "write") {
            fn.call(this.logger, `Location: ${e.file}`);
        }
        else {
            fn.call(this.logger, `Location: ${e.file}`, undefined, "", this.logger.icons.color.star);
        }
        fn.call(this.logger, "   " + e.message);
    };


    /**
     * @private
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
