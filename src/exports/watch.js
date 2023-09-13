/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/**
 * @file exports/watch.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

 const WpwBuild = require("../core/build");


/**
 * @function target
 * @param {WpwBuild} build The current build's rc wrapper @see {@link WpwBuild}
 */
const watch = (build) =>
{
	build.wpc.watch = !!build.cmdLine.watch || !!build.cmdLine.WEBPACK_WATCH;
	if (build.cmdLine.watch && build.options.watch)
	{
		build.wpc.watchOptions =
		{
			poll: true,
			stdin: true,
			followSymlinks: false,
			ignored: [
				"**/node_modules", "**/dist", "**/doc", "**/res", "**/script", "**/test",
				"**/types", "**/webpack/**/*.js", "**/.vscode", "**/.vscode-test",
				"**/.nyc_output", "**/.coverage", "**/.github"
			]
		};
	}
};


module.exports = watch;
