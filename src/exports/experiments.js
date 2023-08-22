// @ts-check

/**
 * @file exports/experimental.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */


/**
 * @function entry
 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
 */
const experiments = (app) =>
{
	if (app.build.exports.experiments)
	{
		app.wpc.experiments = { layers: app.isMain };
	}
};


module.exports = experiments;
