// @ts-check

const typedefs = require("../types/typedefs");
const { isString, apply } = require("../utils");

/**
 * @file src/exports/stats.js
 * @version 0.0.1
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */


/**
 * @param {typedefs.WpwLoggerLevel | typedefs.WebpackLogLevel | undefined} loglevel
 * @returns {typedefs.WebpackLogLevel}
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
 * @param {typedefs.WpwBuild} build The current build's rc wrapper @see {@link WpwBuild}
 */
const stats = (build) =>
{

	apply(build.wpc.infrastructureLogging, {
		colors: true,
		console: build.logger
	});

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

		apply(build.wpc.infrastructureLogging, { level: level(logLevel) });
		if (logLevel === 5) {
			apply(build.wpc.infrastructureLogging, { debug: true });
		}
	}
};


module.exports = stats;
