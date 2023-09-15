/* eslint-disable jsdoc/valid-types */
/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/**
 * @file src/core/build.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const WpwBase = require("./base");
const { existsSync } = require("fs");
const wpexports = require("../exports");
const typedefs = require("../types/typedefs");
const WpwSourceCode = require("./sourcecode");
const { isAbsolute, relative, sep } = require("path");
const { isWpwBuildType, isWebpackTarget } = require("../types/constants");
const {
    applySchemaDefaults, objUtils, printNonFatalIssue, printBuildStart, printBuildProperties,
    printWpcProperties, typeUtils, utils, validateSchema, WpwError, WpwLogger
} = require("../utils");


/**
 * @extends {WpwBase}
 * @implements {typedefs.IWpwBuildConfig}
 */
class WpwBuild extends WpwBase
{
    /** @type {boolean | undefined} */
    active;
    /** @type {typedefs.WpwWebpackAliasConfig} */
    alias;
    /** @type {boolean} */
    auto;
    /** @type {boolean} */
    debug;
    /** @type {typedefs.WpwWebpackEntry} */
    entry;
    /** @type {WpwError[]} @private */
    errors;
    /** @type {WpwError[]} @private */
    info;
    /** @type {typedefs.WpwLog} */
    log;
    /** @type {typedefs.WpwWebpackMode} */
    mode;
    /** @type {string} @override */
    name;
    /** @type {typedefs.WpwBuildOptions} */
    options;
    /** @type {typedefs.WpwRcPaths} */
    paths;
    /** @type {typedefs.WpwSourceCode} */
    source;
    /** @type {typedefs.WebpackTarget} */
    target;
    /** @type {typedefs.WpwBuildType} */
    type;
    /** @type {typedefs.WpwVsCode} */
    vscode;
    /** @type {WpwError[]} @private */
    warnings;
    /** @type {typedefs.WpwWebpackConfig} */
    wpc;
    /** @type {typedefs.WpwRc}} @private */
    wrapper;


    /**
     * @param {typedefs.IWpwBuildConfig} config
     * @param {typedefs.WpwRc} wrapper
     */
    constructor(config, wrapper)
    {
        super(config);
        objUtils.apply(this, { info: [], errors: [], warnings: [], wrapper });
        this.validateConfig(config);
        this.configure(config);
        this.logger = new WpwLogger(this.log);
        this.logger.write(`initializing configured build '${this.name}'`, 1);
        this.source = new WpwSourceCode(objUtils.clone(config.source), this);
        validateSchema(this, "WpwBuildConfig", this.logger);
        this.disposables.push(this.source, this.logger);
        this.logger.write(`successfully initialized build wrapper instance '${this.name}'`, 2);
    }


	/**
	 * @private
     * @param {typedefs.IWpwBuildConfig} buildConfig
	 */
    configure(buildConfig)
    {
        objUtils.merge(this, buildConfig);
        objUtils.apply(this, { target: this.getTarget(), type: this.getType() });
        objUtils.apply(this.log, { envTag1: this.name, envTag2: this.target });
        this.mergeDefaultOptions();
        this.configureDependencyOptions();
    }


	/**
	 * @private
	 */
    configureDependencyOptions()
    {
        const messages = [];
        const optionMessage = (/** @type {string} */o) =>
              `the ${o} option was auto-enabled, enable this option for the ${this.name} build in .wpwraprc to bury this message`;

        if (this.type === "types")
        {
            if (this.options.types?.mode === "tscheck" && !this.options.tscheck)
            {
                this.options.tscheck = { enabled: true };
                utils.pushIfNotExists(messages, "tscheck");
            }
        }
        else if (this.type === "tests")
        {
            if  (!this.options.vendormod || !this.options.vendormod.nyc)
            {
                this.options.vendormod = objUtils.merge(this.options.vendormod, { enabled: true, nyc: true });
                utils.pushIfNotExists(messages, "vendormod.nyc");
            }
        }

        if (this.type !== "types" && this.source.type === "typescript" && !this.options.tscheck)
        {
            this.options.tscheck = { enabled: true };
            utils.pushIfNotExists(messages, "tscheck");
        }

        if (this.options.sourcemaps)
        {
            if (!this.options.vendormod || !this.options.vendormod.source_map_plugin)
            {
                this.options.vendormod = objUtils.merge(this.options.vendormod, { enabled: true, source_map_plugin: true });
                utils.pushIfNotExists(messages, "vendormod.source_map_plugin");
            }
            if (this.options.devtool)
            {
                delete this.options.devtool;
                utils.pushIfNotExists(messages, "removed option devtool (sourcemaps overrides)");
            }
        }

        messages.forEach((m) => {
            this.addMessage({ code: WpwError.Msg.INFO_AUTO_ENABLED_OPTION, message: optionMessage(m) });
        });
    }


