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
const WpBuildApp = require("../core/app");

/** @typedef {import("../types").WebpackFileCacheOptions} WebpackFileCacheOptions */


/**
 * @function
 * @param {WpBuildApp} app The current build's rc wrapper @see {@link WpBuildApp}
 */
const cache = (app) =>
{
	if (app.build.options.cache)
	{
        const basePath = app.getBasePath();
		apply(app.wpc.cache, {
            type: "filesystem",
            cacheDirectory: join(app.global.cacheDir, "webpack"),
            name: `${app.build.name}_${app.build.mode}_${app.wpc.target}`.toLowerCase(),
            version: app.pkgJson.version, // `${process.env.GIT_REV}`
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
        apply(app.wpc.cache, {
            type: "memory",
            maxGenerations: Infinity,
            cacheUnaffected: true
        });
    }
};


module.exports = cache;
