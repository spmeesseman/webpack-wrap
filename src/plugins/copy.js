/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/copy.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

 const WpwPlugin = require("./base");
const { existsSync } = require("fs");
const { apply } = require("../utils");
const { join, posix } = require("path");
const WpBuildApp = require("../core/app");
const typedefs = require("../types/typedefs");
const CopyPlugin = require("copy-webpack-plugin");


/**
 * @extends WpwPlugin
 */
class WpBuildCopyPlugin extends WpwPlugin
{
    /** @type {typedefs.WpwBuildOptionsConfig<"copy">} @private */
    buildOptions;


	/**
	 * @param {typedefs.WpwPluginOptions} options Plugin options to be applied
	 */
	constructor(options) { super(options); }


    /**
     * Called by webpack runtime to initialize this plugin
     * @override
     * @param {typedefs.WebpackCompiler} compiler the compiler instance
     */
    apply(compiler)
    {
		if (this.buildOptions.entriesNoHash)
		{
			this.onApply(compiler,
			{
				copyModulesWithoutFilenameHash: {
					hook: "compilation",
					stage: "ADDITIONAL",
					statsProperty: "copied",
					hookCompilation: "processAssets",
					callback: this.copyEntryModulesNoHash.bind(this)
				},
				attachSourceMapsToCopiedModules: {
					hook: "compilation",
					stage: "DEV_TOOLING",
					hookCompilation: "processAssets",
					callback: this.sourcemap.bind(this)
				}
			});
		}
		else {
			this.onApply(compiler);
		}
    }


	/**
     * @override
	 * @template T
     * @param {WpBuildApp} app
	 * @returns {WpBuildCopyPlugin | undefined}
     */
	static build = (app) => WpBuildCopyPlugin.wrap(this, app, "copy");


	/**
	 * @private
	 * @async
	 * @param {typedefs.WebpackCompilationAssets} assets
	 */
	copyEntryModulesNoHash(assets)
	{
		const currentAssets = Object.entries(assets).filter(([ file ]) => this.isEntryAsset(file));
		this.logger.write("create copies of entry modules without filename hash", 1);
        this.logger.value("   # of current entry assets processed", currentAssets.length, 2);
		this.printCompilationDependencies();
		for (const [ file ] of currentAssets)
		{
			const ccFile = this.fileNameStrip(file),
				  dstAsset = this.compilation.getAsset(ccFile);
			if (!dstAsset)
			{
				const srcAsset = this.compilation.getAsset(file);
				if (srcAsset)
				{
					this.logger.write("   check persistent cache for previous contenthash", 3);
					const persistedCache = this.cache.get(),
						  immutable = srcAsset.info.contenthash === persistedCache[ccFile];
					if (immutable)
					{
						this.logger.write("   copied asset content is italic(unchanged)", 3);
					}
					else {
						this.logger.write("   copied asset content has italic(changed)", 3);
						persistedCache[ccFile] = srcAsset.info.contenthash;
						this.cache.set(persistedCache);
					}
					const sources = this.compiler.webpack.sources,
						  newInfo = { copied: true, immutable, sourceFilename: srcAsset.name, javascriptModule: false };
					 	  // srcAssetInfo = merge({}, srcAsset.info),
					      // newInfo = { ...srcAssetInfo,  copied: true, immutable, sourceFilename: srcAsset.name, javascriptModule: false };
					if (immutable) {
						newInfo.contenthash = srcAsset.info.contenthash;
					}
					this.logger.value("   emit copied asset", ccFile, 2);
					this.compilation.emitAsset(ccFile, new sources.RawSource(srcAsset.source.source()), newInfo);
				}
			}
		}
	}


