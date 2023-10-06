/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file src/plugins/clean.js
 * @version 0.0.1
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const WpwPlugin = require("./base");
const { existsSync } = require("fs");
const { join, posix } = require("path");
const typedefs = require("../types/typedefs");
const { apply } = require("@spmeesseman/type-utils");
const { readdir, unlink, rmdir } = require("fs/promises");
const { WpwBuildOptionsKeys } = require("../types/constants");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const { existsAsync, resolvePath, findFiles, forwardSlash, relativePath } = require("../utils");


/**
 * @extends WpwPlugin
 */
class WpwCleanPlugin extends WpwPlugin
{
    /**
     * @param {typedefs.WpwPluginOptions} options
     */
	constructor(options)
	{
		super(options);
        this.buildOptions = /** @type {typedefs.WpwBuildOptionsConfig<"clean">} */(this.buildOptions); // reset for typings
	}


	/**
     * @override
     */
	static create = WpwCleanPlugin.wrap.bind(this);


    /**
     * @override
     */
    onApply()
    {
		const options = /** @type {typedefs.WpwPluginTapOptions} */({});

		if (this.buildOptions.enabled)
		{
			if (this.buildOptions.stale || this.buildOptions.full)
			{
				options.cleanStaleAssets = {
					async: true,
					hook: "done",
					callback: this.staleAssets.bind(this)
				};
			}

			if (this.buildOptions.full)
			{
				apply(options, {
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
			}

			if (this.buildOptions.cache)
			{
				options.cleanWebpackCache = {
					async: true,
					hook: "beforeRun",
					callback: this.webpackCache.bind(this)
				};
			}

			return options;
		}
	}


	/**
     * @param {typedefs.WebpackCompilation} _compilation
	 * @returns {Promise<void>}
     */
	async buildAssets(_compilation)
	{
		const distPath = this.build.getDistPath(),
			  compilerOptions = this.build.source.config.compilerOptions;
		this.logger.write("check for existing assets", 1);
		if (await existsAsync(distPath))
		{
			const files = (await readdir(distPath)).filter(this.isOutputFile, this);
			for (const file of files)
			{
				this.logger.value("   delete asset", file, 1);
				await unlink(join(distPath, file));
			}
			return this.rmdirIfEmpty(distPath);
		}
		if (compilerOptions.outDir && compilerOptions.outDir !== distPath)
		{
			const configOutDir = resolvePath(this.build.getContextPath(), compilerOptions.outDir);
			if (await existsAsync(configOutDir))
			{
				const files = (await readdir(configOutDir)).filter(this.isOutputFile, this);
				for (const file of files) {
					this.logger.value("   delete asset", file, 1);
					await unlink(join(configOutDir, file));
				}
				return this.rmdirIfEmpty(configOutDir);
			}
		}
	}


	/**
     * @param {typedefs.WebpackCompilation} _compilation
	 * @returns {Promise<void>}
     */
	async buildCaches(_compilation)
	{
		const compilerOptions = this.build.source.config.compilerOptions,
			  buildInfoFile = compilerOptions.tsBuildInfoFile;
		this.logger.write("check for existing caches", 1);
		if (buildInfoFile && await existsAsync(buildInfoFile))
		{
			await unlink(buildInfoFile);
		}
		if (await existsAsync(this.build.global.cacheDir))
		{
			const buildOptions = this.build.options;
			await Promise.all([
				WpwBuildOptionsKeys
				.filter((p => !!buildOptions[p]))
				.map(p => join(this.global.cacheDir, this.cacheFilename(p)))
				.filter(path => existsSync(path))
				.map(path => unlink(path))
			]);
		}
	}



	/**
	 * @override
	 * @returns {typedefs.WebpackPluginInstance | undefined}
	 */
	getVendorPlugin()
	{
		const contextPath = this.wpc.context;
		/** @type {typedefs.CleanWebpackPluginOptions} */
		let options;
		if (this.buildOptions.full)
		{
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
		}
	}


	/**
	 * @param {string} path
	 * @returns {boolean}
	 */
    isOutputFile(path)
	{
		path = forwardSlash(path).replace(".LICENSE", "");
		return !!this.compilation.getAssets().find(a => a.name === this.fileNameStrip(path)) ||
			   !!Object.keys(this.build.wpc.entry).includes(this.fileNameStrip(path, true));
	}


	/**
     * @param {string} dir
	 * @returns {Promise<void>}
     */
	async rmdirIfEmpty(dir)
	{
		if (await existsAsync(dir) && (await readdir(dir)).length === 0) {
			return rmdir(dir);
		}
	}


    /**
	 * Removes stale hashed assets (un-hashed assets are not included)
     * @param {typedefs.WebpackStats} stats
	 * @returns {Promise<void>}
     */
	async staleAssets(stats)
	{
		let deleteCount = 0;
		const build = this.build,
			  logger = this.logger,
			  assets = stats.compilation.getAssets(),
			  cwd = build.getDistPath();
		logger.value("check for stale assets in output directory", cwd, 1);
		logger.value("   current compilation asset count", assets.length, 2);
		this.printAssets(assets);
		if (await existsAsync(cwd))
		{
			const ignore = build.buildConfigs.filter(c => !!c.paths.dist && c.name !== this.name && c.paths.dist !== cwd)
										     .map(c => relativePath(cwd, c.paths.dist));
			const files = (await findFiles("*", { cwd, ignore }))
						  .filter(f => this.isOutputFile(f) && !assets.find(a => a.name === forwardSlash(f)));
			for (const file of files)
			{
				logger.value("   delete stale asset", file, 1);
				await unlink(join(cwd, file));
				++deleteCount;
			}
			await this.rmdirIfEmpty(cwd);
		}
		logger.value(`deleted ${deleteCount} stale asset(s)`, 1);
	}


	/**
     * @param {typedefs.WebpackCompilation} _compilation the compiler instance
	 * @returns {Promise<void>}
     */
	async webpackCache(_compilation)
	{
		if (this.build.options.cache)
		{
			const wpCacheDir = /** @type {typedefs.WebpackFileCacheOptions} */(this.wpc.cache).cacheDirectory;
			if (wpCacheDir && await existsAsync(wpCacheDir)) {
				return rmdir(wpCacheDir);
			}
		}
	}

}


module.exports = WpwCleanPlugin.create;
