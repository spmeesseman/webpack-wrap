
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
    getSchemaDefinition, isWpwBuildOptionsExportKey, isWpwBuildOptionsExportKeyInternal,
    isWpwBuildOptionsPluginKeyInternal, isBoolean, isObject, asArray
} = require("../utils");


/**
 * @abstract
 * @implements {typedefs.IWpwBase}
 * @implements {typedefs.IDisposable}
 */
class WpwBase
{
    /** @type {typedefs.Schema} @private */
    static schema;

    /** @type {typedefs.WpBuildApp} */
    app;
    // eslint-disable-next-line jsdoc/valid-types
    /** @type {Exclude<typedefs.WpwBuildOptions[typedefs.WpwBuildOptionsKey], undefined>} @abstract */
    buildOptions;
    /** @type {Record<string, any>} @protected  */
    global;
    /** @type {string}  @protected */
    globalBaseProperty;
    /** @protected */
    hashDigestLength;
    /** @type {typedefs.WpwBuildOptionsKey} @protected */
    key;
    /** @type {typedefs.WpBuildConsoleLogger} */
    logger;
    /**  @protected */
    name;
    /** @type {typedefs.WpwBaseOptions} @abstract @protected */
    options;
    /** @private */
    pluginsNoOpts = [ "dispose" ];
    /** @type {typedefs.WpwSourceCodeConfig} @protected */
    sourceConfig;
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
        this.buildOptions  = this.getOptionsConfig(this.key);
		this.sourceConfig = merge({}, this.app.build.source.config);
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
        throw WpBuildError.getAbstractFunction("build[static]", "core/base.js", null, `this.name[${this.name}]`);
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
     * @template {typedefs.WpwBuildOptionsKey} K
     * @param {K} key
     */
    getOptionsConfig(key) { return WpwBase.getOptionsConfig(key, this.app); }


    /**
     * @template {typedefs.WpwBuildOptionsKey} K
     * @param {K} key
     * @param {typedefs.WpBuildApp} app
     * @returns {NonNullable<typedefs.WpwBuildOptions[K]>}
     */
    static getOptionsConfig = (key, app) =>
    {
        this.readSchema();

        let optionsCfg;
        const config = app.build.options[key],
              definitions = WpwBase.schema.definitions,
              emptyConfig = /** @type {typedefs.WpwBuildOptionsType<K>} */({ enabled: false });
        if (!config || !definitions) {
            return emptyConfig;
        }
        else {
            if (config.enabled === undefined) {
                config.enabled = true;
            }
            optionsCfg = merge({}, emptyConfig, config);
        }
        const buildOptionSchema = definitions.WpwBuildOptions;
        if (!buildOptionSchema || isBoolean(buildOptionSchema) || !buildOptionSchema.properties) {
            return emptyConfig;
        }

        const buildConfig = getSchemaDefinition(buildOptionSchema.properties[/** @type {string} */(key)], definitions);
        if (!buildConfig || !isObject(buildConfig)) {
            return emptyConfig;
        }

        return this.mergeOptions(optionsCfg, buildConfig);
    };


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
     * @template T
     * @param {T} optionsCfg
     * @param {typedefs.SchemaObject} object
     * @returns {T}
     */
    static mergeOptions = (optionsCfg, object) =>
    {
        for (const [ key, def ] of Object.entries(object))
        {
            if ((typeof optionsCfg[key] === "undefined" || optionsCfg[key] === undefined))
            {
                if (!def) {
                    continue;
                }
                if (isPrimitive(def)) {
                    optionsCfg[key] = def;
                    continue;
                }
                for (const d of /** @type {typedefs.SchemaObject[]} */(asArray(def)))
                {
                    if (d.default || isPrimitive(d.default)) {
                        optionsCfg[key] = d.default;
                    }
                    else if (d.type === "string") {
                        optionsCfg[key] = "";
                    }
                    else if (d.type === "boolean") {
                        optionsCfg[key] = false;
                    }
                    else if (isArray(d.enum)) {
                        optionsCfg[key] = d.enum[0];
                    }
                    else if (d.type === "array") {
                        optionsCfg[key] = [];
                    }
                    else { // if (d.type === "object") {
                        optionsCfg[key] = {};
                    }
                }
            }
        }
        return optionsCfg;
    };


    /**
     * @private
     */
    static readSchema = () =>
    {
        WpwBase.schema = WpwBase.schema ||
            JSON.parse(readFileSync(resolve(__dirname, "../../schema/.wpbuildrc.schema.json"), "utf8"));
    };


    /**
     * @private
     * @param {typedefs.WpwBaseOptions} options Plugin options to be applied
     * @throws {typedefs.WpBuildError}
     */
	validateOptions(options)
    {
        if (!options.app) {
            throw WpBuildError.getErrorMissing("app", "core/base.js", this.wpc, "invalid option[app]");
        }
        if (!this.isValidOptionsKey(options.key)) {
            throw WpBuildError.getErrorProperty("key", "core/base.js", this.wpc, `invalid option[key], '${options.key}' does not exist in build options`);
        }
    }

}

module.exports = WpwBase;
