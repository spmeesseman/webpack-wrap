// @ts-check

const { apply } = require("../utils");

/**
 * @file exports/optimization.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */
/** @typedef {import("../../types").WebpackOptimization} WebpackOptimization */
/** @typedef {import("../../types").WpBuildWebpackConfig} WpBuildWebpackConfig */


/**
 * @function optimization
 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
 */
const optimization = (app) =>
{
	if (app.build.exports.optimization)
	{
		apply(app.wpc, { parallelism: 1 + app.rc.builds.length });
		if (app.isMain)
		{
			app.wpc.optimization =
			{
				runtimeChunk: "single",
				splitChunks: false
			};
			if (app.build.target !== "web"|| app.build.type === "webmodule")
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
