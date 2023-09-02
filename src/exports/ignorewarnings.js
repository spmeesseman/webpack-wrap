// @ts-check

/**
 * @file exports/ignorewarnings.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *
 * @description
 *
 * @see {@link https://webpack.js.org/configuration/other-options/#ignorewarnings webpack.js.org/ignorewarnings}
 *
 */

const WpBuildApp = require("../core/app");


/**
 * @see {@link https://webpack.js.org/configuration/other-options/#ignorewarnings webpack.js.org/ignorewarnings}
 *
 * @function ignorewarnings
 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
 */
const ignorewarnings = (app) =>
{
   if (app.build.options.ignorewarnings && (!app.cmdLine.verbosity || app.cmdLine.verbosity !== "none"))
   {
		app.wpc.ignoreWarnings = [
			/Critical dependency\: the request of a dependency is an expression/,
			/Critical dependency\: require function is used in a way in which dependencies cannot be statically extracted/
			// {
			// 	module: /module2\.js\?[34]/, // A RegExp
			// }
		];
	}
};


module.exports = ignorewarnings;
