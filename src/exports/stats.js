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
		apply(build.wpc.infrastructureLogging, { level: level(logLevel) });

		if (logLevel < 5)
		{
			apply(build.wpc.stats, {
				// preset: logLevel < 3 ? "errors-warnings" : "error-details",
				assets: true,
				builtAt: logLevel >= 4,
				chunkModules: logLevel >= 4,
				colors: true,
				entrypoints: logLevel >= 4,
				env: true,
				errors: true,
				errorsCount: true,
				errorDetails: logLevel >= 3,
				hash: logLevel >= 4,
				modules: logLevel >= 4,
				orphanModules: logLevel >= 2,
				outputPath: logLevel >= 3,
				performance: logLevel >= 3,
				relatedAssets: logLevel >= 2,
				runtimeModules: logLevel >= 4,
				timings: true,
				usedExports: logLevel >= 3,
				warnings: true,
				warningsCount: true
			});

			if (build.options.cache && build.options.cache.enabled !== false)
			{
				apply(build.wpc.stats, { cachedAssets: logLevel >= 3, cachedModules: logLevel >= 2 });
			}
		}
		else {
			apply(build.wpc.stats, { all: true });
			apply(build.wpc.infrastructureLogging, { debug: true });
		}
	}

	if (build.options.ignore?.warnings)
	{
		build.wpc.ignoreWarnings = [
			/Critical dependency\: the request of a dependency is an expression/,
			/Critical dependency\: require function is used in a way in which dependencies cannot be statically extracted/
		];
		// /Cannot find module \'[a-z\-]+\' or its corresponding type declarations/
		//
		// stats.warningsFilter is deprecated in Wp5 in favor of wpc.ignoreWarnings, leaving for reference:
		//
		// build.wpc.stats.warningsFilter = [
		// 	/Critical dependency\: the request of a dependency is an expression/,
		// 	/Critical dependency\: require function is used in a way in which dependencies cannot be statically extracted/
		// ;
	}
};


module.exports = stats;
