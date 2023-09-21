// @ts-check

/**
 * @file src/exports/cache.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const { join } = require("path");
const { existsSync } = require("fs");
const WpwWebpackExport = require("./base");
const typedefs = require("../types/typedefs");
const { apply, applyIf, findExPathSync } = require("../utils");


/**
 * @extends {WpwWebpackExport}
 */
class WpwCacheExport extends WpwWebpackExport
{
	/**
     * @param {typedefs.WpwExportOptions} options
     */
	constructor(options)
	{
		super(options);
	}


	/**
     * @override
     * @param {typedefs.WpwBuild} build
     */
	static create = (build) => { const e = new this({ build }); e.create(); return e; };


    /**
     * @function
     */
    create()
    {
        const build = this.build;
        if (build.options.cache)
        {
            let depPath;
            const basePath = build.getBasePath();
            const cache = apply(build.wpc.cache, /** @type {typedefs.WebpackFileCacheOptions} */({
                type: "filesystem",
                cacheDirectory: join(build.global.cacheDir, "webpack"),
                name: this.cacheName,
                version: build.pkgJson.version
            }));

            cache.buildDependencies = {
                defaultWebpack: [ "webpack/lib/" ],
                config: []
            };

            depPath = join(basePath, "webpack.config.js");
            if (existsSync(depPath)) {
                cache.buildDependencies.config.push(depPath);
            }

            depPath = findExPathSync([ ".wpwrc.json", ".wpwrap.json", ".webpackwraprc.json" ], basePath);
            if (depPath) {
                cache.buildDependencies.config.push(depPath);
            }

            depPath = join(basePath, "schema", "spm.schema.wpw.json");
            if (existsSync(depPath)) {
                cache.buildDependencies.config.push(depPath);
            }

            if (cache.buildDependencies.config.length === 0) {
                delete cache.buildDependencies.config;
            }

            if (!build.wpc.infrastructureLogging.debug && (build.logger.level === 5 || build.options.cache.verbose)) {
                applyIf(build.wpc.infrastructureLogging, { debug: /webpack\.cache/ });
            }
        }
        else {
            apply(build.wpc.cache, {
                type: "memory",
                maxGenerations: Infinity,
                cacheUnaffected: true
            });
        }
    };
}


module.exports = WpwCacheExport.create;
