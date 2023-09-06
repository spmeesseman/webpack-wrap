
// @ts-check

/**
 * @file core/base.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const { resolve } = require("path");
const { readFileSync } = require("fs");
const typedefs = require("../types/typedefs");
const {
    lowerCaseFirstChar, merge, isArray, isPrimitive, WpBuildError, isWpwBuildOptionsPluginKey,
    getDefinitionSchemaProperties, isWpwBuildOptionsExportKey, isWpwBuildOptionsExportKeyInternal,
    isWpwBuildOptionsPluginKeyInternal, isBoolean, isObject, getDefinitionSchema
} = require("../utils");


/**
 * @abstract
 * @implements {typedefs.IWpwBase}
 * @implements {typedefs.IDisposable}
 */
class WpwBase
{
    /** @type {typedefs.WpBuildApp} */
    app;
    /** @type {Record<string, any>} @protected  */
    global;
    /** @type {string}  @protected */
    globalBaseProperty;
    /** @protected */
    hashDigestLength;
    /** @type {typedefs.WpwBuildOptionsKey} @protected */
    key;
    /** @type {typedefs.WpwLogger} */
    logger;
    /**  @protected */
    name;
    /** @type {typedefs.WpwBaseOptions} @abstract @protected */
    options;
    /** @private */
    pluginsNoOpts = [ "dispose" ];
    /** @protected */
    wpc;


    /**
     * @param {typedefs.WpwBaseOptions} options
     */
	constructor(options)
    {
        options.key = /** @type {typedefs.WpwBuildOptionsKey} */(options.key || this.baseName.toLowerCase());
        this.validateOptions(options);
        this.key = options.key;
        this.app = options.app;
        this.options = options;
        this.wpc = this.app.wpc;
        this.logger = this.app.logger;
        this.name = this.constructor.name;
        this.hashDigestLength = this.wpc.output.hashDigestLength || 20;
        this.initGlobalCache();
        this.app.disposables.push(this);
    }


	/**
     * @abstract
     * @param {any[]} _args
	 * @returns {WpwBase | undefined | never}
	 * @throws {typedefs.WpBuildError}
     */
	static build = (..._args) =>
    {
        throw WpBuildError.getAbstractFunction("build[static]", undefined, `this.name[${this.name}]`);
    };


    /**
     * @abstract
     */
    dispose() {}


    /**
     * @returns {typedefs.WpwBuildOptionsPluginKey}
     */
    get baseName() { return /** @type {typedefs.WpwBuildOptionsPluginKey} */(
        this.constructor.name.replace(/^Wpw|^WpBuild|Plugin$|(?:Webpack)?Export$/g, "")
    ); }


    /**
     * @private
     */
    initGlobalCache()
    {
        const baseProp = this.globalBaseProperty = lowerCaseFirstChar(this.baseName);
        if (!this.app.global[baseProp]) {
            this.app.global[baseProp] = {};
        }
        this.global = this.app.global[baseProp];
        this.options.globalCacheProps?.filter((/** @type {string} */p) => !this.global[p]).forEach(
            (/** @type {string} */p) => { this.global[p] = {}; }
        );
    }

    /**
     * @private
     * @template {string | undefined} K
     * @param {K} key
     * @returns {K is typedefs.WpwBuildOptionsKey}
     */
    isValidOptionsKey = (key) =>
        !!key && (this.pluginsNoOpts.includes(key) || isWpwBuildOptionsPluginKey(key) || isWpwBuildOptionsExportKey(key) ||
                  isWpwBuildOptionsExportKeyInternal(key) || isWpwBuildOptionsPluginKeyInternal(key));

    /**
     * @private
     * @param {typedefs.WpwBaseOptions} options Plugin options to be applied
     * @throws {typedefs.WpBuildError}
     */
	validateOptions(options)
    {
        if (!options.app) {
            throw WpBuildError.getErrorMissing("app", this.wpc, "invalid option[app]");
        }
        if (!this.isValidOptionsKey(options.key)) {
            throw WpBuildError.getErrorProperty("key", this.wpc, `invalid option[key], '${options.key}' does not exist in build options`);
        }
    }

}

module.exports = WpwBase;
