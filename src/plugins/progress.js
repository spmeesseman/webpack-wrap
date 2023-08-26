/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/progress.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const { requireResolve } = require("../utils");
/*  // const webpack = require("webpack"); */
/** @typedef {import("../types/typedefs").WebpackType} WebpackType */
const webpack = /** @type {WebpackType} */(requireResolve("webpack"));

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */
/** @typedef {import("webpack").ProgressPlugin} ProgressPlugin */


/**
 * @param {WpBuildApp} app
 * @returns {ProgressPlugin | undefined}
 */
const progress = (app) =>
{
	if (app.build.options.progress)
	{
		return new webpack.ProgressPlugin();
	}
};


module.exports = progress;
