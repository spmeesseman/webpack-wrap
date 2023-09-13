/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/clean.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const WpwPlugin = require("./base");
const { existsSync } = require("fs");
const { join, posix } = require("path");
const typedefs = require("../types/typedefs");
const { readdir, unlink, rmdir } = require("fs/promises");
const { WpwBuildOptionsKeys } = require("../types/constants");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const { existsAsync, apply, resolvePath } = require("../utils");

/** @typedef {import("clean-webpack-plugin").Options} CleanWebpackPluginOptions */


/**
 * @extends WpwPlugin
 */
class WpBuildCleanPlugin extends WpwPlugin
{
    /**
     * @param {typedefs.WpwPluginOptions} options Plugin options to be applied
     */
	constructor(options) { super(options); }

    /**
     * Called by webpack runtime to initialize this plugin
     * @override
     * @member apply
     * @param {typedefs.WebpackCompiler} compiler the compiler instance
     * @returns {void}
     */
    apply(compiler)
    {
		const options = /** @type {typedefs.WpBuildPluginTapOptions} */(
		{
			cleanStaleAssets: {
				async: true,
				hook: "done",
				callback: this.staleAssets.bind(this)
			},
			cleanBuildAssets: {
				async: true,
				hook: "emit",
				callback: this.buildAssets.bind(this)
			},
			cleanBuildCaches: {
				async: true,
				hook: "emit",
				callback: this.buildCaches.bind(this)
			}
		});

		if (this.build.options.cache)
		{
			apply(options, {
				cleanWebpackCache: {
					async: true,
					hook: "beforeRun",
					callback: this.webpackCache.bind(this)
				}
			});
		}

		this.onApply(compiler, options);
	}


	/**
     * @override
     * @param {typedefs.WpwBuild} build
	 * @returns {WpBuildCleanPlugin | undefined}
     */
	static create = (build) => WpBuildCleanPlugin.wrap(this, build, "copy");


	/**
     * @param {typedefs.WebpackCompilation} compilation the compiler instance
	 * @returns {Promise<void>}
     */
	async buildAssets(compilation)
	{
		this.compilation = compilation;
		const distPath = this.build.getDistPath(),
			  compilerOptions = this.build.source.config.options.compilerOptions;
		if (await existsAsync(distPath))
		{
			const files = (await readdir(distPath)).filter(p => this.fileNameHashRegex().test(p));
			for (const file of files) {
				await unlink(join(distPath, file));
			}
			return this.rmdirIfEmpty(distPath);
		}
		if (compilerOptions.outDir)
		{
			const configOutDir = resolvePath(this.build.getContextPath(), compilerOptions.outDir);
			if (await existsAsync(configOutDir))
			{
				const files = (await readdir(configOutDir)).filter(p => this.fileNameHashRegex().test(p));
				for (const file of files) {
					await unlink(join(configOutDir, file));
				}
				return this.rmdirIfEmpty(configOutDir);
			}
		}
	}


	/**
     * @param {typedefs.WebpackCompilation} compilation the compiler instance
	 * @returns {Promise<void>}
     */
	async buildCaches(compilation)
	{
		this.compilation = compilation;
		const compilerOptions = this.build.source.config.options.compilerOptions,
			  buildInfoFile = compilerOptions.tsBuildInfoFile;
		if (buildInfoFile && await existsAsync(buildInfoFile))
		{
			await unlink(buildInfoFile);
		}
		if (await existsAsync(this.build.global.cacheDir))
		{
			const buildOptions = this.build.options;
			await Promise.all([
				WpwBuildOptionsKeys
				.filter((plugin => !!buildOptions[plugin]))
				.map(
					(plugin) => join(
						this.global.cacheDir, WpwPlugin.cacheFilename(this.build.mode, plugin)
					)
				)
				.filter(path => existsSync(path))
				.map(path => unlink(path))
			]);
		}
	}


	/**
     * @param {string} dir the compiler instance
	 * @returns {Promise<void>}
     */
	async rmdirIfEmpty(dir)
	{
		if (await existsAsync(dir) && (await readdir(dir)).length === 0) {
			return rmdir(dir);
		}
	}


    /**
     * @param {typedefs.WebpackStats} stats the compiler instance
	 * @returns {Promise<void>}
     */
	async staleAssets(stats)
	{
		const distPath = this.build.getDistPath();
		if (await existsAsync(distPath))
		{
			const files = (await readdir(distPath)).filter(p => this.fileNameHashRegex().test(p));
			for (const file of files)
			{
				const assets = stats.compilation.getAssets(),
					  clean = !assets.find(a => a.name === file);
				if (clean) {
					await unlink(join(distPath, file));
				}
			}
			return this.rmdirIfEmpty(distPath);
		}
	}

	/**
     * @param {typedefs.WebpackCompilation} compilation the compiler instance
	 * @returns {Promise<void>}
     */
	async webpackCache(compilation)
	{
		if (this.build.options.cache)
		{
			const wpCacheDir = /** @type {typedefs.WebpackFileCacheOptions} */(this.wpc.cache).cacheDirectory;
			if (wpCacheDir && await existsAsync(wpCacheDir)) {
				return rmdir(wpCacheDir);
			}
		}
	}


	/**
	 * @override
	 * @returns {typedefs.WebpackPluginInstance}
	 */
	getVendorPlugin()
	{
		const contextPath = this.wpc.context,
			  outputPath = this.wpc.output.path;
		/** @type {CleanWebpackPluginOptions} */
		let options;
		if (this.build.type === "webapp")
		{
			options = {
				dry: false,
				verbose: this.logger.level >= 3,
				cleanOnceBeforeBuildPatterns: [
					posix.join(contextPath, "css", "**"),
					posix.join(contextPath, "js", "**"),
					posix.join(contextPath, "page", "**")
				]
			};
		}
		else {
			options = {
				dry: false,
				cleanStaleWebpackAssets: true,
				verbose: this.logger.level >= 3,
				dangerouslyAllowCleanPatternsOutsideProject: true,
				cleanOnceBeforeBuildPatterns: [
					`${this.build.paths.temp}/**`
				]
			};
		}
		return new CleanWebpackPlugin(options);
	};

}


module.exports = WpBuildCleanPlugin.create;
