/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file src/plugins/tscheck.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const WpwPlugin = require("./base");
const { resolve } = require("path");
const { existsSync } = require("fs");
const typedefs = require("../types/typedefs");
const { dtsBundle, merge, isString } = require("../utils");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

/** @typedef {ForkTsCheckerOptions["typescript"]} ForkTsCheckerTypescriptOptions */
/** @typedef {import("fork-ts-checker-webpack-plugin/lib/issue/issue").Issue} TsCheckIssue*/
/** @typedef {import("fork-ts-checker-webpack-plugin/lib/files-change").FilesChange} TsCheckFilesChange */
/** @typedef {import("fork-ts-checker-webpack-plugin/lib/plugin-options").ForkTsCheckerWebpackPluginOptions} ForkTsCheckerOptions */


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
     * Called by webpack runtime to initialize this plugin
     * @override
     * @param {typedefs.WebpackCompiler} compiler the compiler instance
     */
    apply(compiler)
    {
		const distPath = this.build.getDistPath({ build: "types" }),
			  entry = this.build.wpc.entry[this.build.name] || this.build.wpc.entry.index,
			  entryFile = resolve(distPath, isString(entry) ? entry : (entry.import ? entry.import : (entry[0] ?? "")));

		if (this.typesBuildOptions?.bundle)
		{
			if (entryFile && existsSync(entryFile) && this.build.isOnlyBuild)
			{
				this.onApply(compiler,
				{
					bundleDtsFiles: {
						async: true,
						hook: "compilation",
						stage: "DERIVED",
						statsProperty: "tsbundle",
						callback: () => dtsBundle(this.build, this.compilation, "tsbundle")
					}
				});
			}
			else
			{
				this.onApply(compiler,
				{
					bundleDtsFiles: {
						async: true,
						hook: "afterEmit",
						statsProperty: "tsbundle",
						callback: () => dtsBundle(this.build, this.compilation, "tsbundle")
					}
				});
			}
		}
		else {
			this.onApply(compiler);
		}

		const logLevel = this.build.logger.level;
		if (logLevel > 1)
		{
			const tsForkCheckerHooks = ForkTsCheckerWebpackPlugin.getCompilerHooks(compiler);
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
	}


	/**
     * @override
     * @param {typedefs.WpwBuild} build
	 * @returns {WpwTsCheckPlugin | undefined}
     */
	static create = (build) => WpwTsCheckPlugin.wrap(this, build, "tscheck");


	/**
	 * @override
	 * @returns {typedefs.WebpackPluginInstance}
	 */
	getVendorPlugin = () =>
	{
		const build = this.build;
		/** @type {ForkTsCheckerTypescriptOptions} */
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

		return new ForkTsCheckerWebpackPlugin(/** @type {ForkTsCheckerOptions} */(
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
	 * @param {TsCheckIssue[]} issues
	 * @returns {TsCheckIssue[]}
	 */
	tsForkCheckerIssues = (issues) =>
	{
		this.logger.start("tsforkchecker filter issues");
		return issues.filter(i => i.severity === "error");
	};


	/**
	 * @private
	 * @param {TsCheckFilesChange} filesChange
	 * @param {typedefs.WebpackCompilation} compilation
	 * @returns {Promise<TsCheckFilesChange>}
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
