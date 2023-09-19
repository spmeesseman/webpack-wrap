/* eslint-disable jsdoc/valid-types */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file src/plugin/types.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const { existsSync } = require("fs");
const WpwError = require("../utils/message");
const typedefs = require("../types/typedefs");
const WpwBaseTaskPlugin = require("./basetask");
const { resolve, join, dirname } = require("path");
const { rm, unlink, readFile, access } = require("fs/promises");
const { dtsBundle, apply, findFiles, relativePath, isObject, resolvePath, isDirectory, isString, clone } = require("../utils");


/**
 * @extends WpwBaseTaskPlugin
 */
class WpwTypesPlugin extends WpwBaseTaskPlugin
{
    /** @type {string} @private */
	statsTag = "types";


    /**
     * @param {typedefs.WpwPluginOptions} options
     */
	constructor(options)
	{
		super(apply({ taskHandler: "buildTypes", hooks: {
			clean: WpwTypesPlugin.compilerHookConfig("done", "cleanTempFiles", true)
		} }, options));
        this.buildOptions = /** @type {typedefs.WpwBuildOptionsConfig<"types">} */(this.buildOptions); // reset for typings
	}


	/**
     * @override
     * @param {typedefs.WpwBuild} build
	 * @returns {WpwTypesPlugin | undefined}
     */
	static create = (build) => WpwTypesPlugin.wrap(WpwTypesPlugin, build, "types", undefined, [[ "mode", "plugin" ]]);


