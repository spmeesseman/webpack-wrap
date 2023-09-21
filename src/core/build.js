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
const WpwSource = require("./source");
const webpackExports = require("../exports");
const typedefs = require("../types/typedefs");
const { isAbsolute, relative, sep } = require("path");
const { isWpwBuildType, isWebpackTarget } = require("../types/constants");
const {
    applySchemaDefaults, objUtils, printNonFatalIssue, printBuildStart, printBuildProperties,
    printWpcProperties, typeUtils, utils, validateSchema, WpwError, WpwLogger, pushUniq, merge
} = require("../utils");


/**
 * @extends {WpwBase}
 * @implements {typedefs.IWpwBuildConfig}
 */
class WpwBuild extends WpwBase
{
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
    /** @type {typedefs.WebpackConfigOverride} */
    overrides;
    /** @type {typedefs.WpwRcPaths} */
    paths;
    /** @type {typedefs.WpwSource} */
    source;
    /** @type {typedefs.WpwSourceConfig} */
    sourceConfig;
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
    /** @type {typedefs.WpwWrapper}} @private */
    wrapper;


    /**
     * @param {typedefs.IWpwBuildConfig} config
     * @param {typedefs.WpwWrapper} wrapper
     */
    constructor(config, wrapper)
    {
        super(config);
        objUtils.apply(this, { info: [], errors: [], warnings: [], wrapper });
        this.initConfig(config);
        this.initLogger();
        this.configureDependencyOptions();
        validateSchema(this, "WpwBuildConfig", this.logger);
        this.source = new WpwSource(objUtils.clone(config.source), this);
        this.disposables.push(this.source, this.logger);
        this.logger.write(`successfully initialized build wrapper instance '${this.name}'`, 2);
    }


	/**
	 * @private
	 */
    configureDependencyOptions()
    {
        const messages = [];
        const optionMessage = (/** @type {string} */o) =>
              `the ${o} option was auto-enabled, enable this option for the ${this.name} build in .wpwraprc to bury this message`;

        if (this.type === "app")
        {
            if (!this.options.optimization)
            {
                this.options.optimization = { enabled: true };
                pushUniq(messages, "optimization");
            }
        }
        else if (this.type === "types")
        {
            if (this.options.types?.mode === "tscheck" && !this.options.tscheck)
            {
                this.options.tscheck = { enabled: true };
                pushUniq(messages, "tscheck");
            }
        }
        else if (this.type === "tests")
        {
            if  (!this.options.vendormod || !this.options.vendormod.nyc)
            {
                this.options.vendormod = objUtils.merge(this.options.vendormod, { enabled: true, nyc: true });
                pushUniq(messages, "vendormod.nyc");
            }
        }

        if (this.type !== "types" && this.source.type === "typescript" && !this.options.tscheck)
        {
            this.options.tscheck = { enabled: true };
            pushUniq(messages, "tscheck");
        }

        if (this.debug) // as of wp 5.87, 'layers' are experimental, and used for creating release/debug modules
        {
            this.options.experiments = { enabled: true };
            pushUniq(messages, "experiments");
        }

        if (this.options.sourcemaps)
        {
            if (!this.options.vendormod || !this.options.vendormod.source_map_plugin)
            {
                this.options.vendormod = objUtils.merge(this.options.vendormod, { enabled: true, source_map_plugin: true });
                pushUniq(messages, "vendormod.source_map_plugin");
            }
            if (this.options.devtool)
            {
                delete this.options.devtool;
                pushUniq(messages, "removed option devtool (sourcemaps overrides)");
            }
        }

        if ((this.options.analyze?.analyzer || this.cmdLine.analyze) && !this.options.devtool && !this.options.sourcemaps)
        {
            this.options.sourcemaps = { enabled: true };
            pushUniq(messages, "sourcemaps");
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
            l.write("REPORTED INFORMATIONAL MESSAGES FOR THIS BUILD:", undefined, "", l.icons.blue.info);
            this.info.splice(0).forEach(e => printNonFatalIssue(this, e, l.write));
        }
        if (this.warnings.length > 0) {
            l.warning("REPORTED NON-FATAL WARNINGS FOR THIS BUILD:");
            this.warnings.splice(0).forEach(w => printNonFatalIssue(this, w, l.warning));
        }
        if (this.errors.length > 0) {
            l.write("REPORTED ERRORS FOR THIS BUILD:", undefined, "", l.icons.color.error);
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
            const i = WpwError.get(objUtils.apply({ wpc: this.wpc, capture: this.addMessage }, info));
            l.write(i.message, 1, pad, icons.blue.info, l.colors.white);
            this.info.push(i);
        }
        else if (/WPW[3-5][0-9][0-9]/.test(info.code))
        {
            const w = WpwError.get(objUtils.apply({ wpc: this.wpc, capture: this.addMessage }, info));
            l.write(w.message, undefined, pad, icons.color.warning, l.colors.yellow);
            this.warnings.push(w);
            if (hasCompilation) {
                compilation.warnings.push(w);
            }
        }
        else if (/WPW[6-8][0-9][0-9]/.test(info.code))
        {
            const e = WpwError.get(objUtils.apply({ wpc: this.wpc, capture: this.addMessage }, info));
            this.errors.push(e);
            l.write(info.message, undefined, pad, icons.color.error, l.colors.red);
            if (hasCompilation) {
                compilation.errors.push(e);
            }
        }
        else if (/WPW9[0-9][0-9]/.test(info.code)) {
            l.write("reserved message type", undefined, pad, icons.color.warning);
        }
        else { l.warning("unknown message type", pad); }
    }


