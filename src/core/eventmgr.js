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


    /**
     * @private
     * @param {typedefs.IWpwPluginConfigWaitItem} waitConfig
     * @returns {Promise<void>}
     */
    pollFile(waitConfig)
    {
        const _poll = (/** @type {() => void} */ resolve) =>
        {
            if (existsSync(waitConfig.name))
            {
                resolve();
            }
            else {
                setTimeout(_poll, waitConfig.interval, resolve);
            }
        };
        return new Promise(_poll);
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
                waitItem.source = build.name;
                this.logger.write(`start wait period for '${waitItem.name}'`, 2);
                return Promise.race(
                [
                    /** @type {Promise<void>} */(new Promise((resolve) =>
                    {
                        if (waitItem.mode === "event")
                        {
                            this.onPluginEvent.on(`${waitItem.name}_done`, () =>
                            {
                                this.logger.write(`resume waiting build '${waitItem.source}'`, 2);
                                this.logger.write(`   received event 'done' from '${waitItem.name}'`, 2);
                                resolve();
                            });
                        }
                        else {
                            this.pollFile(waitItem).then(() =>
                            {
                                this.logger.write(`resume waiting build '${waitItem.source}'`, 2);
                                this.logger.write(`   file '${waitItem.name}' exists`, 2);
                                resolve();
                            });
                        }
                    })),
                    /** @type {Promise<void>} */(new Promise(resolve => setTimeout(() =>
                    {
                        this.logger.write(`resume waiting build '${waitItem.source}'`, 2);
                        this.logger.write(`   timeout occurred, wait event on '${waitItem.name} not triggered`, 2);
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
