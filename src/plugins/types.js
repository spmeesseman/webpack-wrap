/* eslint-disable jsdoc/valid-types */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file src/plugins/types.js
 * @version 0.0.1
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const { existsSync } = require("fs");
const WpwError = require("../utils/message");
const typedefs = require("../types/typedefs");
const dtsBundle = require("../utils/dtsbundle");
const WpwBaseTaskPlugin = require("./basetask");
const { resolve, join, dirname } = require("path");
const { rm, unlink, readFile, access } = require("fs/promises");
const { apply, isObject, clone } = require("@spmeesseman/type-utils");
const { findFiles, relativePath, resolvePath } = require("../utils");


/**
 * @extends WpwBaseTaskPlugin
 */
class WpwTypesPlugin extends WpwBaseTaskPlugin
{
    /**
     * @param {typedefs.WpwPluginOptions} options
     */
	constructor(options)
	{
		super(apply({ taskHandler: "buildTypes", hooks: {
			cleanTypesTemporaryFiles: WpwTypesPlugin.compilerHookConfig("done", "cleanTempFiles", true, true)
		} }, options));
        this.buildOptions = /** @type {typedefs.WpwBuildOptionsConfig<"types">} */(this.buildOptions); // reset for typings
	}


	/**
     * @override
     */
	static create =  WpwTypesPlugin.wrap.bind(this);


	/**
     * @override
     * @param {typedefs.WpwBuildOptionsConfig<"types">} config
     */
	static validate = (config) => config.mode === "plugin";


	/**
	 * @protected
	 * @param {typedefs.WebpackCompilationAssets} _assets
	 */
	async buildTypes(_assets)
	{
		let rc;
		const build = this.build,
			  source = build.source,
			  logger = this.logger,
			  basePath = build.getBasePath(),
			  method = this.buildOptions.method,
			  tscConfig = clone(source.config),
			  compilerOptions = tscConfig.compilerOptions,
			  srcDir = build.getSrcPath(),
			  distDirRel = build.getDistPath({ rel: true, psx: true, fallback: true }),
			  outputDirRel = compilerOptions.declarationDir ?? distDirRel;

		logger.write("start types build", 1);
		logger.value("   method", method, 2);
		logger.value("   mode", this.buildOptions.mode, 2);
		logger.value("   entry", this.buildOptions.entry, 2);
		logger.value("   base path", basePath, 3);
		logger.value("   source path", srcDir, 3);
		logger.value("   dist directory", distDirRel, 2);
		logger.value("   output directory", outputDirRel, 2);
		logger.value("   build options", this.buildOptions, 4);

		const options = this.compilerOptions();
		this.maybeDeleteTsBuildInfoFile(options.tsBuildInfoFile, outputDirRel);

		if (method === "program")
		{
			const result = build.source.emit(options, true);
			rc = !result.emitSkipped && result.diagnostics.length === 0 ? 0 : -1;
			if (rc !== 0)
			{
				build.addMessage({
					pad: "   ",
					compilation: this.compilation,
					code: WpwError.Code.ERROR_TYPES_FAILED,
					message: "check diagnostics returned by program in log output"
				});
			}
		}
		else if (method === "tsc")
		{
			rc = await this.execTsBuild(source.configFile, this.configToArgs(options), this.virtualBuildPath);
		}
		else
		{   build.addMessage({
				pad: "   ",
				compilation: this.compilation,
				code: WpwError.Code.ERROR_TYPES_FAILED,
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
				await dtsBundle(this.build, this.compilation, this.optionsKey);
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
			  declarationDir = this.virtualBuildPath;

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

		if (!configuredOptions.incremental && !configuredOptions.composite)
		{
			programOptions.incremental = true;
		}

		const bundleOptions = this.buildOptions.bundle;
		if (bundleOptions && isObject(bundleOptions) && bundleOptions.bundler === "tsc")
		{
			programOptions.declarationDir = undefined;
			programOptions.outFile = join(declarationDir, build.name); // don't specify an extension
		}

		return programOptions;
	};


	/**
	 * @private
	 */
	async emit()
	{
		const files = await findFiles("**/*.d.ts", { cwd: this.virtualBuildPath, absolute: true });
		for (const file of files)
		{
			const assetPath = relativePath(this.virtualBuildPath, file, { psx: true }),
				  dirPathRealAbs = dirname(file),
				  data = await readFile(file),
				  source = new this.compiler.webpack.sources.RawSource(data);
			const info = /** @type {typedefs.WebpackAssetInfo} */(
			{
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
					code: WpwError.Code.WARNING_GENERAL,
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
				code: WpwError.Code.ERROR_TYPES_FAILED,
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
				code: WpwError.Code.ERROR_TYPES_FAILED,
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
				code: WpwError.Code.ERROR_TYPES_FAILED,
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
