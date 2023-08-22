/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/clean.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const path = require("path");
const WpBuildPlugin = require("./base");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const { readdirSync, unlinkSync, existsSync } = require("fs");
const { join } = require("path");
const { apply } = require("../utils");

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */
/** @typedef {import("../../types").WebpackStats} WebpackStats */
/** @typedef {import("../../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("./base").WpBuildPluginOptions} WpBuildPluginOptions */
/** @typedef {import("../../types").WebpackPluginInstance} WebpackPluginInstance */
/** @typedef {import("../../types").WpBuildPluginVendorOptions} WpBuildPluginVendorOptions */


class WpBuildCleanPlugin extends WpBuildPlugin
{
    /**
     * @class WpBuildCleanPlugin
     * @param {WpBuildPluginOptions} options Plugin options to be applied
     */
	constructor(options)
    {
        super(apply(options, { plugins: WpBuildCleanPlugin.vendorPlugins(options.app) }));
    }


    /**
     * @function Called by webpack runtime to initialize this plugin
     * @override
     * @member apply
     * @param {WebpackCompiler} compiler the compiler instance
     * @returns {void}
     */
    apply(compiler)
    {
		this.onApply(compiler,
		{
			cleanStaleAssets: {
				hook: "done",
				callback: this.staleAssets.bind(this)
			}
		});
	}


    /**
     * @function
     * @param {WebpackStats} stats the compiler instance
     * @returns {void}
     */
	staleAssets(stats)
	{
		// const distPath = this.app.getDistPath();
		// if (existsSync(distPath))
		// {
		// 	readdirSync(distPath).filter(p => this.fileNameHashRegex().test(p)).forEach((file) =>
		// 	{
		// 		const assets = stats.compilation.getAssets(),
		// 			  clean = !assets.find(a => a.name === file);
		// 		if (clean) {
		// 			unlinkSync(join(distPath, file));
		// 		}
		// 	});
		// }
	}


	/**
	 * @function
	 * @private
	 * @param {WpBuildApp} app
	 * @returns {WpBuildPluginVendorOptions[]}
	 */
	static vendorPlugins = (app) =>
	{
		const basePath = app.getContextPath();
		return [{
			ctor: CleanWebpackPlugin,
			options: app.build.type === "webapp" ? {
				dry: false,
				cleanOnceBeforeBuildPatterns: [
					path.posix.join(basePath, "css", "**"),
					path.posix.join(basePath, "js", "**"),
					path.posix.join(basePath, "page", "**")
				]
			} : {
				dry: false,
				cleanStaleWebpackAssets: true,
				dangerouslyAllowCleanPatternsOutsideProject: true,
				cleanOnceBeforeBuildPatterns: [
					`${app.build.paths.temp}/**`
				]
			}
		}];
	};

}


/**
 * @param {WpBuildApp} app
 * @returns {(WpBuildCleanPlugin | CleanWebpackPlugin)[]}
 */
const clean = (app) => app.args.clean && app.build.type !== "tests" ? new WpBuildCleanPlugin({ app }).getPlugins() : [];


module.exports = clean;
