/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/loghooks.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 */

const WpBuildPlugin = require("./base");
const typedefs = require("../types/typedefs");
const { isFunction } = require("../utils");


/**
 * @extends WpBuildPlugin
 */
class WpBuildLogHooksPlugin extends WpBuildPlugin
{
    /**
     * @param {typedefs.WpBuildPluginOptions} options Plugin options to be applied
     */
	constructor(options) { super(options); }


    /**
     * Called by webpack runtime to initialize this plugin
     * @override
     * @param {typedefs.WebpackCompiler} compiler the compiler instance
     */
    apply(compiler)
    {
        this.onApply(compiler, {});
		this.hookSteps();
    }


	/**
	 * @private
	 * @param {typedefs.WebpackCompilationHookName} hook
	 * @param {Lowercase<typedefs.WebpackCompilationHookStage>} [processAssetStage]
	 */
	addCompilationHook(hook, processAssetStage)
	{
		const compilationHook = this.compilation.hooks[hook];
		if (this.isTapable(compilationHook))
		{
			if (hook === "processAssets" && processAssetStage)
			{
				const stage = this.compiler.webpack.Compilation[`PROCESS_ASSETS_STAGE_${processAssetStage.toUpperCase()}`];
				compilationHook.tap(
					{ stage, name: `${this.name}_${hook}_${processAssetStage}` },
					(/** @type {any} */_arg) =>
					{
						this.writeBuildTag(`${hook}::${processAssetStage}`);
					}
				);
			}
			else
			{
				if (isFunction(compilationHook.tap))
				{
					compilationHook.tap(`${this.name}_${hook}`, (/** @type {any} */_arg) =>
					{
						this.writeBuildTag(hook);
					});
				}
			}
		}
	};


	/**
	 * @private
	 * @param {typedefs.WebpackCompilerHookName} hook
	 * @param {(arg: any) => any} [cb]
	 */
	addCompilerHook(hook, cb)
	{
		this.compiler.hooks[hook].tap(`${this.name}_${hook}`, (/** @type {any} */arg) =>
		{
			this.writeBuildTag(hook);
			return cb?.(arg);
		});
	};


	// /**
	//  * @private
	//  * @param {typedefs.WebpackCompilerAsyncHookName} hook
	//  */
	// addCompilerHookPromise(hook)
	// {
	// 	this.compiler.hooks[hook].tapPromise(`${hook}LogHookPromisePlugin`, async () => this.writeBuildTag(hook));
	// };


