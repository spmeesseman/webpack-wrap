
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
const { merge, isObject, WpwLogger, apply, pickNot, isPromise } = require("../utils");


/**
 * @abstract
 * @implements {typedefs.IWpwBase}
 * @implements {typedefs.IDisposable}
 */
class WpwBase
{
    /** @type {typedefs.IDisposable[]} */
    disposables;
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
            disposables: [],
            global: globalEnv,
            name: this.constructor.name,
            initialConfig: merge({}, pickNot(options, "app"))
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

}


module.exports = WpwBase;
