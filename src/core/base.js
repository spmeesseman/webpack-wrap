/* eslint-disable jsdoc/valid-types */

// @ts-check

/**
 * @file src/core/base.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const globalEnv = require("../utils/global");
const typedefs = require("../types/typedefs");
const WpwLogger = require("../utils/console");
const { apply, isObject, isPromise, pickNot, clone, pushReturn } = require("@spmeesseman/type-utils");


/**
 * @abstract
 * @implements {typedefs.IWpwBase}
 * @implements {typedefs.IDisposable}
 */
class WpwBase
{
    /**
     * @type {typedefs.IDisposable[]}
     */
    disposables;
    /**
     * @type {typedefs.IWpwGlobalEnvironment}
     */
    global;
    /**
     * @type {typedefs.WpwBaseOptions}
     */
    initialConfig;
    /**
     * @abstract
     * @type {WpwLogger}
     */
    logger;
    /**
     * @type {string}
     */
    name;
    /**
     * @protected
     * @type {Record<string, any>}
     */
    options;


    /**
     * @param {typedefs.WpwBaseOptions} options
     */
	constructor(options)
    {
        apply(this, {
            options,
            disposables: [],
            global: globalEnv,
            name: this.constructor.name,
            initialConfig: clone(pickNot(options, "build"))
        });

        const logger = options.logger || options.build?.logger;
        if (isObject(logger))
        {
            if (logger instanceof WpwLogger) {
                this.logger = logger;
            }
            else {
                this.logger = pushReturn(this.disposables, new WpwLogger(logger));
            }
        }
    }

    /**
     * @returns {Promise<any>}
     */
    async dispose()
    {
        for (const d of this.disposables.splice(0))
        {
            const result = d.dispose();
            if (isPromise(result)) { await result; }
        }
    };



    /**
     * @protected
     * @template {any} T
     * @param {string} json
     * @returns {T | Record<string, unknown>}
     */
    jsonParseSafe(json)
    {
        try {
            return JSON.parse(json);
        }
        catch { return {}; }
    }


    /**
     * @protected
     * @param {any} jso
     * @returns {string}
     */
    jsonStringifySafe(jso)
    {
        try {
            return JSON.stringify(jso);
        }
        catch { return ""; }
    }


    // /**
    //  * @protected
    //  * @param {Record<string, any>} config
    //  * @param {string} key
    //  */
    // validateConfig(config, key)
    // {
    //     const _get = (/** @type {string} */ p) => new WpwError({
    //         wpc: this.wpc,
    //         capture: this.validateBaseTaskOptions,
    //         code: WpwError.Code.ERROR_RESOURCE_MISSING,
    //         message: `config validation failed for task module ${this.name}: property ${p}`
    //     });
    //     WpwKeysEnum[key]?.forEach((/** @type {string} */ cKey) =>
    //     {
    //         if (isNulled(config[cKey])) {
    //             throw _get(`config: ${key} : ${cKey} [${config[cKey]}]`);
    //         }
    //     });
    // }

}


module.exports = WpwBase;
