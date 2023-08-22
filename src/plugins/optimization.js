/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/optimization.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const webpack = require("webpack");

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */
/** @typedef {import("../../types").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @function optimization
 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
 * @returns {WebpackPluginInstance[]}
 */
const optimization = (app) =>
{
	const plugins = [];
	if (app.build.plugins.optimization)
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
