// @ts-check

/**
 * @file src/exports/cache.js
 * @version 0.0.1
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

 const { existsSync } = require("fs");
const { join, resolve } = require("path");
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
        this.buildOptions = /** @type {typedefs.WpwBuildOptionsConfig<"cache">} */(this.buildOptions); // reset for typings
	}


	/**
     * @override
     */
	static create = WpwCacheExport.wrap.bind(this);


    /**
     * @function
     */
    create()
    {
        const build = this.build;
        if (this.buildOptions.enabled)
        {
            let depPath;
            const basePath = build.getBasePath();
            const cache = apply(build.wpc.cache, /** @type {typedefs.WebpackFileCacheOptions} */(
            {
                type: "filesystem",
                cacheDirectory: join(build.global.cacheDir, "webpack"),
                name: this.cacheName,
                profile: build.logger.level >= 4 || !!this.buildOptions.verbose,
                version: build.pkgJson.version,
                buildDependencies: {
                    defaultWebpack: [ "webpack/lib/" ],
                    config: [
                        resolve(basePath, "schema/spm.schema.wpw.json")
                    ]
                }
            }));

            depPath = resolve(basePath, "node_modules/@spmeesseman/webpack-wrap/dist/webpack-wrap.js");
            if (existsSync(depPath)) {
                cache.buildDependencies.config.push(depPath);
            }
            else
            {   depPath = resolve(basePath, "../webpack-wrap/dist/webpack-wrap.js");
                if (existsSync(depPath)) {
                    cache.buildDependencies.config.push(depPath);
                }
                else
                {   depPath = resolve(basePath, "../../webpack-wrap/dist/webpack-wrap.js");
                    if (existsSync(depPath)) {
                        cache.buildDependencies.config.push(depPath);
                    }
                }
            }

            depPath = join(basePath, "webpack.config.js");
            if (existsSync(depPath)) {
                cache.buildDependencies.config.push(depPath);
            }

            depPath = findExPathSync([ ".wpwrc.json", ".wpwrap.json", ".webpackwraprc.json" ], basePath);
            if (depPath) {
                cache.buildDependencies.config.push(resolve(basePath, depPath));
            }

            if (!build.wpc.infrastructureLogging.debug && (build.logger.level >= 4 || !!this.buildOptions.verbose))
            {
                applyIf(build.wpc.infrastructureLogging, { debug: /webpack\.cache/ });
            }

            //
            // Snapshot configuration
            //
            const hash = this.buildOptions.mode === "hash" || this.buildOptions.mode === "hashtimestamp",
                  timestamp = this.buildOptions.mode === "timestamp" || this.buildOptions.mode === "hashtimestamp";
            apply(build.wpc.snapshot, /** @type {typedefs.WebpackSnapshotOptions} */(
            {
                immutablePaths: [],
                module: { hash, timestamp },
                resolve: { hash, timestamp },
                buildDependencies: { hash, timestamp },
                resolveBuildDependencies: { hash, timestamp },
                managedPaths: [ resolve(__dirname, "../../node_modules") ]
            }));
        }
        else
        {   apply(build.wpc.cache, {
                type: "memory",
                maxGenerations: Infinity,
                cacheUnaffected: true
            });
        }
    };
}


module.exports = WpwCacheExport.create;
