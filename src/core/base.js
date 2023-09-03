
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
const { lowerCaseFirstChar, merge, isArray, isPrimitive, WpBuildError, WpwBuildOptionsPluginKeys, WpwBuildOptionsExportKeys, isWpwBuildOptionsPluginKey, isWpwBuildOptionsExportKey, isWpwBuildOptionsExportKeyInternal, isWpwBuildOptionsPluginKeyInternal } = require("../utils");

let schema;


/**
 * @abstract
 * @implements {typedefs.IWpwBase}
 * @implements {typedefs.IDisposable}
 */
class WpwBase
{
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
        this.hashDigestLength = this.wpc.output.hashDigestLength || 20;
        this.initGlobalCache();
        this.app.disposables.push(this);
    }

    /**
     * To be overridden by inheriting class if disposing of resources is needed after build completes
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
    getOptionsConfig(key) { return WpwBase.getOptionsConfig(key, this.app.build.options); }


    /**
     * @template {typedefs.WpwBuildOptionsKey} K
     * @param {K} key
     * @param {typedefs.WpwBuildOptions} options
     * @returns {Exclude<typedefs.WpwBuildOptions[K], undefined>}
     */
    static getOptionsConfig = (key, options) =>
    {
        schema = schema || JSON.parse(readFileSync(resolve(__dirname, "../../schema/.wpbuildrc.schema.json"), "utf8"));

        let optionsCfg;
        const config = options[key];
        if (!config)
        {
            return /** @type {Exclude<typedefs.WpwBuildOptions[K], undefined>} */({ enabled: false });
        }
        else {
            optionsCfg = merge(/** @type {Exclude<typedefs.WpwBuildOptions[K], undefined>} */({ enabled: true }), config);
        }
        let schemaProperty = schema.definitions.WpwBuildOptions[key];
        if (schemaProperty)
        {
            while (schemaProperty.$ref) {
                schemaProperty = schema.definitions[schemaProperty.$ref.replace("#/definitions/", "")];
            }
            if (schemaProperty.oneOf)
            {
                schemaProperty = schemaProperty[1];
                while (schemaProperty.$ref) {
                    schemaProperty = schema.definitions[schemaProperty.$ref.replace("#/definitions/", "")];
                }
            }
            if (schemaProperty.type === "object" && schemaProperty.properties)
            {
                for (const [ key, def ] of Object.entries(schemaProperty.properties))
                {
                    if (typeof optionsCfg[key] === "undefined" || optionsCfg[key] === undefined)
                    {
                        if (def.default || isPrimitive(def.default)) {
                            optionsCfg[key] = def.default;
                        }
                        else if (def.type === "string") {
                            optionsCfg[key] = "";
                        }
                        else if (def.type === "boolean") {
                            optionsCfg[key] = false;
                        }
                        else if (isArray(def.enum)) {
                            optionsCfg[key] = def.enum[0];
                        }
                        else if (def.type === "object") {
                            optionsCfg[key] = {};
                        }
                        else if (def.type === "array") {
                            optionsCfg[key] = [];
                        }
                    }
                }
            }
        }
        return /** @type {Exclude<typedefs.WpwBuildOptions[K], undefined>} */(optionsCfg);
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
     */
    pluginsNoOpts = [ "dispose" ];


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