    /**
     * @template {typedefs.WpwGetRcPathOptions | undefined} P
     * @template {P extends { stat: true } ? string | undefined : string} R
     * @param {P} [options]
     * @returns {R}
     */
    getBasePath = (options) => (!options || !options.ctx ? this.getRcPath("base", options) : this.getRcPath("ctx", options));


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

        /** @returns {R} */
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
            }
            else if (opts.fallback)
            {
                path = _getPath(this.getBuildConfig("app")?.paths[pathKey]) || _getPath(basePath);
            }
            path = !path || !opts.psx ? path : path.replace(/\\/g, "/");
            return /** @type {R} */(path);
        };
        const opts = options || /** @type {typedefs.WpwGetRcPathOptions} */({}),
              basePath = opts.ctx ? this.paths.ctx : this.paths.base,
              build = opts.build ? this.getBuildConfig(opts.build) : undefined;
        return !build ? _getPath(this.paths[pathKey]) : _getPath(build.paths[pathKey]);
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
     * @template {typedefs.WpwGetRcPathOptions | undefined} P
     * @template {P extends { stat: true } ? string | undefined : string} R
     * @param {P} [options]
     * @returns {R}
     */
    getTempPath = (options) => this.getRcPath("temp", options);


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
     * @param {typedefs.IWpwBuildConfig} config
	 */
    initConfig(config)
    {
        this.validateConfig(config);
        objUtils.apply(this, config);
        objUtils.applyIf(this, { target: this.getTarget(), type: this.getType() });
        objUtils.apply(this.log, { envTag1: this.name, envTag2: this.target });
    }


    /**
     * @private
     */
    initLogger()
    {
        this.logger = new WpwLogger(this.log);
        this.logger.write(`initializing configured build '${this.name}'`, 1);
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
     * @returns {typedefs.WpwWebpackConfig}
     * @throws {WpwError}
     */
    webpackExports()
    {
        const l = this.logger;
        let logIcon = this.logger.icons.color.info;
        printBuildStart(this);
        try
        {   const wpc = webpackExports(this);
            if (this.errors.length > 0)
            {
                l.write("webpack configuration builder reported errors for this build", undefined, "", l.icons.color.error);
                this.errors.splice(0).forEach(e => { l.blank(undefined, l.icons.color.error); l.error(e); });
                throw new Error("falied to build webpack configuration, check details in log output");
            }
            merge(wpc, this.wrapper.overrides, this.wrapper[this.wrapper.mode].overrides, this.overrides);
            return wpc;
        }
        catch (e)
        {   l.blank(undefined, l.icons.color.error);
            l.error("An error was encountered while creating the webpack configuration export");
            l.error("   dumping build and webpack configurations:");
            logIcon = l.icons.color.error;
            throw e;
        }
        finally
        {   l.blank(undefined, logIcon);
            printBuildProperties(this, this.wrapper);
            l.blank(undefined, logIcon);
            printWpcProperties(this);
            l.blank(undefined, logIcon);
        }
    }

}


module.exports = WpwBuild;
