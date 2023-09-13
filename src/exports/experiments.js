// @ts-check

/**
 * @file exports/experimental.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

 const WpwBuild = require("../core/build");


/**
 * @function entry
 * @param {WpwBuild} build The current build's rc wrapper @see {@link WpwBuild}
 */
const experiments = (build) =>
{
	if (build.options.experiments)
	{
		build.wpc.experiments = { layers: build.type === "app"};
	}
};


module.exports = experiments;
