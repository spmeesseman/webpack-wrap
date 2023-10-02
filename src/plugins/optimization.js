/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file src/plugins/optimization.js
 * @version 0.0.1
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const typedefs = require("../types/typedefs");
const { requireResolve } = require("../utils");
/** @type {typedefs.WebpackType} */
const webpack = requireResolve("webpack");


/**
 * @param {typedefs.WpwBuild} build
 * @returns {typedefs.WebpackPluginInstance[]}
 */
const optimization = (build) =>
{
	const plugins = [];
	if (build.target === "web")
	{
		plugins.push(new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }));
	}
	if (build.type !== "webapp")
	{
		plugins.push(new webpack.NoEmitOnErrorsPlugin());
	}
	return plugins;
};


module.exports = optimization;
