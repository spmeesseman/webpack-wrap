// @ts-check

const { apply } = require("../utils");
const WpBuildApp = require("../core/app");

/**
 * @file exports/optimization.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

/** @typedef {import("../types").WebpackOptimization} WebpackOptimization */
/** @typedef {import("../types").WpwWebpackConfig} WpwWebpackConfig */


/**
 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
 */
const optimization = (app) =>
{
	if (app.build.options.optimization)
	{
		apply(app.wpc, { parallelism: 1 + app.buildCount });
		if (app.isMain)
		{
			app.wpc.optimization =
			{
				runtimeChunk: "single",
				splitChunks: false
			};
			if (app.build.target !== "web"|| app.build.type === "module")
			{
				app.wpc.optimization.splitChunks =
				{
					cacheGroups: {
						vendor: {
							test: /node_modules/,
							name: "vendor",
							chunks: "all"
						}
					}
				};
				if (app.mode === "production")
				{
					app.wpc.optimization.chunkIds = "deterministic";
				}
			}
		}
	}
};



module.exports = optimization;
