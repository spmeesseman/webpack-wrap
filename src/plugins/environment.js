/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/environment.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const WpBuildPlugin = require("./base");

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */
/** @typedef {import("../../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../../types").WebpackStatsAsset} WebpackStatsAsset */
/** @typedef {import("../../types").WpBuildPluginOptions} WpBuildPluginOptions */


/**
 * @class WpBuildDisposePlugin
 */
class WpBuildEnvironmentPlugin extends WpBuildPlugin
{
    /**
     * @function Called by webpack runtime to initialize this plugin
     * @override
     * @member apply
     * @param {WebpackCompiler} compiler the compiler instance
     * @returns {void}
     */
    apply(compiler)
    {
        this.onApply(compiler,
        {
            finishEnvironmentInitialization: {
                hook: "environment",
                callback: this.environment.bind(this)
            }
        });
    }


	/**
	 * @function
	 * @private
	 * @member environment
	 */
	environment = () =>
	{
		this.setVersion();
	};


	/**
	 * @function
	 * @private
	 * @member setVersion
	 */
	setVersion = () =>
	{
		if (this.app.isMain && this.app.mode === "production")
		{
			// let version = app.rc.version;
		}
	};

}


/**
 * @param {WpBuildApp} app
 * @returns {WpBuildEnvironmentPlugin | undefined}
 */
const environment = (app) => app.mode === "production" ? new WpBuildEnvironmentPlugin({ app }) : undefined;


module.exports = environment;
