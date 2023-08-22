/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/types.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const { resolve } = require("path");
const { existsSync } = require("fs");
const { unlink } = require("fs/promises");
const WpBuildBaseTsPlugin = require("./tsc");
const typedefs = require("../../types/typedefs");


/**
 * @class WpBuildTypesPlugin
 */
class WpBuildTypesPlugin extends WpBuildBaseTsPlugin
{
    /**
     * @function Called by webpack runtime to initialize this plugin
     * @override
     * @member apply
     * @param {typedefs.WebpackCompiler} compiler the compiler instance
     */
    apply(compiler)
    {
        this.onApply(compiler,
        {
			buildTypes: {
				async: true,
                hook: "compilation",
				stage: "ADDITIONAL",
				statsProperty: "types",
				statsPropertyColor: this.app.build.log.color,
                callback: this.types.bind(this)
            }
        });
    }

	/**
	 * @function
	 * @private
	 * @param {typedefs.WebpackCompilationAssets} assets
	 */
	async types(assets)
	{
		const tsc = this.app.tsConfig;
		if (tsc)
		{
			const logger = this.logger,
				  basePath = /** @type {string} */(this.app.getRcPath("base")),
			      typesDirSrc = this.app.getSrcPath({ build: this.app.build.name, stat: true }),
				  typesDirDist = this.app.getDistPath({ build: this.app.build.name });
			logger.write("start types build", 2);
			logger.value("   base path", basePath, 3);
			logger.value("   types src path", typesDirSrc, 3);
			logger.value("   types dist path", typesDirDist, 3);
			if (typesDirSrc)
			{
				if (typesDirSrc && !existsSync(typesDirDist))
				{
					logger.write("   force clean tsbuildinfo file", 2);
					const tsbuildinfo = resolve(basePath, tsc.json.compilerOptions.tsBuildInfoFile || "tsconfig.tsbuildinfo");
					try { await unlink(tsbuildinfo); } catch {}
				}
				await this.execTsBuild(tsc, [
					"-p", "./tsconfig.node.json", "--declaration", "--emitDeclarationOnly", "--declarationDir", typesDirDist
				], 1, typesDirDist);
				this.bundleDts(assets);
				logger.write("type definitions created successfully @ " + typesDirDist, 1);
			}
		}
	}
}


/**
 * @param {typedefs.WpBuildApp} app
 * @returns {WpBuildTypesPlugin | undefined}
 */
const types = (app) => app.build.plugins.types /* && app.build.type === "types" */ ? new WpBuildTypesPlugin({ app }) : undefined;


module.exports = types;
