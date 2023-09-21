/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file src/plugins/analyze/visualizer.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const VisualizerPlugin = require("webpack-visualizer-plugin2");

/** @typedef {import("../../types/typedefs").WpwBuild} WpwBuild */
/** @typedef {import("../../types/typedefs").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @param {WpwBuild} build
 * @returns {WebpackPluginInstance | undefined}
 */
const visualizer = (build) =>
{
	let plugin;
    const buildOptions = build.options.analyze;
    if (build.cmdLine.analyze || (buildOptions && buildOptions.visualizer === true))
	{
		plugin = new VisualizerPlugin({ filename: "../.coverage/visualizer.html" });
	}
	// @ts-ignore
	return plugin;
};


module.exports = visualizer;
