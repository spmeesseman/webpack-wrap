// @ts-check

/**
 * @file exports/experimental.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 */

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */


/**
 * @function entry
 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
 */
const experiments = (app) =>
{
	if (app.build.options.experiments)
	{
		app.wpc.experiments = { layers: app.isMain };
	}
};


module.exports = experiments;