	/**
	 * @protected
	 * @param {typedefs.WebpackCompilationAssets} _assets
	 */
	async buildTypes(_assets)
	{
		const build = this.build,
			  source = build.source,
			  logger = this.logger,
			  basePath = build.getBasePath(),
			  method = this.buildOptions.method,
			  tscConfig = clone(source.config),
			  compilerOptions = tscConfig.compilerOptions,
			  srcDir = build.getSrcPath(),
			  // distDirAbs = build.getDistPath({ fallback: true }),
			  distDirRel = build.getDistPath({ rel: true, psx: true, fallback: true }),
			  outputDirRel = compilerOptions.declarationDir ?? distDirRel; // ,
			  // outputDirAbs = resolvePath(basePath, outputDirRel);

		logger.write("start types build", 1);
		logger.value("   method", method, 2);
		logger.value("   mode", this.buildOptions.mode, 2);
		logger.value("   entry", this.buildOptions.entry, 2);
		logger.value("   base path", basePath, 3);
		logger.value("   source path", srcDir, 3);
		logger.value("   dist directory", distDirRel, 2);
		logger.value("   output directory", outputDirRel, 2);
		logger.value("   build options", this.buildOptions, 4);

		let rc;
		const options = this.compilerOptions();
		this.maybeDeleteTsBuildInfoFile(options.tsBuildInfoFile, outputDirRel);

		if (method === "program")
		{
			// const // ignore = tscConfig.exclude || [],
			// 	  files = build.source.config.files;
			// let typesExcludeIdx = ignore.findIndex(e => e.includes("types"));
			// while (typesExcludeIdx !== -1) {
			// 	ignore.splice(typesExcludeIdx, 1);
			// 	typesExcludeIdx = ignore.findIndex(e => e.includes("types"));
			// }
			// const srcDtsFiles = await findFiles("**/*.ts", { cwd: srcDir, ignore, absolute: true });
			// if (srcDtsFiles.length)
			// {
			// 	logger.write(`   adding ${srcDtsFiles.length} .ts files found in source directory`, 2);
			// 	files.push(...srcDtsFiles);
			// }
			// if (tscConfig.include && tscConfig.exclude)
			// {
			// 	let typesExcludeIdx = tscConfig.exclude.findIndex(e => e.includes("types"));
			// 	if (typesExcludeIdx !== -1)
			// 	{
			// 		const origFiles = files.splice(0);
			// 		logger.write("   types exclude found in tsconfig, modify input files list", 2);
			// 		logger.value("      current # of input files", origFiles.length, 2);
			//
			// 		while (typesExcludeIdx !== -1)
			// 		{
			// 			const removedExclude = tscConfig.exclude.splice(typesExcludeIdx, 1);
			// 			logger.value("   types exclude found in tsconfig, modify input files list", removedExclude, 2);
			// 			typesExcludeIdx = tscConfig.exclude.findIndex(e => e.includes("types"));
			// 		}
			//
			// 		for (const incPath of tscConfig.include)
			// 		{
			// 			let globPattern;
			// 			const globMatch = incPath.match(new RegExp(`.*?(\\*\\*?(?:[\\\\\\/]\\*(?:\\*|\\.${build.source.ext})))`));
			// 			if (globMatch) {
			// 				globPattern = globMatch[1];
			// 			}
			// 			const fullPath = resolvePath(build.getBasePath(), !globPattern ? incPath : incPath.replace(globPattern, ""));
			// 			if (globPattern || isDirectory(fullPath))
			// 			{
			// 				logger.value("      add files from include path", incPath, 3);
			// 				const incFiles = await findFiles(
			// 					// incPath,
			// 					// globPattern ? incPath : `${incPath}/**/*.{js,ts}`,
			// 					globPattern ? incPath : `${incPath}/**/*.${build.source.ext}`,
			// 					// `${incPath}/**/*.${build.source.ext}`,
			// 					{ cwd: build.getBasePath(), ignore: tscConfig.exclude, absolute: true
			// 				});
			// 				files.push(...incFiles);
			// 			}
			// 			else {
			// 				logger.value("      add include file", incPath, 3);
			// 				files.push(fullPath);
			// 			}
			// 		}
			//
			// 		// const srcDtsFiles = await findFiles("**/*.ts", { cwd: srcDir, ignore, absolute: true });
			// 		// if (srcDtsFiles.length)
			// 		// {
			// 		// 	logger.write(`   adding ${srcDtsFiles.length} .ts files found in source directory`, 2);
			// 		// 	files.push(...srcDtsFiles);
			// 		// }
			//
			// 		logger.value("      new # of input files", files.length, 2);
			// 	}
			// }
			// if (build.source.type === "javascript")
			// {
			// 	const incFiles = await findFiles(`${srcDir}/**/*.ts`, { cwd: srcDir, ignore: tscConfig.exclude, absolute: true });
			// 	files.push(...incFiles);
			// }

			const result = build.source.emit(options, true);
			rc = !result.emitSkipped && result.diagnostics.length === 0 ? 0 : -1;
			if (rc !== 0)
			{
				build.addMessage({
					pad: "   ",
					compilation: this.compilation,
					code: WpwError.Msg.ERROR_TYPES_FAILED,
					message: "check program returned diagnostics in log output"
				});
			}
		}
		else if (method === "tsc")
		{
			rc = await this.execTsBuild(source.configFile, this.compilerOptionsToArgs(options), this.buildPathTemp);
		}
		else {
			build.addMessage({
				pad: "   ",
				compilation: this.compilation,
				code: WpwError.Msg.ERROR_TYPES_FAILED,
				message: `configured build method is '${method}'`
			});
		}

		if (rc === 0)
		{
			logger.write("   types build successful, process assets", 2);
			const bundleOptions = this.buildOptions.bundle,
				  bundleOptionsIsCfg = isObject(bundleOptions),
			      isBundleEnabled = bundleOptions === true || bundleOptionsIsCfg;
			if (isBundleEnabled && bundleOptionsIsCfg && bundleOptions.bundler === "dts-bundle")
			{
				await dtsBundle(this.build, this.compilation, this.statsTag);
			}
			else {
				await this.emit();
			}
			logger.write("type definitions created successfully @ " + outputDirRel, 1);
		}
		else {
			logger.write(`type definitions compilation completed with failure [code:${rc}]`, 1);
		}
	}


	/**
	 * @protected
	 * @param {typedefs.WebpackStats} _stats
	 */
	async cleanTempFiles(_stats)
	{
		const tmpFiles = await findFiles("**/dts-bundle.tmp.*", { cwd: this.build.getBasePath(), absolute: true });
		for (const file of tmpFiles)
		{
			await unlink(file);
		}
	};


