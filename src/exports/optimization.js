// @ts-check

const { apply } = require("../utils");
const WpwBuild = require("../core/build");

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
 * @param {WpwBuild} build The current build's rc wrapper @see {@link WpwBuild}
 */
const optimization = (build) =>
{
	if (build.options.optimization)
	{
		apply(build.wpc, { parallelism: 1 + build.buildCount });
		if (build.type === "app")
		{
			build.wpc.optimization =
			{
				runtimeChunk: "single",
				splitChunks: false
			};
			if (build.target !== "web"|| build.type === "app")
			{
				build.wpc.optimization.splitChunks =
				{
					cacheGroups: {
						vendor: {
							test: /node_modules/,
							name: "vendor",
							chunks: "all"
						}
					}
				};
				if (build.mode === "production")
				{
					build.wpc.optimization.chunkIds = "deterministic";
				}
			}
		}
	}
};



module.exports = optimization;
