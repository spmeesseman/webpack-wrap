// @ts-check

/**
 * @file exports/experimental.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

 const WpBuildApp = require("../core/app");


/**
 * @function entry
 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
 */
const experiments = (app) =>
{
	if (app.build.options.experiments)
	{
		app.wpc.experiments = { layers: app.build.type === "module"};
	}
};


module.exports = experiments;
