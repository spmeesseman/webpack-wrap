/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file src/core/eventmgr.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const { existsSync } = require("fs");
const { EventEmitter } = require("events");
const typedefs = require("../types/typedefs");
const { WpwError } = require("../utils/message");
const { pushUniq, merge, isPromise, clone } = require("@spmeesseman/type-utils");
const WpwLogger = require("../utils/console");


/**
 * @class WpwLoggerHookStagesPlugin
 * @implements {typedefs.IDisposable}
 */
class WpwEventManager
{
	/**
	 * @private
     * @type {string[]}
     */
    done;
    /**
	 * @private
     * @type {typedefs.WpwBuildOptionsKey[]}
     */
    waiting;
    /**
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
		this.logger = new WpwLogger({ envTag1: "wpw", envTag2: "eventmgr" });
    }


	dispose = () => { this.logger.dispose(); };


    /**
     * @param {string} event
     * @param {string} name
     * @param {typedefs.WpwPluginHookWaitStage | undefined} result
     */
    emit(event, name, result)
	{
        const handlerResult = result || event.split("_")[1];
		this.logger.write(`received hook handler result '${handlerResult}' from '${name}'`, 3);
		this.logger.write(`   emit event '${event}'`, 3);
		this.onPluginEvent.emit(event, result);
		if (result === "done") {
			// this.onPluginDone(name, result);
		}
	}


    /**
     * @param {string} name
     * @param {...any} args
     * @returns {Promise<any> | any}
     */
    onPluginDone(name, ...args)
    {
		let result;
        pushUniq(this.done, name);
        if (this.registered.length > 0)
        {
            this.logger.write(`   plugin '${name}' done, evaluate ${this.registered.length} waiting modules`, 3);
            for (const r of this.registered.filter(r => name === r.name))
            {
                this.logger.write(`      notify waiting module ${r.source}`, 3);
                const res = r.callback(...args);
                if (isPromise(res)) {
                    result = res.then(r => r);
                }
                else { result = res;}
            }
            this.registered.slice().reverse().forEach((p, i, a) => { if (!p) { this.registered.splice(a.length - 1 - i, 1); }});
            this.logger.write("   module wait evaluatiuon complete", 3);
        }
		return result;
    }


    // /**
    //  * @private
    //  * @param {Required<typedefs.WpwPluginWaitOptions>} options
    //  * @returns {Promise<void>}
    //  */
    // pollFile(options)
    // {
    //     const start = Date.now();
    //     /**
    //      * @param {any} resolve
    //      * @param {any} reject
    //      */
    //     const _poll = (resolve, reject) =>
    //     {
    //         if (existsSync(options.name))
    //         {
    //             resolve();
    //         }
    //         else if (Date.now() - start > options.timeout)
    //         {
    //             reject(new WpwError({
    //                 code: WpwError.Code.ERROR_GENERAL,
    //                 message: `wait operation timed out at ${options.timeout} ms`
    //             }));
    //         }
    //         else {
    //             setTimeout(_poll, options.interval, resolve, reject);
    //         }
    //     };
    //     return new Promise(_poll);
    // }


    /**
     * @param {typedefs.WpwPluginWaitOptions} options
     */
    register(options)
    {
        pushUniq(this.waiting, options.source);
        this.registered.push(clone(options));
		if (this.done.includes(options.name)) {
			this.onPluginDone(options.name);
		}
    }


    /**
     * @param {typedefs.WpwBuild} build
     * @returns {Promise<void>}
     */
    wait(build)
    {
        if (!build.isOnlyBuild)
        {
            const waitConfig = build.options.wait,
                  waitItem = waitConfig?.items?.find(i => !!build.getBuild(i.name));
            if (waitItem)
            {
                return Promise.race(
                [
                    /** @type {Promise<void>} */(new Promise((resolve) =>
                    {
                        this.onPluginEvent.on(`${waitItem.source}_done`, () =>
                        {
                            this.logger.write(`received event 'done' from '${waitItem.source}'`, 3);
                            this.logger.write(`   resume waiting build '${waitItem.name}'`, 3);
                            resolve();
                        });
                    })),
                    /** @type {Promise<void>} */(new Promise(resolve => setTimeout(() =>
                    {
                        resolve();
                    },
                    waitItem.timeout || 30000)))
                ]);
            }
        }
        return Promise.resolve();
    }

}


module.exports = WpwEventManager;
