/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/tsforker.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const { apply } = require("../utils");
const WpBuildPlugin = require("./base");
const typedefs = require("../types/typedefs");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

/** @typedef {import("fork-ts-checker-webpack-plugin/lib/files-change").FilesChange} TsCheckFilesChange */
/** @typedef {import("fork-ts-checker-webpack-plugin/lib/issue/issue").Issue} TsCheckIssue*/

class WpBuildTsForkerPlugin extends WpBuildPlugin
{
    // /**
    //  * @class WpBuildTsForkerPlugin
    //  * @param {typedefs.WpBuildPluginOptions} options Plugin options to be applied
    //  */
	// constructor(options)
    // {
    //     super(apply(options, { wrapVendorPlugin: true }));
    // }


    /**
     * @function Called by webpack runtime to initialize this plugin
     * @override
     * @member apply
     * @param {typedefs.WebpackCompiler} compiler the compiler instance
     * @returns {void}
     */
    apply(compiler)
    {
		this.onApply(compiler);
		const logLevel = this.app.logger.level;
		if (logLevel > 1)
		{
			const tsForkCheckerHooks = ForkTsCheckerWebpackPlugin.getCompilerHooks(compiler);
			tsForkCheckerHooks.error.tap(this.name, this.tsForkCheckerError.bind(this));
			if (logLevel >= 2)
			{
				tsForkCheckerHooks.start.tap(this.name, this.tsForkCheckerStart.bind(this));
				if (logLevel >= 3)
				{
					tsForkCheckerHooks.waiting.tap(this.name, this.tsForkCheckerWaiting.bind(this));
					if (logLevel >= 4) {
						tsForkCheckerHooks.issues.tap(this.name, this.tsForkCheckerIssues.bind(this));
					}
				}
			}
		}
	}


	/**
	 * @function
	 * @protected
	 * @override
	 * @returns {typedefs.WpBuildPluginVendorOptions}
	 */
	getOptions = () =>
	{
		const app = this.app,
			  tsParams = [],
			  tsConfig = app.build.source.config,
			  tsConfigPath = tsConfig.path;

		if (app.build.type === "tests")
		{
			tsParams.push(tsConfigPath, "write-tsbuildinfo");
		}
		else if (app.build.type === "types")
		{
			tsParams.push(tsConfigPath, "write-dts");
		}
		else {
			tsParams.push(tsConfigPath, tsConfig.options.compilerOptions.declaration === true ? "write-dts" : "readonly");
		}

		app.logger.write(`add config file '${tsParams[0]}' to tsforkcheck [${tsParams[1]}][build=${!!tsParams[2]}]`, 2);

		return {
			ctor: ForkTsCheckerWebpackPlugin,
			options:
			{
				async: false,
				formatter: "basic",
				typescript: {
					build: !!tsParams[2],
					mode: tsParams[1],
					configFile: tsParams[0]
				},
				logger: app.logger.level < 5 ? undefined : {
					error: app.logger.error,
					log: (/** @type {string} msg */msg) => app.logger.write("bold(tsforkchecker): " + msg)
				}
			}
		};
	};


	/**
	 * @function
	 * @private
	 */
	tsForkCheckerError = () => { this.logger.error("tsforkchecker error"); }


	/**
	 * @function
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
	 * @function
	 * @private
	 * @param {TsCheckFilesChange} filesChange
	 * @param {typedefs.WebpackCompilation} compilation
	 * @returns {TsCheckFilesChange}
	 */
	tsForkCheckerStart = (filesChange, compilation) =>
	{
		this.compilation = compilation;
		this.logger.start("tsforkchecker start");
		return filesChange;
	}


	/**
	 * @function
	 * @private
	 */
	tsForkCheckerWaiting = () => { this.logger.start("tsforkchecker waiting for issues"); }

}


/**
 * @function
 * @module
 * @param {typedefs.WpBuildApp} app
 * @returns {WpBuildTsForkerPlugin | undefined}
 */
const tscheck = (app) => WpBuildPlugin.wrap(app, WpBuildTsForkerPlugin, app.build.plugins.tscheck);


module.exports = tscheck;