	/**
	 * @private
	 * @returns {typedefs.WpwSourceConfigCompilerOptions}
	 */
	compilerOptions()
	{
		const build = this.build,
			  source = build.source,
			  configuredOptions = build.source.config.compilerOptions,
			  basePath = build.getBasePath(),
			  //
			  // TODO - does project have separate cfg files for ttpes build?  or using main config file?
			  //        if separate, use buildinfofile specified in config file
			  //
			  tsBuildInfoFile = resolve(basePath, "./node_modules/.cache/wpwrap/tsconfig.types.tsbuildinfo"),
			  // tsBuildInfoFile = resolve(basePath, source.config.options.compilerOptions.tsBuildInfoFile || "tsconfig.tsbuildinfo")
			  // declarationDir = configuredOptions.declarationDir || build.getDistPath({ rel: true, psx: true }),
			  declarationDir = this.buildPathTemp;

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
			programOptions.outFile = join(declarationDir, build.name); // don't specify an extension
		}
		if (!configuredOptions.incremental && !configuredOptions.composite)
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
			if (build.target !== "node") {
				programOptions.moduleResolution = "node";
			}
			// else if (build.nodeVersion < 12) {
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
		return Object.entries(options).filter(([ _, v ]) => v !== undefined).map(([ k, v ]) => v !== true ? `--${k} ${v}` : `--${k}`);
	}


	/**
	 * @private
	 */
	async emit()
	{
		const files = await findFiles("**/*.d.ts", { cwd: this.buildPathTemp, absolute: true });
		for (const file of files)
		{
			const assetPath = relativePath(this.buildPathTemp, file),
				  dirPathRealAbs = dirname(file),
				  data = await readFile(file),
				  source = new this.compiler.webpack.sources.RawSource(data);
			const info = /** @type {typedefs.WebpackAssetInfo} */({
				immutable: false,
				javascriptModule: false,
				types: true
			});
			try
			{   await unlink(file);
				if ((await findFiles("*.*", { cwd: dirPathRealAbs })).length === 0) {
					await rm(dirPathRealAbs, { recursive: true, force: true });
				}
			}
			catch (e)
			{   this.build.addMessage({
					code: WpwError.Msg.WARNING_GENERAL,
					message: `failed to remove temp files, asset '${assetPath}' will still be emitted` }
				);
			}
			this.compilation.emitAsset(assetPath, source, info);
		}
	};


	/**
	 * @private
	 * @param {typedefs.WpwSourceTsConfigFile} configFile
	 * @param {string[]} args
	 * @param {string} outputDir Output directory of build`
	 * @returns {Promise<number | null>}
	 * @throws {typedefs.WpwError}
	 */
	async execTsBuild(configFile, args, outputDir)
	{
		if (!configFile || !configFile.path) {
			this.build.addMessage({
				code: WpwError.Msg.ERROR_TYPES_FAILED,
				compilation: this.compilation,
				message: "invalid source code configured path"
			});
			return -1;
		}

		const logger = this.build.logger,
			  baseBuildDir = this.build.getBasePath(),
			  configFilePathRel = relativePath(this.build.getBasePath(), configFile.path),
			  outputDirAbs = resolvePath(baseBuildDir, outputDir);

		const command = `npx tsc -p ./${configFilePathRel} ${args.join(" ")}`;
		logger.write(`   execute tsc command [ config file @ ${configFile.path}]`, 1);
		logger.write("      command: " + command.slice(4), 2);

		const result = await this.exec(command, "tsc");
		if (result !== 0)
		{
			this.build.addMessage({
				code: WpwError.Msg.ERROR_TYPES_FAILED,
				compilation: this.compilation,
				message: "tsc returned error code " + result
			});
			return result;
		}
		//
		// Ensure target directory exists
		//
		try {
			await access(outputDirAbs);
		}
		catch (e) {
			this.build.addMessage({
				code: WpwError.Msg.ERROR_TYPES_FAILED,
				compilation: this.compilation,
				message: "output directory does not exist @ " + outputDirAbs
			});
			return -2;
		}

		logger.write("   finished execution of tsc command", 3);
		return 0;
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

}


module.exports = WpwTypesPlugin.create;