	/**
	 * @private
	 */
	hookSteps()
	{
		this.addCompilerHook("environment");
		this.addCompilerHook("afterEnvironment");
		this.addCompilerHook("entryOption");
		this.addCompilerHook("afterPlugins");
		this.addCompilerHook("afterResolvers");
		this.addCompilerHook("initialize");
		this.addCompilerHook("beforeRun");
		this.addCompilerHook("run");
		this.addCompilerHook("normalModuleFactory");
		this.addCompilerHook("contextModuleFactory");
		this.addCompilerHook("beforeCompile");
		this.addCompilerHook("compile");
		this.addCompilerHook("thisCompilation");
		this.addCompilerHook("compilation", (/** @type {typedefs.WebpackCompilation} */compilation) =>
		{
			this.compilation = compilation;
			if (this.logger.level >= 2)
			{
				this.addCompilationHook("additionalAssets");
				this.addCompilationHook("processAssets", "additional");
				this.addCompilationHook("processAssets", "pre_process");
				this.addCompilationHook("processAssets", "derived");
				this.addCompilationHook("processAssets", "additions");
				this.addCompilationHook("processAssets", "optimize");
				this.addCompilationHook("processAssets", "optimize_count");
				this.addCompilationHook("processAssets", "optimize_compatibility");
				this.addCompilationHook("processAssets", "optimize_size");
				this.addCompilationHook("processAssets", "dev_tooling");
				this.addCompilationHook("processAssets", "optimize_inline");
				this.addCompilationHook("processAssets", "summarize");
				this.addCompilationHook("processAssets", "optimize_hash");
				this.addCompilationHook("processAssets", "optimize_transfer");
				this.addCompilationHook("processAssets", "analyse");
				this.addCompilationHook("processAssets", "report");
			}
			if (this.logger.level >= 3)
			{
				this.addCompilationHook("beforeCodeGeneration");
				this.addCompilationHook("beforeRuntimeRequirements");
				this.addCompilationHook("contentHash");
				this.addCompilationHook("recordHash");
				this.addCompilationHook("record");
				this.addCompilationHook("processAdditionalAssets");
				this.addCompilationHook("needAdditionalSeal");
				this.addCompilationHook("afterSeal");
				this.addCompilationHook("renderManifest");
				this.addCompilationHook("fullHash");
				this.addCompilationHook("chunkHash");
				this.addCompilationHook("moduleAsset");
				this.addCompilationHook("chunkAsset");
				this.addCompilationHook("assetPath");
				this.addCompilationHook("needAdditionalPass");
				this.addCompilationHook("childCompiler");
				this.addCompilationHook("log");
				this.addCompilationHook("processWarnings");
				this.addCompilationHook("processErrors");
				this.addCompilationHook("statsPreset");
				this.addCompilationHook("statsNormalize");
				this.addCompilationHook("statsFactory");
				this.addCompilationHook("statsPrinter");
				this.addCompilationHook("normalModuleLoader");
			}
			if (this.logger.level >= 4)
			{
				this.addCompilationHook("beforeModuleHash");
				this.addCompilationHook("afterModuleHash");
				this.addCompilationHook("afterCodeGeneration");
				this.addCompilationHook("afterRuntimeRequirements");
				this.addCompilationHook("beforeHash");
				this.addCompilationHook("afterHash");
				this.addCompilationHook("beforeModuleAssets");
				this.addCompilationHook("shouldGenerateChunkAssets");
				this.addCompilationHook("beforeChunkAssets");
				this.addCompilationHook("additionalChunkAssets");
				this.addCompilationHook("optimizeAssets");
				this.addCompilationHook("optimizeChunkAssets");
				this.addCompilationHook("afterOptimizeChunkAssets");
				this.addCompilationHook("afterOptimizeAssets");
				this.addCompilationHook("afterProcessAssets");
				this.addCompilationHook("afterSeal");
			}
		});
		this.addCompilerHook("make");
		this.addCompilerHook("afterCompile", /** @param {typedefs.WebpackCompilation} compilation */(compilation) =>
		{
			// const stats = compilation.getStats();
			// stats.toJson().
			const assets = compilation.getAssets();
			this.logger.write(
				"---- Compilation step completed -- Listing all assets ----------------------------------------",
				3, "", null, this.logger.colors.white
			);
			for (const asset of assets)
			{
				this.logger.write(
					this.logger.tag("ASSET", this.logger.colors.green, this.logger.colors.white) + " " +
					this.logger.withColor(asset.name, this.logger.colors.grey), 3
				);
				this.logger.value("   asset info", JSON.stringify(asset.info), 5);
			}
		});
		this.addCompilerHook("shouldEmit");
		this.addCompilerHook("emit");
		this.addCompilerHook("assetEmitted");
		this.addCompilerHook("emit");
		this.addCompilerHook("afterEmit");
		this.addCompilerHook("done");
		this.addCompilerHook("shutdown");
		this.addCompilerHook("afterDone");
		this.addCompilerHook("additionalPass");
		this.addCompilerHook("failed", /** @param {Error} e */(e) => { this.logger.error(e); });
		this.addCompilerHook("invalid");
		this.addCompilerHook("watchRun");
		this.addCompilerHook("watchClose");
	}


	/**
	 * @private
	 * @param {string} hook
	 */
	writeBuildTag(hook)
	{
		const key = hook +this.app.wpc.name;
		if (!this.app.global.logHooks[key])
		{
			this.app.global.logHooks[key] = true;
			this.logger.valuestar("build stage hook", hook);
		}
	};

}


/**
 * Returns a `WpBuildLogHookStagesPlugin` instance if appropriate for the current build
 * environment. Can be enabled/disable in .wpconfigrc.json by setting the `plugins.loghooks`
 * property to a boolean value of  `true` or `false`
 *
 * @param {typedefs.WpBuildApp} app
 * @returns {WpBuildLogHooksPlugin | undefined}
 */
const loghooks = (app) => app.build.options.loghooks ? new WpBuildLogHooksPlugin({ app }) : undefined;


module.exports = loghooks;
