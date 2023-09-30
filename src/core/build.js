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
const WpwError = require("../utils/message");
const webpackExports = require("../exports");
const typedefs = require("../types/typedefs");
const WpwLogger = require("../utils/console");
const { isAbsolute, relative, sep } = require("path");
const { isWpwBuildType, isWebpackTarget } = require("../types/constants");
const { objUtils, typeUtils, merge, apply, applyIf } = require("@spmeesseman/type-utils");
const { printBuildStart, printBuildProperties, printWpcProperties, utils, validateSchema } = require("../utils");


/**
 * @extends {WpwBase}
 * @implements {typedefs.IWpwBuildConfig}
 */
class WpwBuild extends WpwBase
{
    /**
     * @type {boolean}
     */
    auto;
    /**
     * @type {boolean}
     */
    debug;
    /**
     * @type {typedefs.WpwWebpackEntry}
     */
    entry;
    /**
     * @private
     * @type {WpwError[]}
     */
    errors;
    /**
     * @private
     * @type {WpwError[]}
     */
    info;
    /**
     * @type {typedefs.WpwLog}
     */
    log;
    /**
     * @type {typedefs.WpwWebpackMode}
     */
    mode;
    /**
     * @override
     * @type {string}
     */
    name;
    /**
     * @type {typedefs.WpwBuildOptions}
     */
    options;
    /**
     * @type {typedefs.WebpackConfigOverride}
     */
    overrides;
    /**
     * @type {typedefs.WpwRcPaths}
     */
    paths;
    /**
     * @type {typedefs.WpwSource}
     */
    source;
    /**
     * @type {typedefs.WpwSourceConfig}
     */
    sourceConfig;
    /**
     * @type {typedefs.WebpackTarget}
     */
    target;
    /**
     * @type {typedefs.WpwBuildType}
     */
    type;
    /**
     * @type {typedefs.WpwVsCode}
     */
    vscode;
    /**
     * @private
     * @type {WpwError[]}
     */
    warnings;
    /**
     * @type {typedefs.WpwWebpackConfig}
     */
    wpc;
    /**
     * @readonly
     * @type {typedefs.WpwWrapper}
     */
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
        this.configureDependencies();
        validateSchema(this, "WpwBuildConfig", this.logger);
        this.source = new WpwSource(objUtils.clone(config.source), this);
        this.disposables.push(this.source, this.logger);
        this.logger.write(`successfully initialized build wrapper instance '${this.name}'`, 2);
    }


    get buildCount() { return this.wrapper.buildCount; }
    get cmdLine() { return this.wrapper.args; }
    get hasError() { return this.errors.length > 0; }
    get hasErrorOrWarning() { return this.hasError || this.hasWarning; }
    get hasWarning() { return this.warnings.length > 0; }
    get isOnlyBuild() { return this.wrapper.isSingleBuild; }
    get pkgJson() { return this.wrapper.pkgJson; }
    get pkgJsonFilePath() { return this.wrapper.pkgJsonFilePath; }


	/**
	 * @private
	 */
    configureDependencies()
    {

        if (this.type === "app")
        {
            this.setOptionEnabled("optimization");
        }
        else if (this.type === "jsdoc")
        {
            this.setOptionEnabled("externals", false, "all");
        }
        else if (this.type === "script")
        {
        }
        else if (this.type === "types")
        {
            if (this.options.types?.mode === "tscheck")
            {
                this.setOptionEnabled("tscheck");
            }
        }
        else if (this.type === "tests")
        {
            this.setOptionEnabled("externals", true, "all", "presets");
        }
        else if (this.type === "webapp")
        {
        }

        if (this.type !== "types" && this.source.type === "typescript") // && this.source.options.ts?.loader !== "babel")
        {
            this.setOptionEnabled("tscheck");
        }

        if (this.options.devtool?.mode === "plugin")
        {
            this.setOptionEnabled("vendormod", true, "source_map_plugin");
        }

        if (this.debug) // as of wp 5.87, 'layers' are experimental, and used for creating release/debug modules
        {
            this.setOptionEnabled("experiments", false);
        }

        if (this.mode === "production" && this.type !== "jsdoc" && this.type !== "types")
        {
            this.setOptionEnabled("licensefiles");
        }

        if (!this.isOnlyBuild && this.wrapper.builds.find(b => b.options.wait?.enabled && b.options.wait.items?.find(i => i.name === this.name)))
        {
            this.options.wait = apply(this.options.wait, { enabled: true });
            applyIf(this.options.wait, { mode: "event "});
            this.setOptionEnabled("wait", false);
        }
    }


    /**
     * @override
     */
    async dispose()
    {
        const l = this.logger;
        if (this.info.length > 0) {
            l.write("FEEDBACK MESSAGES FOR THIS BUILD:", undefined, "", l.icons.blue.info);
            this.info.splice(0).forEach(e => l.info(e));
        }
        if (this.warnings.length > 0) {
            l.warning("NON-FATAL WARNINGS FOR THIS BUILD:");
            this.warnings.splice(0).forEach(w => l.warning(w));
        }
        // if (this.errors.length > 0) {
        //     //
        //     // Removed 9/24/23 - errors are added to compilation.errors array, and reported by the
        //     // wp infrastructure logger when it exits.  seems redundant to print them here too.
        //     // laving commented in case something changes and we put it back
        //     //
        //     l.write("ERRORS FOR THIS BUILD:", undefined, "", l.icons.color.error);
        //     this.errors.splice(0).forEach(e => l.error(e));
        // }
        for (const d of this.disposables.splice(0)) {
            const result = d.dispose();
            if (typeUtils.isPromise(result)) { await result; }
        }
    }


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
            // l.write(i.message, 1, pad, icons.blue.info, l.colors.white);
            this.info.push(i);
        }
        else if (/WPW[3-5][0-9][0-9]/.test(info.code))
        {
            const w = WpwError.get(objUtils.apply({ wpc: this.wpc, capture: this.addMessage }, info));
            // l.write(w.message, undefined, pad, icons.color.warning, l.colors.yellow);
            this.warnings.push(w);
            if (hasCompilation) {
                compilation.warnings.push(w);
            }
        }
        else if (/WPW[6-8][0-9][0-9]/.test(info.code))
        {
            const e = WpwError.get(objUtils.apply({ wpc: this.wpc, capture: this.addMessage }, info));
            this.errors.push(e);
            // l.write(info.message, undefined, pad, icons.color.error, l.colors.red);
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
     * @returns {typedefs.WpwBuild | undefined}
     */
    getBuild = (name) => this.wrapper.getBuild(name);


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
     * @param {typedefs.IWpwBuildConfig} config
     */
    getTarget(config)
    {
        let target = config.target;
        if (!isWebpackTarget(target))
        {
            target = "node";
            if (isWebpackTarget(this.cmdLine.target)) { target = this.cmdLine.target; }
            else if ((/^(?:web(?:worker|webapp|view))/).test(config.name) || config.type === "webapp") { target = "webworker"; }
            else if ((/^(?:web|browser)/).test(config.name)) { target = "web"; }
            else if ((/^(?:module|node|app)/).test(config.name) || config.type === "app") { target = "node"; }
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
     * @param {typedefs.IWpwBuildConfig} config
     * @returns {typedefs.WpwBuildType}
     */
    getType(config)
    {
        /** @type {typedefs.WpwBuildType | undefined} */
        let type;
        if (isWpwBuildType(config.type)) { type = config.type; }
        if (isWpwBuildType(config.name)) { type = config.name; }
        else if ((/^web(?:worker|app|view)/).test(config.name)) { type = "webapp"; }
        else if ((/^tests?(?:-?suite)?/).test(config.name)) { type = "tests"; }
        else if ((/^typ(?:es|ings)/).test(config.name)) { type = "types"; }
        else if (config.target === "webworker") { type = "webapp"; }
        if (!type) { type = "app"; }
        return type;
    }


	/**
	 * @private
     * @param {typedefs.IWpwBuildConfig} config
	 */
    initConfig(config)
    {
        objUtils.applyIf(config, { target: this.getTarget(config), type: this.getType(config) });
        this.validateConfig(config);
        objUtils.apply(this, config);
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
     * @param {string} option
     * @param {boolean} [addSuggestion]
     * @param {...string} properties
     */
    setOptionEnabled(option, addSuggestion, ...properties)
    {
        let cfg = this.options[option];
        if (!(cfg && cfg.enabled === false))
        {
            if (!cfg) { cfg = this.options[option] = {}; }
            properties.filter(p => cfg[p] !== false).forEach((p) =>
            {
                cfg[p] = true;
                if (addSuggestion !== false)
                {
                    this.addMessage({
                        code: WpwError.Code.INFO_AUTO_ENABLED_OPTION,
                        message: `the '${option}.${p}' build option was auto-enabled`,
                        suggest: `explicitly enable/disable '${option}.${p}' in .wpcrc to silence this message`
                    });
                }
            });
        }
    }

    /**
     * @private
     * @param {typedefs.IWpwBuildConfig} config
     */
    validateConfig(config)
    {
        const _get = (/** @type {string} */ p) => new WpwError({
            wpc: this.wpc,
            capture: this.validateConfig,
            code: WpwError.Code.ERROR_RESOURCE_MISSING,
            message: `config validation failed for build ${this.name}: property ${p}`
        });
        if (!config.name) { throw _get("config.name"); }
        if (!config.type) { throw _get("config.type"); }
        if (!config.mode) { throw _get("config.mode"); }
        if (!config.target) { throw _get("config.target"); }
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
            l.error("Error encountered creating the webpack configuration for export, dumping current configurations:");
            logIcon = l.icons.color.error;
            throw e;
        }
        finally
        {   l.blank(undefined, logIcon);
            printBuildProperties(this, this.wrapper, logIcon);
            l.blank(undefined, logIcon);
            printWpcProperties(this, logIcon);
            l.blank(undefined, logIcon);
        }
    }

}


module.exports = WpwBuild;
