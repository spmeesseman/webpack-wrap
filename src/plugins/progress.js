/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file src/plugins/progress.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const typedefs = require("../types/typedefs");
const { requireResolve } = require("../utils");
// const { ProgressPlugin } = require("webpack"); */
const { ProgressPlugin } = /** @type {typedefs.WebpackType} */(requireResolve("webpack"));

/** @typedef {import("webpack").ProgressPlugin} ProgressPlugin */


/**
 * @param {typedefs.WpwBuild} build
 * @returns {ProgressPlugin | undefined}
 */
const progress = (build) =>
{
	if (build.options.progress)
	{
		return new ProgressPlugin();
	}
};


module.exports = progress;
