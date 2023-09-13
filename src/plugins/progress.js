/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/progress.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

 const WpwBuild = require("../core/build");
const { requireResolve } = require("../utils");
/*  // const webpack = require("webpack"); */
/** @typedef {import("../types/typedefs").WebpackType} WebpackType */
const webpack = /** @type {WebpackType} */(requireResolve("webpack"));

/** @typedef {import("webpack").ProgressPlugin} ProgressPlugin */


/**
 * @param {WpwBuild} build
 * @returns {ProgressPlugin | undefined}
 */
const progress = (build) =>
{
	if (build.options.progress)
	{
		return new webpack.ProgressPlugin();
	}
};


module.exports = progress;