    /**
     * @override
     */
    async dispose()
    {
        const l = this.logger;
        if (this.info.length > 0) {
            l.warning("REPORTED INFORMATIONAL MESSAGES FOR THIS BUILD:");
            this.info.splice(0).forEach(e => printNonFatalIssue(this, e, l.warning));
        }
        if (this.warnings.length > 0) {
            l.warning("REPORTED NON-FATAL WARNINGS FOR THIS BUILD:");
            this.warnings.splice(0).forEach(w => printNonFatalIssue(this, w, l.warning));
        }
        if (this.errors.length > 0) {
            l.warning("REPORTED ERRORS FOR THIS BUILD:");
            this.errors.splice(0).forEach(e => printNonFatalIssue(this, e, l.error));
        }
        for (const d of this.disposables.splice(0)) {
            const result = d.dispose();
            if (typeUtils.isPromise(result)) { await result; }
        }
    }


    get buildCount() { return this.wrapper.buildCount; }
    get cmdLine() { return this.wrapper.args; }
    get isOnlyBuild() { return this.wrapper.isSingleBuild; }
    get pkgJson() { return this.wrapper.pkgJson; }


    /**
     * @param {typedefs.WpwMessageInfo} info
     * @param {string} [pad]
     */
    addMessage(info, pad)
    {
        const l = this.logger,
              icons = this.logger.icons,
              compilation = info.compilation,
              hasCompilation = compilation && typeUtils.isClass(compilation);
        if (/WPW[0-2][0-9][0-9]/.test(info.code))
        {
            const i = WpwError.get(objUtils.apply({ wpc: this.wpc }, info));
            l.write(i.message, 1, pad, icons.blue.info, l.colors.white);
            this.info.push(i);
        }
        else if (/WPW[3-5][0-9][0-9]/.test(info.code))
        {
            const w = WpwError.get(objUtils.apply({ wpc: this.wpc }, info));
            l.write(w.message, undefined, pad, icons.color.warning, l.colors.yellow);
            this.warnings.push(w);
            if (hasCompilation) {
                compilation.warnings.push(w);
            }
        }
        else if (/WPW[6-8][0-9][0-9]/.test(info.code))
        {
            const e = WpwError.get(objUtils.apply({ wpc: this.wpc }, info));
            this.errors.push(e);
            l.write(e.message, undefined, pad, icons.color.error, l.colors.red);
            if (hasCompilation) {
                compilation.errors.push(e);
            }
            else { throw e; }
        }
        else if (/WPW9[0-9][0-9]/.test(info.code)) {
            l.write("reserved message type", undefined, pad, icons.color.warning);
        }
        else { l.warning("unknown message type", pad); }
    }


    /**
     * @param {string} name
     * @returns {typedefs.IWpwBuildConfig | undefined}
     */
    getBuildConfig = (name) => this.wrapper.getBuildConfig(name);


    /**
     * @template {typedefs.WpwGetRcPathOptions | undefined} P
     * @template {P extends { stat: true } ? string | undefined : string} R
     * @param {P} [options]
     * @returns {R}
     */
    getBasePath = (options) => (!options || !options.ctx ? this.getRcPath("base", options) : this.getRcPath("ctx", options));


    /**
     * @template {typedefs.WpwGetRcPathOptions | undefined} P
     * @template {P extends { stat: true } ? string | undefined : string} R
     * @param {P} [options]
     * @returns {R}
     */
    getContextPath = (options) => this.getRcPath("ctx", options);


    /**
     * @template {typedefs.WpwGetRcPathOptions | undefined} P
     * @template {P extends { stat: true } ? string | undefined : string} R
     * @param {P} [options]
     * @returns {R}
     */
    getDistPath = (options) => /** @type {R} */(this.getRcPath("dist", options));


    /**
     * @private
     * @template {typedefs.WpwGetRcPathOptions | undefined} P
     * @template {P extends { stat: true } ? string | undefined : string} R
     * @param {typedefs.WpwRcPathsKey} pathKey
     * @param {P} [options]
     * @returns {R}
     */
    getRcPath(pathKey, options)
    {
        let path;
        const opts = options || /** @type {typedefs.WpwGetRcPathOptions} */({}),
              basePath = opts.ctx ? this.paths.ctx : this.paths.base,
              buildName = opts.build || this.name,
              build = this.getBuildConfig(buildName);

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
                        else
                        {
                            path = relative(basePath, path);
                            if (path === basePath) {
                                path = ".";
                            }
                            else if (opts.dot) {
                                path = "." + (opts.psx ? "/" : sep) + path;
                            }
                        }
                    }
                    else
                    {
                        if (opts.stat && !existsSync(utils.resolvePath(basePath, path))) {
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
                        path = utils.resolvePath(basePath, path);
                    }
                    if (opts.stat && !existsSync(utils.resolvePath(basePath, path))) {
                        path = undefined;
                    }
                }

