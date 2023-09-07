
// @ts-check

/**
 * @file core/base.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const globalEnv = require("../utils/global");
const typedefs = require("../types/typedefs");
const { merge, isObject, WpwLogger, apply } = require("../utils");


/**
 * @abstract
 * @implements {typedefs.IWpwBase}
 * @implements {typedefs.IDisposable}
 */
class WpwBase
{
    /** @type {typedefs.WpBuildGlobalEnvironment} */
    global;
    /** @type {typedefs.WpwBaseOptions} */
    initialConfig;
    /** @type {typedefs.WpwLogger} @abstract */
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
            global: globalEnv,
            name: this.constructor.name,
            initialConfig: merge({}, options)
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


    /**
     * @abstract
     */
    dispose() {}

}


module.exports = WpwBase;
