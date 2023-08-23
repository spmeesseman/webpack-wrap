/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/analyze.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

/** @typedef {import("../../types/typedefs").WpBuildApp} WpBuildApp */
/** @typedef {import("../../types/typedefs").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @param {WpBuildApp} app
 * @returns {BundleAnalyzerPlugin | undefined}
 */
const analyzer = (app) =>
{
    let plugin;
	if (app.rc.args.analyze)
	{
		plugin = new BundleAnalyzerPlugin({
			analyzerPort: "auto",
			analyzerMode: "static",
			generateStatsFile: true,
			statsFilename: "../.coverage/analyzer-stats.json",
			reportFilename: "../.coverage/analyzer.html",
			openAnalyzer: true
		});
	}
	return plugin;
};


module.exports = analyzer;
