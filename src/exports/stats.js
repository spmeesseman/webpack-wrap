// @ts-check

const typedefs = require("../types/typedefs");
const { isString, apply } = require("../utils");

/**
 * @file exports/stats.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */


/**
 * @param {import("../types").WpwLoggerLevel | import("../types").WebpackLogLevel | undefined} loglevel
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
 * @param {typedefs.WpwBuild} build The current build's rc wrapper @see {@link WpwBuild}
 */
const stats = (build) =>
{
	const logLevel = build.logger.level || build.cmdLine.loglevel || build.log.level || 0;
	if (logLevel !== 0 && logLevel !== "none") // && build.exports.stats)
	{
		apply(build.wpc.stats, {
			preset: "errors-warnings",
			assets: true,
			colors: true,
			env: true,
			errorsCount: true,
			warningsCount: true,
			timings: true
			// warningsFilter: /Cannot find module \'common\' or its corresponding type declarations/
		});

		apply(build.wpc.infrastructureLogging, {
			colors: true,
			level: level(logLevel)
		});

		if (logLevel === 5) {
			apply(build.wpc.infrastructureLogging, { debug: true });
		}
	}
};


module.exports = stats;
