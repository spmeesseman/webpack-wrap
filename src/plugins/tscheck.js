/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/tscheck.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const WpwPlugin = require("./base");
const typedefs = require("../types/typedefs");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

/** @typedef {import("fork-ts-checker-webpack-plugin/lib/files-change").FilesChange} TsCheckFilesChange */
/** @typedef {import("fork-ts-checker-webpack-plugin/lib/issue/issue").Issue} TsCheckIssue*/


/**
 * @extends WpwPlugin
 */
class WpBuildTsCheckPlugin extends WpwPlugin
{
    /** @type {Exclude<typedefs.WpwBuildOptions["tscheck"], undefined>} @override */
    buildOptions;


    /**
     * Called by webpack runtime to initialize this plugin
     * @override
     * @param {typedefs.WebpackCompiler} compiler the compiler instance
     */
    apply(compiler)
    {
		this.onApply(compiler);
		const logLevel = this.app.logger.level;
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
	 * @returns {typedefs.WebpackPluginInstance}
	 */
	getVendorPlugin = () =>
	{
		/** @type {[ string, "write-dts" | "write-tsbuildinfo" | "readonly" | "write-dts" , string? ]} */
		let tsParams;
		const app = this.app,
			  cnfig = app.build.source.config,
			  configPath = /** @type {string} */(cnfig.path);

		if (app.build.type === "tests")
		{
			tsParams = [ configPath, "write-tsbuildinfo" ];
		}
		else if (app.build.type === "types")
		{
			tsParams = [ configPath, "write-dts" ];
		}
		else {
			tsParams = [ configPath, cnfig.options.compilerOptions.declaration === true ? "write-dts" : "readonly" ];
		}

		app.logger.write("get vendor plugin");
		app.logger.write(`   add config file '${tsParams[0]}' to tschecker [${tsParams[1]}][build=${!!tsParams[2]}]`, 2);
		app.logger.write("   create 'fork-ts-checker-webpack-plugin' instance");

		return new ForkTsCheckerWebpackPlugin(
		{
			async: false,
			formatter: "basic",
			typescript: {
				build: !!tsParams[2],
				mode: tsParams[1],
				configFile: tsParams[0]
			},
			// logger: "webpack-infrastructure"
			logger: {
				error: app.logger.error,
				log: app.logger.write
			}
		});
	};


	/**
	 * @private
	 */
	tsForkCheckerError = () => { this.logger.error("tschecker error"); }


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
	}


	/**
	 * @private
	 */
	tsForkCheckerWaiting = () => { this.logger.start("tsforkchecker waiting for issues"); }

}


/**
 * @param {typedefs.WpBuildApp} app
 * @returns {WpBuildTsCheckPlugin | undefined}
 */
const tscheck = (app) => WpwPlugin.wrap(WpBuildTsCheckPlugin, app, "tscheck");


module.exports = tscheck;
