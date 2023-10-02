// @ts-check

/**
 * @file src/exports/experiments.js
 * @version 0.0.1
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const typedefs = require("../types/typedefs");


/**
 * @param {typedefs.WpwBuild} build The current build's rc wrapper @see {@link WpwBuild}
 */
const experiments = (build) =>
{
	if (build.options.experiments)
	{
		build.wpc.experiments = { layers: build.type === "app"};
	}
};


module.exports = experiments;
