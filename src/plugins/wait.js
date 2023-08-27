/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/wait.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const { existsSync } = require("fs");
const WpBuildPlugin = require("./base");
const { apply, WpBuildError } = require("../utils");

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */
/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("./base").WpBuildPluginOptions} WpBuildPluginOptions */


class WpBuildWaitPlugin extends WpBuildPlugin
{
    /**
     * @private
     */
    waitFor;
    /**
     * @private
     */
    interval;
    /**
     * @private
     */
    timeout;


    /**
     * @class WpBuildWaitPlugin
     * @param {WpBuildPluginOptions} options Plugin options to be applied
     */
	constructor(options)
    {
        super(options);
        this.waitFor = options.waitFor;
        this.interval = options.interval || 150;
        this.timeout =options.timeout ||  1500;
        WpBuildPlugin.onPluginEvent.on("done", this.onWaitDone);
    }


    /**
     * Called by webpack runtime to initialize this plugin
     * @function
     * @override
     * @param {WebpackCompiler} compiler the compiler instance
     */
    apply(compiler)
    {
		this.onApply(compiler,
        {
            waitForFileExists: {
                async: true,
                hook: "run",
                callback: this.poll.bind(this)
            }
        });
    }


    onWaitDone(pluginName)
    {
        if (pluginName === this.waitFor)
        {
        }
    };


    /**
     * @function
     * @private
     * @param {WebpackCompiler} _compiler
     * @returns {Promise<void>}
     */
    poll(_compiler)
    {
        const start = Date.now();
        /** @param {(value: void | PromiseLike<void>) => void} resolve @param {any} reject */
        const _poll = (resolve, reject) =>
        {
            if (existsSync(this.file))
            {
                resolve();
            }
            else if (Date.now() - start > this.timeout)
            {
                reject(new WpBuildError(`Wait operation times out at ${this.timeout} ms`, "plugin/wait.js"));
            }
            else {
                setTimeout(_poll, this.interval, resolve, reject);
            }
        };
        return new Promise((resolve, reject) => _poll(resolve, reject));
    }
}


/**
 * @function
 * @param {WpBuildApp} app
 * @param {string} waitFor
 * @returns {WpBuildWaitPlugin | undefined}
 */
const wait = (app, waitFor) => app.build.options.wait ? new WpBuildWaitPlugin({ app, waitFor }) : undefined;


module.exports = wait;
