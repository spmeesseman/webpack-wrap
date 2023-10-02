/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file src/plugins/analyze/visualizer.js
 * @version 0.0.1
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

 const typedefs = require("../../types/typedefs");
const VisualizerPlugin = require("webpack-visualizer-plugin2");


/**
 * @param {typedefs.WpwBuild} build
 * @returns {typedefs.WebpackPluginInstance | undefined}
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
