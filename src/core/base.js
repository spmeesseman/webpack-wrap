
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
    /** @type {typedefs.JsonSchema} @private */
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
        this.buildOptions  = this.getBuildOptions(this.key);
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
     * @template {typedefs.WpwBuildOptionsKey} K
     * @param {K} key
     */
    getBuildOptions(key) { return WpwBase.getBuildOptions(key, this.app); }


    /**
     * @template {typedefs.WpwBuildOptionsKey} K
     * @param {K} key
     * @param {typedefs.WpBuildApp} app
     * @returns {NonNullable<typedefs.WpwBuildOptions[K]>}
     */
    static getBuildOptions = (key, app) =>
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

        const buildConfig = getDefinitionSchemaProperties(buildOptionSchema.properties[/** @type {string} */(key)], definitions);
        if (!buildConfig || !isObject(buildConfig)) {
            return emptyConfig;
        }

        return this.mergeOptions(optionsCfg, buildConfig, definitions);
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
     * @param {typedefs.JsonSchema} schemaObject
     * @param {any} definitions
     * @param {string} [baseKey]
     * @returns {T}
     * @throws {WpBuildError}
     */
    static mergeOptions = (optionsCfg, schemaObject, definitions, baseKey) =>
    {
        for (const [ k, def ] of Object.entries(schemaObject))
        {
            const key = baseKey || k;
            if (def && (typeof optionsCfg[key] === "undefined" || optionsCfg[key] === undefined))
            {
                if (def.$ref)
                {
                    const schema = getDefinitionSchema(def, definitions);
                    if (schema.properties) {
                        this.mergeOptions(optionsCfg, schema.properties || schema, definitions, key);
                    }
                    else if (schema.default || isPrimitive(schema.default)) {
                        optionsCfg[key] = schema.default;
                    }
                }
                // else if (isBoolean(def)) {
                //     throw WpBuildError.getErrorProperty("schema.definition." + key);
                // }
                else if (isPrimitive(def) || isArray(def)) {
                    throw WpBuildError.getErrorProperty("schema.definition." + key);
                }
                else if (def.default) {
                    // if (isPrimitive(def.default)) {
                        optionsCfg[key] = def.default;
                    // }
                    // else {
                    //     optionsCfg[key] = undefined; // ?
                    // }
                }
                // else if (def.type === "string") {
                //     optionsCfg[key] = undefined;
                // }
                // else if (def.type === "boolean") {
                //     optionsCfg[key] = undefined;
                // }
                // else if (isArray(def.enum)) {
                //     optionsCfg[key] = undefined;
                // }
                // else if (isArray(def.oneOf)) {
                //     optionsCfg[key] = undefined;
                // }
                // else if (def.type === "array") {
                //     optionsCfg[key] = undefined; // [];
                // }
                else {
                    optionsCfg[key] = undefined; // {};
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
            throw WpBuildError.getErrorMissing("app", this.wpc, "invalid option[app]");
        }
        if (!this.isValidOptionsKey(options.key)) {
            throw WpBuildError.getErrorProperty("key", this.wpc, `invalid option[key], '${options.key}' does not exist in build options`);
        }
    }

}

module.exports = WpwBase;
