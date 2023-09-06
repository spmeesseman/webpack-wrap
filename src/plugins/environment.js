/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/environment.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const WpwPlugin = require("./base");
const WpBuildApp = require("../core/app");

/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WebpackStatsAsset} WebpackStatsAsset */
/** @typedef {import("../types").WpwPluginOptions} WpwPluginOptions */


/**
 * @extends WpwPlugin
 */
class WpBuildEnvironmentPlugin extends WpwPlugin
{
    /**
     * Called by webpack runtime to initialize this plugin
     * @override
     * @param {WebpackCompiler} compiler the compiler instance
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
	 * @private
	 */
	environment = () =>
	{
		this.setVersion();
	};


	/**
	 * @private
	 */
	setVersion = () =>
	{
		if (this.app.build.type === "module" && this.app.build.mode === "production")
		{
			// let version = app.pkgJson.version;
		}
	};

}


/**
 * @param {WpBuildApp} app
 * @returns {WpBuildEnvironmentPlugin | undefined}
 */
const environment = (app) => app.build.mode === "production" ? new WpBuildEnvironmentPlugin({ app }) : undefined;


module.exports = environment;
