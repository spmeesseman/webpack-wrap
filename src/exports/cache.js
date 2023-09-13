// @ts-check

/**
 * @file exports/cache.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const { join } = require("path");
const { apply } = require("../utils");
const WpwBuild = require("../core/build");

/** @typedef {import("../types").WebpackFileCacheOptions} WebpackFileCacheOptions */


/**
 * @function
 * @param {WpwBuild} build The current build's rc wrapper @see {@link WpwBuild}
 */
const cache = (build) =>
{
	if (build.options.cache)
	{
        const basePath = build.getBasePath();
		apply(build.wpc.cache, {
            type: "filesystem",
            cacheDirectory: join(build.global.cacheDir, "webpack"),
            name: `${build.name}_${build.mode}_${build.wpc.target}`.toLowerCase(),
            version: build.pkgJson.version, // `${process.env.GIT_REV}`
            buildDependencies:
            {
                defaultWebpack: [ "webpack/lib/" ],
                config: [
                    join(basePath, "webpack.config.js")
                ]
            }
        });
    }
    else {
        apply(build.wpc.cache, {
            type: "memory",
            maxGenerations: Infinity,
            cacheUnaffected: true
        });
    }
};


module.exports = cache;
