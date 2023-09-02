// @ts-check

const { getOptionsConfig } = require("../core/base");

/**
 * @file exports/devtool.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */

/**
 * Adds library mode webpack config `output` object.
 *
 * Possible devTool values:
 *
 *     none:                        : Recommended for prod builds w/ max performance
 *     inline-source-map:           : Possible when publishing a single file
 *     cheap-source-map
 *     cheap-module-source-map
 *     eval:                        : Recommended for dev builds w/ max performance
 *     eval-source-map:             : Recommended for dev builds w/ high quality SourceMaps
 *     eval-cheap-module-source-map : Tradeoff for dev builds
 *     eval-cheap-source-map:       : Tradeoff for dev builds
 *     inline-cheap-source-map
 *     inline-cheap-module-source-map
 *     source-map:                  : Recommended for prod builds w/ high quality SourceMaps
 *
 * @private
 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
 */
const devtool = (app) =>
{   //
	// Disabled for this build - Using source-map-plugin - see webpack.plugin.js#sourcemaps
	// ann the plugins() function below
	//
	const devtoolOptions = getOptionsConfig("devtool", app.build.options);
	if (devtoolOptions.enabled)
	{
		const srcmapPluginOptions = getOptionsConfig("sourcemaps", app.build.options);
		if (srcmapPluginOptions.enabled)
		{
			app.wpc.devtool = false;
		}
		else
		{
			if (app.mode === "production") {
				app.wpc.devtool = "source-map";
			}
			else if (app.mode === "development") {
				app.wpc.devtool = "eval-source-map";
			}
			else if (app.isTest) {
				app.wpc.devtool = "eval";
			}
		}
	}
};


module.exports = devtool;
