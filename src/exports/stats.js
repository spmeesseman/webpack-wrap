// @ts-check

const { isString } = require("../utils");

/**
 * @file exports/stats.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */


/**
 * @param {import("../types").WpBuildLogLevel | import("../types").WebpackLogLevel | undefined} loglevel
 * @returns {import("../types").WebpackLogLevel}
 */
const level = (loglevel) =>
{
	if (isString(loglevel))
	{
		return loglevel;
	}
	else if (loglevel === 1)
	{
		return "warn";
	}
	else if (loglevel === 2)
	{
		return "info";
	}
	else if (loglevel === 3)
	{
		return "log";
	}
	else if (loglevel === 4 || loglevel === 5)
	{
		return "verbose";
	}
	return "error";
};


/**
 * @function stats
 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
 */
const stats = (app) =>
{
	const logLevel = app.logger.level || app.cmdLine.loglevel || app.build.log.level || 0;
	if (logLevel !== 0 && logLevel !== "none") // && app.build.exports.stats)
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
			level: level(logLevel)
			// debug: /webpack\.cache/
		};
	}
};


module.exports = stats;
