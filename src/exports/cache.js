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
const { apply, applyIf } = require("../utils");


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
            const basePath = build.getBasePath();
            const cache = apply(build.wpc.cache, {
                type: "filesystem",
                cacheDirectory: join(build.global.cacheDir, "webpack"),
                name: this.cacheName,
                version: build.pkgJson.version, // `${process.env.GIT_REV}`
                buildDependencies:
                {
                    defaultWebpack: [ "webpack/lib/" ],
                    config: [
                        join(basePath, "webpack.config.js")
                    ]
                }
            });
            let rcPath = join(basePath, ".wpwrc.json");
            if (existsSync(rcPath)) {
                cache.buildDependencies.config.push(rcPath);
            }
            else
            {
                rcPath = join(basePath, ".wpwrap.json");
                if (existsSync(rcPath)) {
                    cache.buildDependencies.config.push(rcPath);
                }
                else {
                    rcPath = join(basePath, ".webpackwraprc.json");
                    if (existsSync(rcPath)) {
                        cache.buildDependencies.config.push(rcPath);
                    }
                }
            }
            const projectSchemaPath = join(basePath, "schema", "spm.schema.wpw.json");
            if (existsSync(projectSchemaPath)) {
                cache.buildDependencies.config.push(projectSchemaPath);
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