                return path ? (!opts.psx ? path : path.replace(/\\/g, "/")) : undefined;
            }
        };

        if (build) {
            path = _getPath(build.paths[pathKey]);
        }

        return /** @type {R} */(path || _getPath(this.paths[pathKey]) || _getPath(this.wrapper.paths[pathKey]) || _getPath(basePath));
    }


    /**
     * @template {typedefs.WpwGetRcPathOptions | undefined} P
     * @template {P extends { stat: true } ? string | undefined : string} R
     * @param {P} [options]
     * @returns {R}
     */
    getSrcPath = (options) => this.getRcPath("src", options);


    /**
     * @private
     */
    getTarget()
    {
        let target = this.target;
        if (!isWebpackTarget(target))
        {
            target = "node";
            if (isWebpackTarget(this.cmdLine.target)) { target = this.cmdLine.target; }
            else if ((/web(?:worker|webapp|view)/).test(this.name) || this.type === "webapp") { target = "webworker"; }
            else if ((/web|browser/).test(this.name)) { target = "web"; }
            else if ((/module|node|app/).test(this.name) || this.type === "app") { target = "node"; }
        }
        return target;
    }


    /**
     * @private
     */
    getType()
    {
        let type = this.type;
        if (!type)
        {
            type = "app";
            if (isWpwBuildType(this.name)) { type = this.name; }
            else if ((/web(?:worker|app|view)/).test(this.name)) { type = "webapp"; }
            else if ((/tests?/).test(this.name)) { type = "tests"; }
            else if ((/typ(?:es|ings)/).test(this.name)) { type = "types"; }
            else if (this.target === "webworker") { type = "webapp"; }
        }
        return type;
    }


    /**
     * @private
     * @throws {WpwError}
     */
    mergeDefaultOptions()
    {
        const options = this.options,
              initialOptions = this.initialConfig.options;
        Object.keys(options).forEach((k) =>
        {
            applySchemaDefaults(options[k], "WpwBuildOptions", k);
            if (options[k] === true) {
                options[k] = { enabled: true };
            }
            else if (options[k] === false) {
                delete options[k];
            }
            else if (typeUtils.isObject(options[k]))
            {
                if (options[k].enabled === false || options[k].enabled !== true)
                {
                    if (!initialOptions[k] || initialOptions[k].enabled === false) {
                        delete options[k];
                    }
                    else { options[k].enabled = true; }
                }
                else if (typeUtils.isObjectEmpty(options[k]) || typeUtils.isEmpty(options[k].enabled)) {
                    options[k].enabled = true;
                }
            }
            else {
                throw WpwError.get({ code: WpwError.Msg.ERROR_SCHEMA_VALIDATION, message: `build options [${this.name}]` });
            }
        });
    }


    /**
     * @private
     * @param {typedefs.IWpwBuildConfig} config
     */
    validateConfig(config)
    {
        if (!config.name) { throw WpwError.getErrorMissing("build[config.name]"); }
        if (!config.type) { throw WpwError.getErrorMissing("build[config.type]"); }
        if (!config.mode) { throw WpwError.getErrorMissing("build[config.mode]"); }
        if (!config.target) { throw WpwError.getErrorMissing("build[config.target]"); }
    }


    /**
     * @private
     * @returns {typedefs.WpwWebpackConfig}
     */
    webpackDefaultExports = () =>
    {
        const build = this;
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
     * @returns {typedefs.WpwWebpackConfig}
     */
    webpackExports = () =>
    {
        this.wpc = this.webpackDefaultExports();
        this.global.buildCount = this.global.buildCount || 0;
        printBuildStart(this);
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
            printBuildProperties(this, this.wrapper);
            printWpcProperties(this);
        }
        catch (e)
        {   this.logger.blank(undefined, this.logger.icons.color.error);
            this.logger.error("An error was encountered while creating the webpack configuration export");
            this.logger.error("Using the following build parameters:");
            this.logger.blank(undefined, this.logger.icons.color.error);
            printBuildProperties(this, this.wrapper);
            this.logger.blank(undefined, this.logger.icons.color.error);
            throw e;
        }
        return this.wpc;
    };

}


module.exports = WpwBuild;
