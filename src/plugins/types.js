/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/types.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 */

const { resolve, join } = require("path");
const { existsSync } = require("fs");
const { unlink } = require("fs/promises");
const WpBuildBaseTsPlugin = require("./tsc");
const typedefs = require("../types/typedefs");
const { existsAsync, WpBuildError, relativePath } = require("../utils");


/**
 * @extends WpBuildBaseTsPlugin
 */
class WpBuildTypesPlugin extends WpBuildBaseTsPlugin
{
    /**
     * @param {typedefs.WpBuildPluginOptions} options Plugin options to be applied
     */
	constructor(options) { super(options); }


    /**
     * Called by webpack runtime to initialize this plugin
     * @override
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
                callback: this.types.bind(this)
            }
        });
    }


	/**
	 * @private
	 * @param {typedefs.WebpackCompilationAssets} assets
	 */
	async types(assets)
	{
		const sourceCode = this.app.source;
		if (sourceCode && sourceCode.config && sourceCode.config.path)
		{
			const logger = this.logger,
				  basePath = /** @type {string} */(this.app.getRcPath("base"));
			let typesDirSrc = this.app.getSrcPath({ stat: true }),
				typesDirDist = this.app.getDistPath();
			logger.write("start types build", 2);
			logger.value("   base path", basePath, 3);
			logger.value("   types src path", typesDirSrc, 3);
			logger.value("   types dist path", typesDirDist, 3);

			if (!typesDirSrc)
			{
				typesDirSrc = this.app.getSrcPath({ build: "module", stat: true });
			}
			if (!typesDirSrc)
			{
				this.compilation.errors.push(
					WpBuildError.getErrorMissing("js/ts config file", "plugins/types.js", this.app.wpc)
				);
				return;
			}
			if (!typesDirDist)
			{
				typesDirDist = resolve(this.app.getSrcPath({ build: "module" }), "types");
				if (await existsAsync(typesDirDist)) {
					typesDirDist = join(typesDirDist, "build");
				}
				else {
					typesDirDist = resolve(this.app.getBasePath(), "types/build");
				}
			}

			// const tsbuildinfo = resolve(basePath, sourceCode.config.options.compilerOptions.tsBuildInfoFile || "tsconfig.tsbuildinfo");
			const tsbuildinfo = resolve(basePath, "./node_modules/.cache/wpwrap/tsconfig.types.tsbuildinfo");
			if (!existsSync(typesDirDist))
			{
				logger.write("   force clean tsbuildinfo file", 2);
				try { await unlink(tsbuildinfo); } catch {}
			}

			const tscArgs = [
				"--composite", "--declaration", "--emitDeclarationOnly", "--declarationMap", "false",
				"--declarationDir", typesDirDist, "--tsBuildInfoFile", tsbuildinfo
			];
			if (sourceCode.type === "javascript")
			{
				tscArgs.push("--allowJs", "--checkJs", "--strict", "false", "--strictNullChecks", "false");
			}

			//
			// Build
			//
			await this.execTsBuild(sourceCode.config, tscArgs, 1, typesDirDist);

			//
			// Bundle
			//
			this.bundleDts(assets);
			logger.write("type definitions created successfully @ " + typesDirDist, 1);
		}
	}
}


/**
 * @param {typedefs.WpBuildApp} app
 * @returns {WpBuildTypesPlugin | undefined}
 */
const types = (app) => app.build.options.types ? new WpBuildTypesPlugin({ app }) : undefined;


module.exports = types;
