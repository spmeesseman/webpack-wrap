/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/wait.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const { existsSync } = require("fs");
const { EventEmitter } = require("events");
const typedefs = require("../types/typedefs");
const { WpwError, merge, isPromise, pushUniq } = require("../utils");


class WpwPluginWaitManager
{
    /**
	 * @private
     * @type {typedefs.WpwBuildOptionsKey[]}
     */
    done;
    /**
	 * @private
     * @type {typedefs.WpwBuildOptionsKey[]}
     */
    waiting;
    /**
	 * @private
     * @type {EventEmitter}
     */
    onPluginEvent;
    /**
	 * @private
     * @type {typedefs.WpwPluginWaitOptions[]}
     */
    registered;


    /**
     * @class WpwPluginWaitManager
     */
	constructor()
    {
        this.done = [];
        this.waiting = [];
        this.registered = [];
        this.onPluginEvent = new EventEmitter();
    }


    /**
     * @function
     * @param {string} event
     * @param {...any} args
     */
    emit(event, ...args) { this.onPluginEvent.emit(event, ...args); }


    /**
     * @function
     * @param {*} name
     * @param {...any} args
     * @returns {Promise<any> | any}
     */
    onPluginDone(name, ...args)
    {
        pushUniq(this.done, name);
        // this.waiting.splice(this.waiting.indexOf(), 1);
        this.onPluginEvent.emit(`${name}_done`, ...args);
        for (const r of this.registered.filter(r => name === r.name))
        {
            const res = r.callback(...args);
            if (isPromise(res)) {
                return res.then(r => r);
            }
            else { return res;}
        }
    }


    /**
     * @function
     * @private
     * @param {Required<typedefs.WpwPluginWaitOptions>} options
     * @returns {Promise<void>}
     */
    pollFile(options)
    {
        const start = Date.now();
        /**
         * @param {any} resolve
         * @param {any} reject
         */
        const _poll = (resolve, reject) =>
        {
            if (existsSync(options.name))
            {
                resolve();
            }
            else if (Date.now() - start > options.timeout)
            {
                reject(new WpwError({
                    code: WpwError.Code.ERROR_GENERAL,
                    message: `wait operation timed out at ${options.timeout} ms`
                }));
            }
            else {
                setTimeout(_poll, options.interval, resolve, reject);
            }
        };
        return new Promise(_poll);
    }


    /**
     * @function
     * @param {typedefs.WpwPluginWaitOptions} options
     */
    register(options)
    {
        pushUniq(this.waiting, options.source);
        this.registered.push(merge({}, options));
    }

}


module.exports = WpwPluginWaitManager;
