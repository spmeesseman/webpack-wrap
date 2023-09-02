// @ts-check

/**
 * @file exports/watch.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */


/**
 * @function target
 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
 */
const watch = (app) =>
{
	app.wpc.watch = !!app.cmdLine.watch || !!app.cmdLine.WEBPACK_WATCH;
	if (app.cmdLine.watch && app.build.options.watch)
	{
		app.wpc.watchOptions =
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
