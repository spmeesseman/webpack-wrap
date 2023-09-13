// @ts-check

const WpwBase = require("../core/base");

/**
 * @file exports/devtool.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

 const WpwBuild = require("../core/build");

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
 * @param {WpwBuild} build The current build's rc wrapper @see {@link WpwBuild}
 */
const devtool = (build) =>
{   //
	// Disabled for this build - Using source-map-plugin - see webpack.plugin.js#sourcemaps
	// ann the plugins() function below
	//
	if (build.options.devtool?.enabled)
	{
		if (build.options.sourcemaps?.enabled)
		{
			build.wpc.devtool = false;
		}
		else
		{
			if (build.mode === "production") {
				build.wpc.devtool = "source-map";
			}
			else if (build.mode === "development") {
				build.wpc.devtool = "eval-source-map";
			}
			else {
				build.wpc.devtool = "eval";
			}
		}
	}
};


module.exports = devtool;
