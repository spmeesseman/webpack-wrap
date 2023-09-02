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
const { WpBuildError, merge, isPromise, pushIfNotExists } = require("../utils");


class WpwPluginWaitManager
{
    /** @type {typedefs.WpwBuildOptionsPluginsKey[]} @private */
    done;
    /** @type {typedefs.WpwBuildOptionsPluginsKey[]} @private */
    waiting;
    /** @type {EventEmitter} @private */
    onPluginEvent;
    /** @type {typedefs.WpBuildPluginWaitOptions[]} @private */
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
        pushIfNotExists(this.done, name);
        // this.waiting.splice(this.waiting.indexOf(), 1);
        this.onPluginEvent.emit(`${name}_done`, ...args);
        for (const r of this.registered.filter(r => name === r.target))
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
     * @param {Required<typedefs.WpBuildPluginWaitOptions>} options
     * @returns {Promise<void>}
     */
    pollFile(options)
    {
        const start = Date.now();
        /** @param {(value: void | PromiseLike<void>) => void} resolve @param {any} reject */
        const _poll = (resolve, reject) =>
        {
            if (existsSync(options.target))
            {
                resolve();
            }
            else if (Date.now() - start > options.timeout)
            {
                reject(new WpBuildError(`Wait operation times out at ${options.timeout} ms`, "plugin/wait.js"));
            }
            else {
                setTimeout(_poll, options.interval, resolve, reject);
            }
        };
        return new Promise((resolve, reject) => _poll(resolve, reject));
    }


    /**
     * @function
     * @param {typedefs.WpBuildPluginWaitOptions} options
     */
    register(options)
    {
        pushIfNotExists(this.waiting, options.source);
        this.registered.push(merge({}, options));
    }

}


module.exports = WpwPluginWaitManager;
