/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file src/plugins/progress.js
 * @version 0.0.1
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const typedefs = require("../types/typedefs");
const { requireResolve } = require("../utils");
const webpack = /** @type {typedefs.WebpackType} */(requireResolve("webpack"));


/**
 * @param {typedefs.WpwBuild} build
 * @returns {typedefs.WebpackProgressPlugin | undefined}
 */
const progress = (build) =>
{
	if (build.options.progress)
	{
		return new webpack.ProgressPlugin();
	}
};


module.exports = progress;
