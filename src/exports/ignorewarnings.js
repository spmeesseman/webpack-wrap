// @ts-check

/**
 * @file src/exports/ignorewarnings.js
 * @version 0.0.1
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *
 * @see {@link https://webpack.js.org/configuration/other-options/#ignorewarnings webpack.js.org/ignorewarnings}
 *
 */

const typedefs = require("../types/typedefs");


/**
 * @param {typedefs.WpwBuild} build @see {@link typedefs.WpwBuild WpwBuild}
 */
const ignorewarnings = (build) =>
{
   if (build.options.ignorewarnings?.enabled === true && !build.cmdLine.verbosity && build.logger.level <= 3)
   {
		build.wpc.ignoreWarnings = [
			/Critical dependency\: the request of a dependency is an expression/,
			/Critical dependency\: require function is used in a way in which dependencies cannot be statically extracted/
		];
	}
};


module.exports = ignorewarnings;
