/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file src/plugins/tscheck.js
 * @version 0.0.1
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const WpwPlugin = require("./base");
const { resolve } = require("path");
const { existsSync } = require("fs");
const { unlink } = require("fs/promises");
const { findFiles } = require("../utils");
const typedefs = require("../types/typedefs");
const dtsBundle = require("../utils/dtsbundle");
const { merge, isString } = require("@spmeesseman/type-utils");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");


/**
 * @extends WpwPlugin
 */
class WpwTsCheckPlugin extends WpwPlugin
{
    /**
     * @param {typedefs.WpwPluginOptions} options Plugin options to be applied
     */
	constructor(options)
	{
		super(options);
        this.typesBuildOptions = /** @type {typedefs.WpwBuildOptionsConfig<"types">} */(this.build.options.types);
	}


	/**
     * @override
     */
	static create = WpwPlugin.wrap.bind(this);


    /**
     * @override
     * @returns {typedefs.WpwPluginTapOptions | undefined}
     */
    onApply()
    {
		/** @type {typedefs.WpwPluginTapOptions | undefined} */
		let config;
		const distPath = this.build.getDistPath({ build: "types" }),
			  entry = this.build.wpc.entry[this.build.name] || this.build.wpc.entry.index,
			  entryFile = resolve(distPath, isString(entry) ? entry : (entry.import ? entry.import : (entry[0] ?? "")));

		if (this.typesBuildOptions && this.typesBuildOptions.bundle && this.typesBuildOptions.mode === "tscheck")
		{
			const applyConfig = /** @type {typedefs.WpwPluginTapOptions} */({});

			if (entryFile && existsSync(entryFile) && this.build.isOnlyBuild)
			{
				applyConfig.bundleDtsFiles = {
					async: true,
					hook: "compilation",
					stage: "DERIVED",
					statsProperty: "tsbundle",
					callback: () => dtsBundle(this.build, this.compilation, "tsbundle")
				};
			}
			else
			{
				applyConfig.bundleDtsFiles = {
					async: true,
					hook: "afterEmit",
					statsProperty: "tsbundle",
					callback: () => dtsBundle(this.build, this.compilation, "tsbundle")
				};
			}

			applyConfig.cleanDtsTempFiles = {
				async: true,
				hook: "done",
				callback: this.cleanTempFiles.bind(this)
			};

			config = applyConfig;
		}

		const logLevel = this.build.logger.level;
		if (logLevel > 1)
		{
			const tsForkCheckerHooks = ForkTsCheckerWebpackPlugin.getCompilerHooks(this.compiler);
			tsForkCheckerHooks.error.tap(this.name, this.tsForkCheckerError.bind(this));
			tsForkCheckerHooks.waiting.tap(this.name, this.tsForkCheckerWaiting.bind(this));
			if (logLevel >= 2)
			{
				tsForkCheckerHooks.start.tapPromise(this.name, this.tsForkCheckerStart.bind(this));
				if (logLevel >= 3)
				{
					tsForkCheckerHooks.issues.tap(this.name, this.tsForkCheckerIssues.bind(this));
				}
			}
		}

		return config;
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
	 * @override
	 * @returns {typedefs.WebpackPluginInstance}
	 */
	getVendorPlugin = () =>
	{
		const build = this.build;
		/** @type {typedefs.ForkTsCheckerTypescriptOptions} */
		const tsOptions = {
			build: false,
			configFile: build.source.configFile.path,
			mode: "readonly",
			diagnosticOptions: {
				syntactic: true, semantic: true, declaration: false, global: false
			}
		};

		if (build.type === "tests")
		{
			merge(tsOptions,
			{
				mode: "write-tsbuildinfo",
				diagnosticOptions: {
					global: true
				}
			});
		}
		else if (build.type === "types")
		{
			merge(tsOptions,
			{
				mode: "write-dts",
				diagnosticOptions: {
					declaration: true
				}
			});
		}

		build.logger.write("get vendor plugin");
		build.logger.write(`   add config file '${tsOptions.configFile}' to tschecker [${tsOptions.mode}][build=${!!tsOptions.build}]`, 2);
		build.logger.write("   create 'fork-ts-checker-webpack-plugin' instance");

		return new ForkTsCheckerWebpackPlugin(/** @type {typedefs.ForkTsCheckerOptions} */(
		{
			async: false,
			formatter: "basic",
			typescript: tsOptions,
			// logger: "webpack-infrastructure"
			logger: {
				error: build.logger.error,
				log: build.logger.write
			}
		}));
	};


	/**
	 * @private
	 */
	tsForkCheckerError = () => { this.logger.error("tschecker error"); };


	/**
	 * @private
	 * @param {typedefs.TsCheckIssue[]} issues
	 * @returns {typedefs.TsCheckIssue[]}
	 */
	tsForkCheckerIssues = (issues) =>
	{
		this.logger.start("tsforkchecker filter issues");
		return issues.filter(i => i.severity === "error");
	};


	/**
	 * @private
	 * @param {typedefs.TsCheckFilesChange} filesChange
	 * @param {typedefs.WebpackCompilation} compilation
	 * @returns {Promise<typedefs.TsCheckFilesChange>}
	 */
	tsForkCheckerStart = async (filesChange, compilation) =>
	{
		this.compilation = compilation;
		this.logger.start("tsforkchecker start");
		if (this.logger.level >= 2)
		{
			if (filesChange.changedFiles) {
				this.logger.write(`changed files (#: ${filesChange.changedFiles.length})`, 2);
				filesChange.changedFiles.forEach(f => { this.logger.write(f, 3, "   "); });
			}
			if (filesChange.deletedFiles) {
				this.logger.write(`deleted files (#: ${filesChange.deletedFiles.length})`, 2);
				filesChange.deletedFiles.forEach(f => { this.logger.write(f, 3, "   "); });
			}
		}
		return filesChange;
	};


	/**
	 * @private
	 */
	tsForkCheckerWaiting = () => { this.logger.start("tsforkchecker waiting for issues"); };

}


module.exports = WpwTsCheckPlugin.create;
