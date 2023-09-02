/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/analyze.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const VisualizerPlugin = require("webpack-visualizer-plugin2");

/** @typedef {import("../../types/typedefs").WpBuildApp} WpBuildApp */
/** @typedef {import("../../types/typedefs").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @param {WpBuildApp} app
 * @returns {VisualizerPlugin| undefined}
 */
const visualizer = (app) =>
{
	let plugin;
	if (app.cmdLine.analyze && app.build.options.analyze) {
		plugin = new VisualizerPlugin({ filename: "../.coverage/visualizer.html" });
	}
	// @ts-ignore
	return plugin;
};


module.exports = visualizer;
