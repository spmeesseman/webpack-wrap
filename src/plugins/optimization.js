/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/optimization.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const { requireResolve } = require("../utils");
/*  // const webpack = require("webpack"); */
/** @typedef {import("../types/typedefs").WebpackType} WebpackType */
const webpack = /** @type {WebpackType} */(requireResolve("webpack"));

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */
/** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
 * @returns {WebpackPluginInstance[]}
 */
const optimization = (app) =>
{
	const plugins = [];
	if (app.build.options.optimization)
	{
		if (app.build.target === "web")
		{
			plugins.push(new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }));
		}
		if (app.build.type !== "webapp")
		{
			plugins.push(new webpack.NoEmitOnErrorsPlugin());
		}
	}
	return plugins;
};


module.exports = optimization;
