/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

const typedefs = require("../../types/typedefs");
const { isObject } = require("@spmeesseman/type-utils");

/**
 * @file src/plugins/analyze/analyzer.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;


/**
 * @param {typedefs.WpwBuild} build
 * @returns {BundleAnalyzerPlugin | undefined}
 */
const analyzer = (build) =>
{
    let plugin;
    const buildOptions = build.options.analyze;
    if (build.cmdLine.analyze || (buildOptions && buildOptions.analyzer && (buildOptions.analyzer === true || buildOptions.analyzer.enabled === true)))
	{
        const buildOptionsAnalyzer = buildOptions?.analyzer;
		plugin = new BundleAnalyzerPlugin({
			analyzerPort: "auto",
			analyzerMode: "static",
			generateStatsFile: true,
			statsFilename: "../.coverage/analyzer-stats.json",
			reportFilename: "../.coverage/analyzer.html",
			openAnalyzer: isObject(buildOptionsAnalyzer) ? !!buildOptionsAnalyzer.open : true
			// logLevel?: 'info' | 'warn' | 'error' | 'silent' | undefined;
		});
	}
	return plugin;
};


module.exports = analyzer;