    /**
     * @private
     * @param {typedefs.WebpackCompilationAssets} assets
     */
    sourcemap = (assets) =>
    {
		const l = this.logger;
		l.write("attach sourcemaps to all relative copied assets", 1);
		Object.entries(assets).filter(([ file, _ ]) => this.isEntryAsset(file)).forEach(([ file, _ ]) =>
		{
			const asset = this.compilation.getAsset(file);
			if (asset && asset.info.copied && !asset.info.related?.sourceMap)
			{
				const chunkName = this.fileNameStrip(file, true),
					  srcAssetFile = `${chunkName}.${this.globalCache.next[chunkName]}.js`,
					  srcAsset = this.compilation.getAsset(srcAssetFile);
				l.writeMsgTag(file, "chunk: " + chunkName);
				l.value("   source asset filename", srcAssetFile, 2);
				l.value("   source asset found", !!srcAsset, 3);
				l.value("   source asset has sourcemap", !!srcAsset?.info.related?.sourceMap, 3);
				if (srcAsset && srcAsset.info.related?.sourceMap)
				{
					l.write("attaching sourcemap", 1);
					l.value("   copied asset filename", srcAssetFile, 2);
					l.value("   source asset filename", srcAssetFile, 2);
					l.value("   chunk name", chunkName, 3);
					l.value("   source asset found", !!srcAsset, 3);
					l.value("   source asset has sourcemap", !!srcAsset?.info.related?.sourceMap, 3);
					const newInfo = apply({ ...asset.info }, { related: { sourceMap: srcAsset.info.related.sourceMap }});
					this.compilation.updateAsset(file, srcAsset.source, newInfo);
				}
			}
		});
    };


	/**
	 * @override
	 */
	getVendorPlugin = () =>
	{
		let plugin;
		const app = this.app,
			  psxBuildPath = app.getBasePath({ rel: true, psx: true, dot: false, ctx: false }),
			  psxBasePath = app.getContextPath({ rel: true, psx: true, dot: false, ctx: true }),
			  psxBaseCtxPath = posix.join(psxBasePath, "res");

		if (this.buildOptions.defaults)
		{
			if (app.build.type === "webapp")
			{
				/** @type {CopyPlugin.Pattern[]} */
				const patterns = [],
					  base = app.getContextPath({ rel: false });
				this.options.apps?.filter((appName) => existsSync(join(base, appName, "res"))).forEach(
					(appName) => patterns.push(
					{
						from: posix.join(psxBasePath, appName, "res", "*.*"),
						to: posix.join(psxBuildPath, "res", "webview"),
						context: posix.join(psxBasePath, appName, "res")
					})
				);
				if (existsSync(join(base, "res")))
				{
					patterns.push({
						from: posix.join(psxBasePath, "res", "*.*"),
						to: posix.join(psxBuildPath, "res", "webview"),
						context: psxBaseCtxPath
					});
				}
				if (patterns.length > 0) {
					plugin = new CopyPlugin({ patterns });
				}
			}
			else if (app.build.type === "module" && app.wpc.mode === "production")
			{   //
				// Copy resources to public info` sub-project during compilation
				//
				const infoProjectPath = join(psxBuildPath, "..", `${app.pkgJson.scopedName.name}-info`);
				if (existsSync(infoProjectPath))
				{
					const psxDirInfoProj = posix.normalize(infoProjectPath);
					plugin = new CopyPlugin(
					{
						patterns: [
						{
							from: posix.join(psxBasePath, "res", "img", "**"),
							to: posix.join(psxDirInfoProj, "res"),
							context: psxBaseCtxPath
						},
						{
							from: posix.join(psxBasePath, "res", "readme", "*.png"),
							to: posix.join(psxDirInfoProj, "res"),
							context: psxBaseCtxPath
						},
						{
							from: posix.join(psxBasePath, "doc", ".todo"),
							to: posix.join(psxDirInfoProj, "doc"),
							context: psxBaseCtxPath
						},
						{
							from: posix.join(psxBasePath, "res", "walkthrough", "welcome", "*.md"),
							to: posix.join(psxDirInfoProj, "doc"),
							context: psxBaseCtxPath
						},
						{
							from: posix.join(psxBasePath, "*.md"),
							to: posix.join(psxDirInfoProj),
							context: psxBaseCtxPath
						},
						{
							from: posix.join(psxBasePath, "LICENSE*"),
							to: posix.join(psxDirInfoProj),
							context: psxBaseCtxPath
						}]
					});
				}
			}
		}
		return plugin || new CopyPlugin();
	};

}


module.exports = WpBuildCopyPlugin.build;
