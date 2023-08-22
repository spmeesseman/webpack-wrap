/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/tsforker.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const WpBuildPlugin = require("./base");
const typedefs = require("../types/typedefs");
const { apply, WpBuildError } = require("../utils");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");



class WpBuildTsForkerPlugin extends WpBuildPlugin
{
    /**
     * @function Called by webpack runtime to initialize this plugin
     * @override
     * @member apply
     * @param {typedefs.WebpackCompiler} compiler the compiler instance
     * @returns {void}
     */
    apply(compiler)
    {
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
	 * @returns {typedefs.WpBuildPluginVendorOptions[]}
	 * @throws {WpBuildError}
	 */
	getOptions = () =>
	{
		const app = this.app;
		const plugins = [];

		if (app.tsConfig)
		{
			const tsConfigParams = [],
			  	  tsConfig = app.tsConfig,
				  tsConfigPath = tsConfig.path;

			if (app.build.type === "tests")
			{
				tsConfigParams.push(tsConfigPath, "write-tsbuildinfo");
			}
			else if (app.build.type === "types")
			{
				tsConfigParams.push(tsConfigPath, "write-dts");
			}
			else {
				tsConfigParams.push(tsConfigPath, tsConfig.json.compilerOptions.declaration === true ? "write-dts" : "readonly");
			}

			app.logger.write(`add tsconfig file '${tsConfigParams[0]}' to tsforkchecker (build=${!!tsConfigParams[2]})`, 2);
			plugins.push({
				ctor: ForkTsCheckerWebpackPlugin,
				options:
				{
					async: false,
					formatter: "basic",
					typescript: {
						build: !!tsConfigParams[2],
						mode: tsConfigParams[1],
						configFile: tsConfigParams[0]
					},
					logger: app.logger.level < 5 ? undefined : {
						error: app.logger.error,
						/** @param {string} msg */
						log: (msg) => app.logger.write("bold(tsforkchecker): " + msg)
					}
				}
			});
		}
		else {
			throw WpBuildError.get(
				`Could not run ts fork-checker, no associated tsconfig file for '${app.mode}' environment`,
				"plugin/tsforker.js"
			);
		}

		return plugins;
	};


	/**
	 * @function
	 * @private
	 */
	tsForkCheckerError = () => this.logger.error("tsforkchecker error");


	/**
	 * @function
	 * @private
	 * @param {import("fork-ts-checker-webpack-plugin/lib/issue/issue").Issue[]} issues
	 */
	tsForkCheckerIssues = (issues) =>
{
		this.logger.start("tsforkchecker filter issues");
		return issues.filter(i => i.severity === "error");
	};


	/**
	 * @function
	 * @private
	 */
	tsForkCheckerStart = () => this.logger.start("tsforkchecker start");


	/**
	 * @function
	 * @private
	 */
	tsForkCheckerWaiting = () => this.logger.start("tsforkchecker waiting for issues");

}


/**
 * Returns a `WpBuildTsForkerPlugin` instance if appropriate for the current build
 * environment. Can be enabled/disable in .wpconfigrc.json by setting the `plugins.tsforker`
 * property to a boolean value of  `true` or `false`
 * @function
 * @module
 * @param {typedefs.WpBuildApp} app
 * @returns {ForkTsCheckerWebpackPlugin | undefined}
 */
const tscheck = (app) => app.build.plugins.tscheck ? (new WpBuildTsForkerPlugin({ app }).getPlugins()[0]) : undefined;


module.exports = tscheck;
