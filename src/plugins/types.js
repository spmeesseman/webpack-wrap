/* eslint-disable jsdoc/valid-types */
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
const { existsAsync, WpBuildError, apply, pushIfNotExists } = require("../utils");


/**
 * @extends WpBuildBaseTsPlugin
 */
class WpBuildTypesPlugin extends WpBuildBaseTsPlugin
{
    /**
     * @param {typedefs.WpwPluginOptions} options Plugin options to be applied
     */
	constructor(options)
	{
		super(options);
		this.buildOptions = /** @type {Exclude<typedefs.WpwBuildOptions["types"], undefined>} */(this.buildOptions);
	}


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
	 * @private
	 * @template {string} T
	 * @template {T extends "program" ? typedefs.WpwSourceCodeConfigCompilerOptions : string[]} R
	 * @param {T} type
	 * @returns {R}
	 */
	getCompilerOptions(type)
	{
		const sourceCode = this.app.source,
			  configuredOptions = this.app.source.config.options.compilerOptions,
			  basePath = /** @type {string} */(this.app.getRcPath("base")),
			  typesDirDist = configuredOptions.declarationDir ?
							 resolve(this.app.getBasePath(), configuredOptions.declarationDir) : this.app.getDistPath();

		// const tsbuildinfo = resolve(basePath, sourceCode.config.options.compilerOptions.tsBuildInfoFile || "tsconfig.tsbuildinfo");
		const tsBuildInfoFile = resolve(basePath, "./node_modules/.cache/wpwrap/tsconfig.types.tsbuildinfo");

		if (type === "program")
		{
			/** @type {typedefs.WpwSourceCodeConfigCompilerOptions} */
			const programOptions = {
				declaration: true,
				declarationMap: false,
				emitDeclarationOnly: true,
				noEmit: false,
				skipLibCheck: true
			};
			if (sourceCode.type === "javascript")
			{
				apply(programOptions, {
					allowJs: true,
					strictNullChecks: false
				});
			}
			if (!configuredOptions.target)
			{
				programOptions.target = "es2020";
			}
			if (!configuredOptions.moduleResolution)
			{   //
				// TODO - module resolution (node16?) see https://www.typescriptlang.org/tsconfig#moduleResolution
				//
				if (this.app.build.target !== "node") {
					programOptions.moduleResolution = "node";
				}
				// else if (this.app.nodeVersion < 12) {
				//	programOptions.moduleResolution = "node10";
				// }
				else {
					programOptions.moduleResolution = "node";
					// programOptions.moduleResolution = "node16";
				}
			}
			if (!configuredOptions.incremental && !!configuredOptions.composite)
			{
				apply(programOptions, {
					incremental: true,
					tsBuildInfoFile
				});
			}
			if (!configuredOptions.tsBuildInfoFile)
			{
				programOptions.tsBuildInfoFile = tsBuildInfoFile;
			}
			if (!configuredOptions.declarationDir)
			{
				programOptions.declarationDir = typesDirDist;
			}
			return /** @type {R} */(programOptions);
		}
		else
		{
			const tscArgs = [
				"--skipLibCheck", "--declaration", "--emitDeclarationOnly", "--declarationMap", "false", "--noEmit", "false"
			];
			if (sourceCode.type === "javascript")
			{
				tscArgs.push("--allowJs", "--strictNullChecks", "false");
			}
			if (!configuredOptions.target)
			{
				tscArgs.push("--target", "es2020 ");
			}
			if (!configuredOptions.moduleResolution)
			{   //
				// TODO - module resolution (node16?) see https://www.typescriptlang.org/tsconfig#moduleResolution
				//
				if (this.app.build.target !== "node") {
					tscArgs.push("--moduleResolution", "node");
				}
				// else if (this.app.nodeVersion < 12) {
				// 	tscArgs.push("--moduleResolution", "node10");
				// }
				else {
					tscArgs.push("--moduleResolution", "node");
					// tscArgs.push("--moduleResolution", "node16");
				}
			}
			if (!configuredOptions.incremental && !!configuredOptions.composite)
			{
				tscArgs.push("--incremental");
				tscArgs.push("--tsBuildInfoFile", tsBuildInfoFile, "--tsBuildInfoFile", tsBuildInfoFile);
			}
			if (!configuredOptions.tsBuildInfoFile)
			{
				pushIfNotExists(tscArgs, "--tsBuildInfoFile", tsBuildInfoFile);
			}
			if (!configuredOptions.declarationDir)
			{
				tscArgs.push("--declarationDir", typesDirDist);
			}
			return /** @type {R} */(tscArgs);
		}
	};


	/**
	 * @private
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
				  method = this.buildOptions.method,
			      compilerOptions = sourceCode.config.options.compilerOptions,
				  basePath = /** @type {string} */(this.app.getRcPath("base")),
				  typesDirDist = compilerOptions.declarationDir ?
				  				 resolve(this.app.getBasePath(), compilerOptions.declarationDir) : this.app.getDistPath();

			logger.write("start types build", 2);
			logger.value("   method", typesDirDist, 3);
			logger.value("   base path", basePath, 3);
			logger.value("   types dist path", typesDirDist, 3);

			if (method !== "tsc")
			{
				const options = this.getCompilerOptions("program");
				if (!existsSync(typesDirDist) && options.tsBuildInfoFile)
				{
					logger.write("   force clean tsbuildinfo file", 2);
					try { await unlink(options.tsBuildInfoFile); } catch {}
				}
				this.app.source.createProgram(options);
				this.app.source.emit(undefined, undefined, undefined, true);
			}
			else
			{
				const tscArgs = this.getCompilerOptions("tsc"),
					  tsBuildInfoFile = tscArgs[tscArgs.findIndex(a => a === "--tsBuildInfoFile") + 1];
				if (!existsSync(typesDirDist) && tsBuildInfoFile)
				{
					logger.write("   force clean tsbuildinfo file", 2);
					try { await unlink(tsBuildInfoFile); } catch {}
				}
				await this.execTsBuild(sourceCode.config, tscArgs, 1, typesDirDist);
			}

			//
			// Bundle
			//
			this.bundleDts(assets);
			logger.write("type definitions created successfully @ " + typesDirDist, 1);
		}
	}
}


module.exports = WpBuildTypesPlugin.build;
