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

const { resolve, join } = require("path");
const WpwTscPlugin = require("./tsc");
const { unlink } = require("fs/promises");
const WpwError = require("../utils/message");
const typedefs = require("../types/typedefs");
const { existsSync, readFile, stat, readdir } = require("fs");
const { existsAsync, apply, findFiles } = require("../utils");
const { writeFile } = require("fs/promises");


/**
 * @extends WpwTscPlugin
 */
class WpBuildTypesPlugin extends WpwTscPlugin
{
    /** @type {typedefs.WpwBuildOptionsConfig<"types">} @private */
    buildOptions;
	/** @type {string} @private */
	virtualFile;
	/** @type {string} @private */
	virtualFilePath;

    /**
     * @param {typedefs.WpwPluginOptions} options Plugin options to be applied
     */
	constructor(options)
	{
		super(options);
		this.virtualFile = `${this.app.build.name}${this.app.source.dotext}`;
		this.virtualFilePath = `${this.app.global.cacheDir}/${this.virtualFile}`;
        this.buildOptions = /** @type {typedefs.WpwBuildOptionsConfig<"types">} */(this.app.build.options.types);
	}


	/**
     * @override
     * @param {typedefs.WpBuildApp} app
	 * @returns {WpBuildTypesPlugin | undefined}
     */
	static build(app)
	{
		return app.build.options.types?.enabled ? new WpBuildTypesPlugin({ app }) : undefined;
	}


    /**
     * Called by webpack runtime to initialize this plugin
	 *
     * @override
     * @param {typedefs.WebpackCompiler} compiler the compiler instance
     */
    apply(compiler)
    {
		this.onApply(compiler,
        {
			cleanTempFiles: {
				async: true,
				hook: "done",
				callback: this.cleanTempFiles.bind(this)
			},
			buildTypes: {
				async: true,
                hook: "compilation",
				stage: "ADDITIONAL",
				statsProperty: "types",
                callback: this.types.bind(this)
            },
			injectFilesystemInterface: {
				async: true,
				hook: "beforeRun",
				callback: this.injectFilesystemInterface.bind(this)
			}
        });
    }


	/**
	 * @private
	 * @param {typedefs.WebpackStats} _stats
	 */
	async cleanTempFiles(_stats)
	{
		const tmpFiles = await findFiles("**/dts-bundle.tmp.*", { cwd: this.app.getBasePath(), absolute: true });
		for (const file of tmpFiles)
		{
			await unlink(file);
		}
		if (await existsAsync(this.virtualFilePath)) {
			await unlink(this.virtualFilePath);
		}
	};


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
			  basePath = this.app.getBasePath(),
			  //
			  // TODO - does project have separate cfg files for ttpes build?  or using main config file?
			  //        if separate, use buildinfofile specified in config file
			  //
			  tsBuildInfoFile = resolve(basePath, "./node_modules/.cache/wpwrap/tsconfig.types.tsbuildinfo"),
			  // tsBuildInfoFile = resolve(basePath, sourceCode.config.options.compilerOptions.tsBuildInfoFile || "tsconfig.tsbuildinfo")
			  declarationDir = configuredOptions.declarationDir || this.app.getDistPath({ rel: true, psx: true });

