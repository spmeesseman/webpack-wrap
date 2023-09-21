/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/optimization.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const typedefs = require("../types/typedefs");
const { requireResolve } = require("../utils");
/*  // const webpack = require("webpack"); */
/** @typedef {import("../types/typedefs").WebpackType} WebpackType */
const webpack = /** @type {WebpackType} */(requireResolve("webpack"));


/**
 * @param {typedefs.WpwBuild} build The current build's rc wrapper @see {@link WpwBuild}
 * @returns {typedefs.WebpackPluginInstance[]}
 */
const optimization = (build) =>
{
	const plugins = [];
	if (build.options.optimization)
	{
		if (build.target === "web")
		{
			plugins.push(new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }));
		}
		if (build.type !== "webapp")
		{
			plugins.push(new webpack.NoEmitOnErrorsPlugin());
		}
	}
	return plugins;
};


module.exports = optimization;
