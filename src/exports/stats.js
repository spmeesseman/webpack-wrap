// @ts-check

const { isString } = require("../utils");

/**
 * @file exports/stats.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */


/**
 * @param {import("../../types").WpBuildLogLevel | import("../../types").WebpackLogLevel | undefined} loglevel
 * @returns {import("../../types").WebpackLogLevel}
 */
const level = (loglevel) =>
{
	if (isString(loglevel))
	{
		return loglevel;
	}
	else if (loglevel === 1)
	{
		return "error";
	}
	else if (loglevel === 2)
	{
		return "warn";
	}
	else if (loglevel === 3)
	{
		return "info";
	}
	else if (loglevel === 4)
	{
		return "log";
	}
	else if (loglevel === 5)
	{
		return "verbose";
	}
	return "none";
};


/**
 * @function stats
 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
 */
const stats = (app) =>
{
	if (app.args.loglevel !== 0 && app.args.loglevel !== "none" && app.build.exports.stats)
	{
		app.wpc.stats = {
			preset: "errors-warnings",
			assets: true,
			colors: true,
			env: true,
			errorsCount: true,
			warningsCount: true,
			timings: true
			// warningsFilter: /Cannot find module \'common\' or its corresponding type declarations/
		};

		app.wpc.infrastructureLogging = {
			colors: true,
			level: level(app.args.loglevel)
			// debug: /webpack\.cache/
		};
	}
};


module.exports = stats;