		if (type === "program")
		{
			/** @type {typedefs.WpwSourceCodeConfigCompilerOptions} */
			const programOptions = {
				declaration: true,
				declarationDir,
				declarationMap: false,
				emitDeclarationOnly: true,
				noEmit: false,
				skipLibCheck: true,
				tsBuildInfoFile
			};
			if (sourceCode.type === "javascript")
			{
				apply(programOptions, {
					allowJs: true,
					strictNullChecks: false
				});
			}
			if (!configuredOptions.incremental && !!configuredOptions.composite)
			{
				programOptions.incremental = true;
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
			return /** @type {R} */(programOptions);
		}
		else
		{
			const tscArgs = [
				"--skipLibCheck", "--declaration", "--emitDeclarationOnly", "--declarationMap", "false",
				"--noEmit", "false", "--declarationDir", declarationDir, "--tsBuildInfoFile", tsBuildInfoFile
			];
			if (sourceCode.type === "javascript")
			{
				tscArgs.push("--allowJs", "--strictNullChecks", "false");
			}
			if (!configuredOptions.incremental && !!configuredOptions.composite)
			{
				tscArgs.push("--incremental");
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
			return /** @type {R} */(tscArgs);
		}
	};


	/**
	 * @private
	 * @param {typedefs.WebpackCompiler} compiler
	 */
	async injectFilesystemInterface(compiler)
	{
		const app = this.app,
			  logger = this.logger,
			  compilerOptions = app.source.config.options.compilerOptions,
			  outputDir = compilerOptions.declarationDir ?? this.app.getDistPath({ rel: true, psx: true }),
			  outputDirAbs = resolve(app.getBasePath(), outputDir),
			  dtsFile = this.app.build.name + ".d.ts",
			  dtsFilePathAbs = join(outputDirAbs, dtsFile),
			  fakeEntryFile = /** @type {string} */(this.app.wpc.entry[this.app.build.name]).replace(/^\.[\/\\]/, "");

		const dummyCode = "console.log('dummy source');",
			  source = `export default () => { ${JSON.stringify(dummyCode)}; }`;
        await writeFile(this.virtualFilePath, source);

		// compiler.inputFileSystem = {
		// 	readdir: (arg1, arg2) => readdir(arg1, "utf8", arg2),
		// 	readlink: (_, arg2) => setTimeout((cb) => cb(null, ""), 1, arg2),
		// 	readFile: (arg1, arg2) =>
		// 	{
		// 		logger.value("filesystem interface [read file]", arg1, 3);
		// 		return arg1.replace(/\\/g, "/").endsWith(fakeEntryFile) ?
		// 				setTimeout((cb) => cb(null, "// fake file"), 1, arg2) : readFile(arg1, arg2);
		// 	},
		// 	stat: (arg1, arg2) =>
		// 	{
		// 		logger.value("filesystem interface [stat]", arg1, 3);
		// 		return arg1.replace(/\\/g, "/").endsWith(fakeEntryFile) ? stat(dtsFilePathAbs, arg2) : stat(arg1, arg2);
		// 	}
		// };
	}


	/**
	 * @private
	 * @param {string | undefined} tsBuildInfoFile
	 * @param {string} outputDir
	 */
	async maybeDeleteTsBuildInfoFile(tsBuildInfoFile, outputDir)
	{
		if (tsBuildInfoFile)
		{
			const typesDirDistAbs = resolve(this.app.getBasePath(), outputDir);
			if (!existsSync(typesDirDistAbs) && tsBuildInfoFile)
			{
				this.logger.write("   force clean tsbuildinfo file", 2);
				try { await unlink(tsBuildInfoFile); } catch {}
			}
		}
	}


	/**
	 * @private
	 * @param {typedefs.WebpackCompilationAssets} assets
	 */
	async types(assets)
	{
		const sourceCode = this.app.source,
			  logger = this.logger,
			  basePath = this.app.getBasePath(),
			  method = this.buildOptions.method,
			  compilerOptions = sourceCode.config.options.compilerOptions,
			  outputDir = compilerOptions.declarationDir ?? this.app.getDistPath({ rel: true, psx: true });

		logger.write("start types build", 1);
		logger.value("   method", method, 2);
		logger.value("   mode", this.buildOptions.mode, 2);
		logger.value("   entry", this.buildOptions.entry, 2);
		logger.value("   output directory", outputDir, 2);
		logger.value("   base path", basePath, 3);
		logger.value("   build options", this.buildOptions, 4);

		const virtualEntryFile = Object.keys(assets).find(f => f.endsWith(this.virtualFile));
		if (virtualEntryFile) {
			logger.write(`   delete virtual entry asset '${virtualEntryFile}'`, 3);
			this.compilation.deleteAsset(virtualEntryFile);
		}

		if (method === "program")
		{
			const options = this.getCompilerOptions(method);
			this.maybeDeleteTsBuildInfoFile(options.tsBuildInfoFile, outputDir);
			this.app.source.createProgram(options);
			const result = this.app.source.emit(undefined, undefined, undefined, true);
			if (!result)
			{
				this.app.addMessage({ code: WpwError.Msg.ERROR_TYPES_FAILED, compilation: this.compilation, message: "" });
				return;
			}
		}
		else if (method === "tsc")
		{
			const tscArgs = this.getCompilerOptions(method),
				  tsBuildInfoFile = tscArgs[tscArgs.findIndex(a => a === "--tsBuildInfoFile") + 1];
			this.maybeDeleteTsBuildInfoFile(tsBuildInfoFile, outputDir);
			await this.execTsBuild(sourceCode.config, tscArgs, 1, outputDir);
		}
		else {
			this.app.addMessage({
				code: WpwError.Msg.ERROR_TYPES_FAILED,
				compilation: this.compilation,
				message: `configured build method is '${method}'`
			});
		}

		const outputDirAbs = resolve(this.app.getBasePath(), outputDir);
		if (await existsAsync(outputDirAbs))
		{
			if (this.buildOptions.bundle) {
				await this.bundleDts("types", outputDirAbs);
			}
			logger.write("type definitions created successfully @ " + outputDir, 1);
		}
		else {
			this.app.addMessage({
				code: WpwError.Msg.ERROR_TYPES_FAILED,
				compilation: this.compilation,
				message: "output directory does not exist"
			});
		}

		//
		// Remove js file produced by webpack bundler, by default there's no way to load source
		// code without specifying an entry point that will in the end produce a js bundle, which,
		// of course, is what Web[packis for and does.  In the case of building declarations/types
		// though, it doesnt really fit "module" definition as defined by Webpack.
		//
		// entryFile = join(typesDirDist, basename(entryFile).replace(".d.ts", ".js"));
		// if (entryFileAbs.startsWith(this.app.build.paths.temp) && existsSync(entryFileAbs)) { // // dtscfg.removeSource: true, ???
		// 	await unlink(entryFileAbs);
		// }
	}
}


module.exports = WpBuildTypesPlugin.build;
