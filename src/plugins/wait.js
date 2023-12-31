/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file src/plugins/wait.js
 * @version 0.0.1
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const WpwPlugin = require("./base");
const { existsSync } = require("fs");
const { EventEmitter } = require("events");
const typedefs = require("../types/typedefs");
const { pushUniq } = require("@spmeesseman/type-utils");


/**
 * @extends WpwPlugin
 */
class WpwWaitPlugin extends WpwPlugin
{
    /**
     * @static
     * @type {EventEmitter}
     */
    static onPluginEvent = new EventEmitter();;
	/**
     * @static
	 * @private
     * @type {string[]}
     */
    static donePlugins = [];;


    /**
     * @param {typedefs.WpwPluginOptions} options Plugin options to be applied
     */
	constructor(options)
	{
		super(options);
        this.buildOptions = /** @type {typedefs.WpwBuildOptionsConfig<"wait">} */(this.buildOptions);
	}


	/**
     * @override
     */
	static create = WpwWaitPlugin.wrap.bind(this);


    /**
     * @private
     */
    done()
    {
        pushUniq(WpwWaitPlugin.donePlugins, this.build.name);
        if (!this.build.hasError)
        {
            const event = `${this.build.name}_done`;
            this.logger.write(`emit event '${event}' from build '${this.build.name}'`, 3);
            WpwWaitPlugin.onPluginEvent.emit(event, "done");
            if (this.build.type !== this.build.name) {
                WpwWaitPlugin.onPluginEvent.emit(`${this.build.type}_done`, "done");
            }
        }
    }


    /**
     * @override
     * @returns {typedefs.WpwPluginTapOptions}
     */
    onApply()
    {
        /** @type {typedefs.WpwPluginTapOptions} */
		const cfg =  {
            emitWaitAfterDone: {
                hook: "afterDone",
                callback: this.done.bind(this)
            }
        };
        if (this.buildOptions.items && this.buildOptions.items.length > 0)
        {
            cfg.registerWaitBeforeRun = {
                async: true,
                hook: "beforeRun",
                callback: this.start.bind(this)
            };
        }
        return cfg;
    }


    /**
     * @private
     * @param {typedefs.IWpwPluginConfigWaitItem} waitConfig
     * @returns {Promise<void>}
     */
    pollFile(waitConfig)
    {
        const _poll = (/** @type {any} */ resolve) =>
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
     * @returns {Promise<void>}
     */
    start()
    {
        if (!this.build.isOnlyBuild)
        {
            const waitItem = this.buildOptions.items?.find(i => !!this.build.getBuild(i.name));
            if (waitItem && !WpwWaitPlugin.donePlugins.includes(waitItem.name))
            {
                let timeoutId;
                waitItem.source = this.build.name;
                this.logger.write(`start wait period for '${waitItem.name}'`, 2);

                const _done = (resolve) => { pushUniq(WpwWaitPlugin.donePlugins, waitItem.name); clearTimeout(timeoutId); resolve(); };
                const _timeout = (/** @type {any} */ resolve) =>
                {
                    timeoutId = setTimeout((resolve) =>
                    {
                        this.logger.write(`resume waiting build '${waitItem.source}'`, 2);
                        this.logger.write(`   timeout occurred, wait event on '${waitItem.name} not triggered`, 2);
                        resolve();
                    }, waitItem.timeout || 30000, resolve);
                };

                return Promise.race(
                [
                    new Promise(_timeout),
                    /** @type {Promise<void>} */(new Promise((resolve) =>
                    {
                        if (waitItem.mode === "event")
                        {
                            WpwWaitPlugin.onPluginEvent.on(`${waitItem.name}_done`, () =>
                            {
                                this.logger.write(`   received event 'done' from '${waitItem.name}', resume waiting build '${waitItem.source}'`, 2);
                                _done(resolve);
                            });
                        }
                        else
                        {   this.pollFile(waitItem).then(() =>
                            {
                                this.logger.write(`file '${waitItem.name}' exists, resume waiting build '${waitItem.source}'`, 2);
                                _done(resolve);
                            });
                        }
                    }))
                ]);
            }
        }
        return Promise.resolve();
    }

}


module.exports = WpwWaitPlugin.create;
