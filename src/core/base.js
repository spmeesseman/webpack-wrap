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
const { apply, isObject, isPromise, merge, pickNot } = require("../utils");


/**
 * @abstract
 * @implements {typedefs.IWpwBase}
 * @implements {typedefs.IDisposable}
 */
class WpwBase
{
    /** @type {typedefs.IDisposable[]} */
    disposables;
    /** @type {typedefs.IWpwGlobalEnvironment} */
    global;
    /** @type {typedefs.WpwBaseOptions} */
    initialConfig;
    /** @type {WpwLogger} @abstract */
    logger;
    /**  @type {string} */
    name;
    /** @type {any} @abstract @protected */
    options;


    /**
     * @param {typedefs.WpwBaseOptions} options
     */
	constructor(options)
    {
        apply(this, {
            disposables: [],
            global: globalEnv,
            name: this.constructor.name,
            initialConfig: merge({}, pickNot(options, "build"))
        });

        if (isObject(options.logger))
        {
            if (options.logger instanceof WpwLogger) {
                this.logger = options.logger;
            }
            else {
                this.logger = new WpwLogger(options.logger);
            }
        }
    }


    async dispose()
    {
        for (const d of this.disposables.splice(0))
        {
            const result = d.dispose();
            if (isPromise(result)) { await result; }
        }
        this.logger.dispose();
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
    //     WpwKeysEnum[key]?.forEach((/** @type {string} */ cKey) =>
    //     {
    //         if (isNulled(config[cKey])) {
    //             throw WpwError.getErrorMissing(`config: ${key} : ${cKey} [${config[cKey]}]`);
    //         }
    //     });
    // }

}


module.exports = WpwBase;
