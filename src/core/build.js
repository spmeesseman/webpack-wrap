/* eslint-disable jsdoc/valid-types */
/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/**
 * @file src/core/build.js
 * @version 0.0.1
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
const { objUtils, typeUtils, merge } = require("@spmeesseman/type-utils");
const { isWpwBuildType, isWebpackTarget } = require("../types/constants");
const { printBuildStart, printBuildProperties, printWpcProperties, utils, validateSchema } = require("../utils");


/**
 * @extends {WpwBase}
 * @implements {typedefs.IDisposable}
 * @implements {typedefs.IWpwBuildConfig}
 */
class WpwBuild extends WpwBase
{
    static disposeCount = 0;

    /**
     * @type {boolean}
     */
    auto;
    /**
     * @type {boolean}
     */
    debug;
    /**
     * @type {typedefs.IDisposable[]}
     */
    disposables;
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
     * @private
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
        objUtils.apply(this, { disposables: [], info: [], errors: [], warnings: [], wrapper });
        this.initConfig(config);
        this.initLogger();
        this.configureDependencies();
        validateSchema(this, "WpwBuildConfig", this.logger);
        this.source = new WpwSource(objUtils.clone(config.source), this);
        this.disposables.push(this.source, this.logger);
        this.logger.write(`successfully initialized build wrapper instance '${this.name}'`, 2);
    }


    get builds() { return this.wrapper.builds; }
    get buildConfigs() { return this.wrapper.buildConfigs; }
    get buildCount() { return this.wrapper.buildCount; }
    get cmdLine() { return this.wrapper.args; }
    get errorCount() { return this.errors.length; }
    get hasError() { return this.errors.length > 0; }
    get hasErrorOrWarning() { return this.hasError || this.hasWarning; }
    get hasWarning() { return this.warnings.length > 0; }
    get isOnlyBuild() { return this.wrapper.isSingleBuild; }
    get pkgJson() { return this.wrapper.pkgJson; }
    get pkgJsonFilePath() { return this.wrapper.pkgJsonFilePath; }


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
            this.info.push(i);
        }
        else if (/WPW[3-5][0-9][0-9]/.test(info.code))
        {
            const w = WpwError.get(objUtils.apply({ wpc: this.wpc, capture: this.addMessage }, info));
            this.warnings.push(w);
            if (hasCompilation) {
                compilation.warnings.push(w);
            }
        }
        else if (/WPW[6-8][0-9][0-9]/.test(info.code))
        {
            const e = WpwError.get(objUtils.apply({ wpc: this.wpc, capture: this.addMessage }, info));
            this.errors.push(e);
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
	 * @private
	 */
    configureDependencies()
    {
        this.configureDependenciesByMode();
        this.configureDependenciesByType();
        if (this.options.devtool?.mode === "plugin")
        {
            this.setOptionEnabled("vendormod", false, "source_map_plugin");
        }
        if (this.debug) // as of wp 5.87, 'layers' are experimental, and used for creating release/debug modules
        {
            this.setOptionEnabled("experiments", true);
        }
        if ((this.options.copy && this.options.copy.enabled !== false) ||
            (this.options.runtimevars && this.options.runtimevars.enabled !== false))
        {
            this.setOptionEnabled("hash", true);
        }
    }


    configureDependenciesByMode()
    {

        if (this.mode === "production")
        {
            if (this.type !== "jsdoc" && this.type !== "script" && this.type !== "types")
            {
                this.setOptionEnabled("licensefiles");
            }
            if (this.type === "app")
            {
                this.setOptionEnabled("output", true, "hash");
                this.setOptionEnabled("copy", true, "entryModuleNoHash");
            }
        }
        else if (this.mode === "development")
        {
            if (this.options.output?.hash)
            {
                this.options.output.hash = false;
            }
        }
        else // if (this.mode === "none" || this.mode === "test")
        {
            if (this.options.output?.hash)
            {
                this.options.output.hash = false;
            }
        }
    }


    configureDependenciesByType()
    {
        if (this.type === "app")
        {
            this.setOptionEnabled("externals", false, "defaults");
        }
        else if (this.type === "jsdoc")
        {
            this.setOptionEnabled("externals", false, "all");
        }
        else if (this.type === "script")
        {
            this.setOptionEnabled("externals", false, "all", "presets");
        }
        else if (this.type === "types")
        {
            this.setOptionEnabled("externals", false, "all", "presets");
            if (this.options.types?.mode === "tscheck")
            {
                this.setOptionEnabled("tscheck");
            }
        }
        else if (this.type === "tests")
        {
            this.setOptionEnabled("externals", false, "all", "presets");
        }
        else if (this.type === "webapp")
        {
        }

        if (this.type !== "types")
        {
            if (this.source.type === "typescript")
            {
                this.setOptionEnabled("tscheck");
            }
        }
    }


    dispose()
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
        this.disposables.splice(0).forEach(d => d.dispose());
        if (++WpwBuild.disposeCount === this.buildCount) {
            this.wrapper.dispose();
        }
    }


    /**
     * @template {typedefs.WpwGetRcPathOptions | undefined} P
     * @template {P extends { stat: true } ? string | undefined : string} R
     * @param {P} [options]
     * @returns {R}
     */
    getBasePath = (options) => (!options || !options.ctx ? this.getRcPath("base", options) : this.getRcPath("ctx", options));


    /**
     * @param {string} nameOrType
     * @returns {typedefs.WpwBuild | undefined}
     */
    getBuild = (nameOrType) => this.wrapper.getBuild(nameOrType);


    /**
     * @param {string} nameOrType
     * @returns {typedefs.IWpwBuildConfig | undefined}
     */
    getBuildConfig = (nameOrType) => this.wrapper.getBuildConfig(nameOrType);


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
     * @param {boolean} [force]
     * @param {...string} properties
     */
    setOptionEnabled(option, force, ...properties)
    {
        let cfg = this.options[option];
        if (!(cfg && cfg.enabled === false) || force === true)
        {
            if (!cfg) { cfg = this.options[option] = {}; }
            properties.filter(p => cfg[p] !== false || force === true).forEach((p) =>
            {
                cfg[p] = true;
                if (force !== true)
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
        let logIcon;
        printBuildStart(this);
        try
        {   const wpc = webpackExports(this);
            if (this.errors.length > 0)
            {
                l.write("webpack configuration builder reported errors for this build", undefined, "", l.icons.color.error);
                this.errors.splice(0).forEach(e => { l.blank(undefined, l.icons.color.error); l.error(e); });
                throw new Error("failed to build webpack exports configuration, check details in log output");
            }
            merge(wpc, this.wrapper.overrides, this.wrapper[this.wrapper.mode].overrides, this.overrides);
            return wpc;
        }
        catch (e)
        {   l.blank(undefined, l.icons.color.error);
            l.error("Error encountered creating the webpack exports configuration, dumping current configurations:");
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
