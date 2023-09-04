/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/types.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const { existsSync, readdir, stat, readFile } = require("fs");
const { resolve, join } = require("path");
const { unlink } = require("fs/promises");
const WpBuildBaseTsPlugin = require("./tsc");
const typedefs = require("../types/typedefs");
const { existsAsync, WpBuildError } = require("../utils");


/**
 * @extends WpBuildBaseTsPlugin
 */
class WpBuildTypesPlugin extends WpBuildBaseTsPlugin
{
    /**
     * @param {typedefs.WpwPluginOptions} options Plugin options to be applied
     */
	constructor(options) { super(options); }


	/**
     * @override
     * @param {typedefs.WpBuildApp} app
	 * @returns {WpBuildTypesPlugin | undefined}
     */
	static build = (app) =>
		this.getOptionsConfig("types", app).enabled ? new WpBuildTypesPlugin({ app }) : undefined;


    /**
     * Called by webpack runtime to initialize this plugin
     * @override
     * @param {typedefs.WebpackCompiler} compiler the compiler instance
     */
    apply(compiler)
    {
		// compiler.inputFileSystem = {
		// 	readFile: (arg0, arg1) => arg0.includes("index.") ? "// fake file" : readFile(arg0, arg1),
		// 	readlink: (arg0, arg1) => arg1(undefined, ""),
		// 	// @ts-ignore
		// 	readdir: (arg1, arg2) => readdir(arg1, "utf8", arg2),
		// 	stat: (arg1, arg2) => stat(arg1, arg2)
		// };
		// compiler.resolverFactory.get("normal").fileSystem = {
		// 	readFile: (arg0, arg1) => arg1(undefined, ""),
		// 	readlink: (arg0, arg1) => arg1(undefined, ""),
		// 	// @ts-ignore
		// 	readdir: (arg1, arg2) => readdir(arg1, "utf8", arg2),
		// 	stat: (arg1, arg2) => stat(arg1, arg2)
		// };
		// compiler.resolverFactory.get("context").fileSystem = compiler.resolverFactory.get("normal").fileSystem;
		// compiler.outputFileSystem = fs;

        this.onApply(compiler,
        {
			buildTypes: {
				async: true,
                hook: "compilation",
				stage: "ADDITIONAL",
				statsProperty: "types",
                callback: this.types.bind(this)
            },
			resolveFakeModule: {
				hook: "contextModuleFactory",
				callback: this.resolve.bind(this)
			}
        });
    }


	/**
	 * @param {typedefs.WebpackNormalModuleFactory} factory
	 */
	resolve(factory)
	{
		// factory.hooks.beforeResolve.tap(this.name, () => false);
		factory.fs = {
			readFile: (arg0, arg1) => arg0.includes("index.") ? "// fake file" : readFile(arg0, arg1),
			readlink: (arg0, arg1) => arg1(undefined, ""),
			// @ts-ignore
			readdir: (arg1, arg2) => readdir(arg1, "utf8", arg2),
			stat: (arg1, arg2) => stat(arg1, arg2)
		};
	}


	/**
	 * @private
	 * @param {typedefs.WebpackCompilationAssets} assets
	 */
	async types(assets)
	{
		const sourceCode = this.app.source;
		if (sourceCode.config.path)
		{
			const logger = this.logger,
				  compilerOptions = sourceCode.config.options.compilerOptions,
				  basePath = /** @type {string} */(this.app.getRcPath("base")),
				  typesDirDist = compilerOptions.declarationDir ?
				  				 resolve(this.app.getBasePath(), compilerOptions.declarationDir) : this.app.getDistPath();

			logger.write("start types build", 2);
			logger.value("   base path", basePath, 3);
			logger.value("   types dist path", typesDirDist, 3);

			// const tsbuildinfo = resolve(basePath, sourceCode.config.options.compilerOptions.tsBuildInfoFile || "tsconfig.tsbuildinfo");
			const tsbuildinfo = resolve(basePath, "./node_modules/.cache/wpwrap/tsconfig.types.tsbuildinfo");
			if (!existsSync(typesDirDist))
			{
				logger.write("   force clean tsbuildinfo file", 2);
				try { await unlink(tsbuildinfo); } catch {}
			}

			//
			// TODO - Use ts api createProgram()
			//

			const tscArgs = [
				"--incremental", "--declaration", "--emitDeclarationOnly", "--declarationMap", "false",
				"--noEmit", "false", "--tsBuildInfoFile", tsbuildinfo
			];
			if (sourceCode.type === "javascript")
			{
				tscArgs.push(
					"--allowJs", "--strict", "false", "--strictNullChecks", "false", "--skipLibCheck"
				);
			}
			// else {
			// 	tscArgs.push(
			// 		"--composite"
			// 	);
			// }

			if (!compilerOptions.target)
			{
				tscArgs.push("--target", "es2020 ");
			}
			if (!compilerOptions.moduleResolution)
			{
				tscArgs.push("--moduleResolution", "node");
			}
			if (!compilerOptions.declarationDir)
			{
				tscArgs.push("--declarationDir", typesDirDist);
			}

			// this.app.build.source.emit(undefined, undefined, undefined, true);
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


module.exports = WpBuildTypesPlugin.build;
