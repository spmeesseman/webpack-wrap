/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/loghooks.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const WpwPlugin = require("./base");
const typedefs = require("../types/typedefs");
const { isFunction } = require("../utils");
const { apply } = require("@spmeesseman/type-utils");


/**
 * @extends WpwPlugin
 */
class WpwLogHooksPlugin extends WpwPlugin
{
	/** @type {number} @private */
	elapsed;
	/** @type {number} @private */
	end;
	/** @type {number} @private */
	last;
	/** @type {number} @private */
	start;


    /**
     * @param {typedefs.WpwPluginOptions} options Plugin options to be applied
     */
	constructor(options)
	{
		super(options);
		const start = Date.now();
		apply(this, { elapsed: 0, end: 0, last: 0, start, startLast: start });
        this.buildOptions = /** @type {typedefs.WpwBuildOptionsConfig<"loghooks">} */(this.buildOptions); // reset for typings
	}


	/**
     * @override
     * @param {typedefs.WpwBuild} build
	 * @returns {WpwLogHooksPlugin | undefined}
     */
	static create = (build) => WpwPlugin.wrap(WpwLogHooksPlugin, build, "loghooks");


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
				// this.addCompilationHook("statsPreset"); // receive runtime deprecation error
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
		this.addCompilerHook("shutdown", () =>
		{
			const end = Date.now();
			apply(this, { end, elapsed: end - this.start });
			this.logger.value("total time elapsed", `$${this.elapsed} ms`);
		});
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
		const key = hook +this.build.wpc.name;
		if (!this.globalCache[key])
		{
			const l = this.logger,
				  tag = `italic(elapsed:${this.elapsed}ms)`;
			this.globalCache[key] = true;
			this.last = Date.now();
			this.elapsed = this.last - this.start;
			l.valuestar(`build stage hook ${l.tag(tag, l.colors.white)}`, hook);
		}
	};

}


module.exports = WpwLogHooksPlugin.create;
