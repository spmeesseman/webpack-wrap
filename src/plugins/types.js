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
const { unlink, readFile } = require("fs/promises");
const WpwError = require("../utils/message");
const typedefs = require("../types/typedefs");
const { existsSync } = require("fs");
const { existsAsync, apply, findFiles, relativePath, resolvePath, isDirectory, isBoolean, isObject } = require("../utils");
const { writeFile } = require("fs/promises");


/**
 * @extends WpwTscPlugin
 */
class WpwTypesPlugin extends WpwTscPlugin
{
    /** @type {typedefs.WpwBuildOptionsConfig<"types">} @protected */
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
		this.virtualFile = `${this.build.name}${this.build.source.dotext}`;
		this.virtualFilePath = `${this.build.global.cacheDir}/${this.virtualFile}`;
	}


	/**
     * @override
     * @param {typedefs.WpwBuild} build
	 * @returns {WpwTypesPlugin | undefined}
     */
	static create = (build) => WpwTypesPlugin.wrap(WpwTypesPlugin, build, "types", undefined, [[ "mode", "plugin" ]]);


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
			buildTypes: {
				async: true,
                hook: "compilation",
				stage: "ADDITIONAL",
				statsProperty: "types",
                callback: this.types.bind(this)
            },
			cleanTempFiles: {
				async: true,
				hook: "done",
				callback: this.cleanTempFiles.bind(this)
			},
			injectVirtualEntryFile: {
				async: true,
				hook: "beforeRun",
				callback: this.injectVirtualEntryFile.bind(this)
			}
        });
    }


	/**
	 * @private
	 * @param {typedefs.WebpackStats} _stats
	 */
	async cleanTempFiles(_stats)
	{
		const tmpFiles = await findFiles("**/dts-bundle.tmp.*", { cwd: this.build.getBasePath(), absolute: true });
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
	 * @returns {typedefs.WpwSourceConfigCompilerOptions}
	 */
	getCompilerOptions()
	{
		const source = this.build.source,
			  configuredOptions = this.build.source.config.compilerOptions,
			  basePath = this.build.getBasePath(),
			  //
			  // TODO - does project have separate cfg files for ttpes build?  or using main config file?
			  //        if separate, use buildinfofile specified in config file
			  //
			  tsBuildInfoFile = resolve(basePath, "./node_modules/.cache/wpwrap/tsconfig.types.tsbuildinfo"),
			  // tsBuildInfoFile = resolve(basePath, source.config.options.compilerOptions.tsBuildInfoFile || "tsconfig.tsbuildinfo")
			  declarationDir = configuredOptions.declarationDir || this.build.getDistPath({ rel: true, psx: true });

		/** @type {typedefs.WpwSourceConfigCompilerOptions} */
		const programOptions = {
			declaration: true,
			declarationDir,
			declarationMap: false,
			emitDeclarationOnly: true,
			noEmit: false,
			skipLibCheck: true,
			tsBuildInfoFile
		};
		if (source.type === "javascript")
		{
			apply(programOptions, {
				allowJs: true,
				strictNullChecks: false
			});
		}
		const bundleOptions = this.buildOptions.bundle;
		if (bundleOptions && isObject(bundleOptions) && bundleOptions.bundler === "tsc")
		{
			programOptions.declarationDir = undefined;
			programOptions.outFile = join(declarationDir, this.build.name);
		}
		if (!configuredOptions.incremental && !!configuredOptions.composite)
		{
			programOptions.incremental = true;
		}
		// if (!configuredOptions.target)
		// {
		// 	programOptions.target = "es2020";
		// }
		if (!configuredOptions.moduleResolution)
		{   //
			// TODO - module resolution (node16?) see https://www.typescriptlang.org/tsconfig#moduleResolution
			//
			if (this.build.target !== "node") {
				programOptions.moduleResolution = "node";
			}
			// else if (this.build.nodeVersion < 12) {
			//	programOptions.moduleResolution = "node10";
			// }
			else {
				programOptions.moduleResolution = "node";
				// programOptions.moduleResolution = "node16";
			}
		}
		return programOptions;
	};


	/**
	 * @param {typedefs.WpwSourceConfigCompilerOptions} options
	 * @returns {string[]}
	 */
	compilerOptionsToArgs(options)
	{
		return Object.entries(options).map(([ key, value ]) => value !== true ? `--${key} ${value}` : `--${key}`);
	}


	/**
	 * @private
	 * @param {typedefs.WebpackCompiler} _compiler
	 */
	async injectVirtualEntryFile(_compiler)
	{
		const dummyCode = "console.log('dummy source');",
			  source = `export default () => { ${JSON.stringify(dummyCode)}; }`;
        await writeFile(this.virtualFilePath, source);
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
			const typesDirDistAbs = resolve(this.build.getBasePath(), outputDir);
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
		const source = this.build.source,
			  logger = this.logger,
			  basePath = this.build.getBasePath(),
			  method = this.buildOptions.method,
			  tscConfig = source.config,
			  compilerOptions = tscConfig.compilerOptions,
			  typesSrcDir = this.build.getSrcPath(),
			  typesDistDir = this.build.getDistPath({ rel: true, psx: true, fallback: true }),
			  outputDir = compilerOptions.declarationDir ?? typesDistDir;

		logger.write("start types build", 1);
		logger.value("   method", method, 2);
		logger.value("   mode", this.buildOptions.mode, 2);
		logger.value("   entry", this.buildOptions.entry, 2);
		logger.value("   base path", basePath, 3);
		logger.value("   source path", typesSrcDir, 3);
		logger.value("   output directory", outputDir, 2);
		logger.value("   build options", this.buildOptions, 4);

		const virtualEntryFile = Object.keys(assets).find(f => f.endsWith(this.virtualFile));
		if (virtualEntryFile) {
			logger.write(`   delete virtual entry asset '${virtualEntryFile}'`, 3);
			this.compilation.deleteAsset(virtualEntryFile);
		}

		let rc;
		const options = this.getCompilerOptions();
		this.maybeDeleteTsBuildInfoFile(options.tsBuildInfoFile, outputDir);

		if (method === "program")
		{
			const ignore = tscConfig.exclude || [],
				  files = this.build.source.config.files,
				  typesExcludeIdx = ignore.findIndex(e => e.includes("types"));
			// if (typesExcludeIdx !== -1) {
			// 	ignore.splice(typesExcludeIdx, 1);
			// }
			// const srcDtsFiles = await findFiles(
			// 	`${typesSrcDir}/**/*.ts`, { cwd: typesSrcDir, ignore, absolute: true }
			// );
			// if (srcDtsFiles.length)
			// {
			// 	logger.write(`   adding ${srcDtsFiles.length} .ts files found in source directory`, 2);
			// 	files.push(...srcDtsFiles);
			// }
			// if (tscConfig.include && tscConfig.exclude)
			// {
			// 	const typesExcludeIdx = tscConfig.exclude.findIndex(e => e.includes("types"));
			// 	if (typesExcludeIdx !== -1)
			// 	{
			// 		logger.write("   types exclude found in tsconfig, modify input files list", 2);
			// 		const origFiles = files.splice(0);
			// 		tscConfig.exclude.splice(typesExcludeIdx, 1);
			// 		for (const incPath of tscConfig.include)
			// 		{
			// 			let globPattern;
			// 			const globMatch = incPath.match(new RegExp(`.*?(\\*\\*?(?:[\\\\\\/]\\*(?:\\*|\\.${this.build.source.ext})))`));
			// 			if (globMatch) {
			// 				globPattern = globMatch[1];
			// 			}
			// 			const fullPath = resolvePath(this.build.getBasePath(), !globPattern ? incPath : incPath.replace(globPattern, ""));
			// 			if (globPattern || isDirectory(fullPath))
			// 			{
			// 				logger.value("      add files from include path", incPath, 4);
			// 				const incFiles = await findFiles(
			// 					// incPath,
			// 					globPattern ? incPath : `${incPath}/**/*.${this.build.source.ext}`,
			// 					// `${incPath}/**/*.${this.build.source.ext}`,
			// 					{ cwd: this.build.getBasePath(), ignore: tscConfig.exclude, absolute: true
			// 				});
			// 				files.push(...incFiles);
			// 			}
			// 			else {
			// 				logger.value("      add include file", incPath, 4);
			// 				files.push(fullPath);
			// 			}
			// 		}
			// 		logger.value("      # of new input files", files.length, 2);
			// 		logger.value("      # of previous input files", origFiles.length, 2);
			// 		logger.write("   input files list modification complete", 2);
			// 	}
			// }
			this.build.source.createProgram(options, files);
			const result = this.build.source.emit(undefined, undefined, undefined, true);
			if (!result)
			{
				this.build.addMessage({ code: WpwError.Msg.ERROR_TYPES_FAILED, compilation: this.compilation, message: "" });
				return;
			}
			rc = !result.emitSkipped ? result.diagnostics.length : -1;
		}
		else if (method === "tsc")
		{
			rc = await this.execTsBuild(source.configFile, this.compilerOptionsToArgs(options), 1, outputDir);
		}
		else {
			this.build.addMessage({
				code: WpwError.Msg.ERROR_TYPES_FAILED,
				compilation: this.compilation,
				message: `configured build method is '${method}'`
			});
		}

		if (rc === 0)
		{
			const outputDirAbs = resolve(this.build.getBasePath(), outputDir);
			if (!(await existsAsync(outputDirAbs)))
			{
				this.build.addMessage({
					code: WpwError.Msg.ERROR_TYPES_FAILED,
					compilation: this.compilation,
					message: "output directory does not exist"
				});
				return;
			}

			const _emit = async (fileAbs) =>
			{
				const info = /** @type {typedefs.WebpackAssetInfo} */({
					immutable: false,
					javascriptModule: false,
					types: true
				});
				const data = await readFile(fileAbs),
				      source = new this.compiler.webpack.sources.RawSource(data);
				this.compilation.emitAsset(relativePath(basePath, fileAbs), source, info);
			};

			const bundleOptions = this.buildOptions.bundle,
			      isBundleEnabled = bundleOptions === true || isObject(bundleOptions);
			if (isBundleEnabled)
			{
				const bundler = isObject(bundleOptions) ? bundleOptions.bundler : "tsc";
				if (bundler === "dts-bundle")
				{
					await this.dtsBundle("types");
				}
				else
				{   // const files = await findFiles(
					// 	"**/*.ts", { cwd: outputDirAbs, absolute: true, ignore: [ "**/" + options.outFile ] }
					// );
					for (const file of source.config.files){
						this.compilation.fileDependencies.add(file);
					}
					await _emit(resolvePath(basePath, options.outFile));
				}
			}
			else
			{
				const files = await findFiles("**/*.d.ts", { cwd: outputDirAbs, absolute: true });
				for (const file of files){
					await _emit(relativePath(basePath, file));
				}
			}

			logger.write("type definitions created successfully @ " + outputDir, 1);
		}
		else {
			logger.write(`type definitions compilation completed with failure [code:${rc}]`, 1);
		}
	}
}


module.exports = WpwTypesPlugin.create;
