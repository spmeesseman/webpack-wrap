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
const WpwBuild = require("../core/build");

/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WebpackStatsAsset} WebpackStatsAsset */
/** @typedef {import("../types").WpwPluginOptions} WpwPluginOptions */


/**
 * @extends WpwPlugin
 */
class WpwEnvironmentPlugin extends WpwPlugin
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
		if (this.build.type === "app" && this.build.mode === "production")
		{
			// let version = build.pkgJson.version;
		}
	};

}


/**
 * @param {WpwBuild} build
 * @returns {WpwEnvironmentPlugin | undefined}
 */
const environment = (build) => build.mode === "production" ? new WpwEnvironmentPlugin({ build }) : undefined;


module.exports = environment;
