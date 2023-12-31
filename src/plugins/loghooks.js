/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/loghooks.js
 * @version 0.0.1
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const WpwPlugin = require("./base");
const typedefs = require("../types/typedefs");
const { isWpwWebpackCompilerHook } = require("../utils");
const { apply, isFunction } = require("@spmeesseman/type-utils");


/**
 * @extends WpwPlugin
 */
class WpwLogHooksPlugin extends WpwPlugin
{
	/**
	 * @private
	 * @type {number}
	 */
	elapsed;
	/**
	 * @private
	 * @type {number}
	 */
	last;
	/**
	 * @private
	 * @type {number}
	 */
	start;


    /**
     * @param {typedefs.WpwPluginOptions} options Plugin options to be applied
     */
	constructor(options)
	{
		super(options);
		const start = Date.now();
		apply(this, { elapsed: 0, last: 0, start, startLast: start });
        this.buildOptions = /** @type {typedefs.WpwBuildOptionsConfig<"loghooks">} */(this.buildOptions); // reset for typings
	}


	/**
     * @override
     */
	static create = WpwLogHooksPlugin.wrap.bind(this);


    /**
     * @override
     */
    onApply() { this.hookSteps(); }


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
				/** @type {typedefs.WebpackHook} */(
				compilationHook).tap(
					{ stage, name: `${this.name}_${hook}_${processAssetStage}` },
					(/** @type {any} */_arg) => this.writeBuildTag(`${hook}::${processAssetStage}`)
				);
			}
			else if (isFunction(/** @type {typedefs.WebpackHook} */(compilationHook).tap))
			{
				/** @type {typedefs.WebpackHook} */(compilationHook).tap(`${this.name}_${hook}`, (/** @type {any} */_arg) =>
				{
					this.writeBuildTag(hook);
				});
			}
		}
	};


	/**
	 * @private
	 * @param {typedefs.WebpackCompilerHookName} hook
	 * @param {function(any): any} [cb]
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
		if (this.buildOptions.compiler)
		{
			this.addCompilerHook("infrastructureLog");
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
		}
		if (this.buildOptions.compilation)
		{
			this.addCompilerHook("compilation", (/** @type {typedefs.WebpackCompilation} */compilation) =>
			{
				this.compilation = compilation;
				const options = /** @type {typedefs.IWpwPluginConfigLogHooksCompilation} */(this.buildOptions.compilation);
				if (options.all || options.default || options.processAssets)
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
					this.addCompilationHook("afterProcessAssets");
				}
				if (options.all || options.default)
				{
					this.addCompilationHook("beforeCodeGeneration");
					this.addCompilationHook("afterCodeGeneration");
					this.addCompilationHook("beforeRuntimeRequirements");
					this.addCompilationHook("afterRuntimeRequirements");
					this.addCompilationHook("record");
					this.addCompilationHook("processAdditionalAssets");
					this.addCompilationHook("seal");
					this.addCompilationHook("afterSeal");
					this.addCompilationHook("needAdditionalSeal");
					this.addCompilationHook("renderManifest");
					this.addCompilationHook("beforeModuleAssets");
					this.addCompilationHook("moduleAsset");
					this.addCompilationHook("assetPath");
					this.addCompilationHook("chunkAsset");
					this.addCompilationHook("beforeChunkAssets");
					this.addCompilationHook("shouldGenerateChunkAssets");
					this.addCompilationHook("needAdditionalPass");
					this.addCompilationHook("childCompiler");
					this.addCompilationHook("log");
					this.addCompilationHook("processWarnings");
					this.addCompilationHook("processErrors");
					this.addCompilationHook("statsNormalize");
					this.addCompilationHook("statsFactory");
					this.addCompilationHook("statsPrinter");
				}
				if (options.all || options.hash)
				{
					this.addCompilationHook("beforeHash");
					this.addCompilationHook("afterHash");
					this.addCompilationHook("beforeModuleHash");
					this.addCompilationHook("afterModuleHash");
					this.addCompilationHook("fullHash");
					this.addCompilationHook("chunkHash");
					this.addCompilationHook("contentHash");
					this.addCompilationHook("recordHash");
				}
				if (options.all || options.optimization)
				{
					this.addCompilationHook("optimizeAssets");
					this.addCompilationHook("afterOptimizeChunkAssets");
					this.addCompilationHook("afterOptimizeAssets");
				}
				if (options.deprecated)
				{
					this.addCompilationHook("statsPreset");
					this.addCompilationHook("additionalChunkAssets");
					this.addCompilationHook("optimizeChunkAssets");
				}
			});
		}
		else {
			this.addCompilerHook("compilation");
		}
		if (this.buildOptions.compiler)
		{
			this.addCompilerHook("make");
			this.addCompilerHook("finishMake");
			this.addCompilerHook("afterCompile", /** @param {typedefs.WebpackCompilation} compilation */(compilation) =>
			{
				// const stats = compilation.getStats();
				// stats.toJson().
				if (this.logger.level >= 4)
				{
					const assets = compilation.getAssets();
					this.logger.write("compilation step completed, listing all assets", 4, "", null, this.logger.colors.white);
					for (const asset of assets)
					{
						this.logger.writeMsgTag(asset.name, "ASSET", 4, "   ", null, this.logger.colors.grey);
						this.logger.value("   asset info", JSON.stringify(asset.info), 5);
					}
				}
			});
			this.addCompilerHook("shouldEmit");
			this.addCompilerHook("emit");
			this.addCompilerHook("assetEmitted");
			this.addCompilerHook("emit");
			this.addCompilerHook("afterEmit");
			this.addCompilerHook("done");
			this.addCompilerHook("afterDone", () =>
			{
				this.elapsed = Date.now() - this.start;
				this.logger.value("total time elapsed", this.timeElapsed());
			});
			this.addCompilerHook("shutdown");
			this.addCompilerHook("additionalPass");
			this.addCompilerHook("failed", /** @param {Error} e */(e) => { this.logger.error(e); });
			this.addCompilerHook("invalid");
			this.addCompilerHook("watchRun");
			this.addCompilerHook("watchClose");
		}
	}


	timeElapsed()
	{
		const tm = this.elapsed,
              mssMode = true,
              tmM = Math.floor(tm / 1000 / 60),
              tmS = Math.floor(tm / 1000 % 60),
              tmSF = tmS >= 10 ? tmS + "" : "0" + tmS,
              tmMS = tm % 1000,
              tmMSF = tmMS >= 100 ? tmMS + "" : (tmMS > 10 ? "0" + tmMS : "00" + tmMS);
        return `${tmM}:${tmSF}${"." + (mssMode ? tmMSF : tmMSF.slice(0, -1))}`;
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
			this.globalCache[key] = true;
			this.last = Date.now();
			this.elapsed = this.last - this.start;
			const l = this.logger,
				  tag = `italic(elapsed:${this.timeElapsed()}ms)`,
				  hookType = isWpwWebpackCompilerHook(hook) ? "compiler" : "compilation";
			l.valuestar(`${hookType} hook ${l.tag(tag, l.colors.white)}`, hook);
		}
	};

}


module.exports = WpwLogHooksPlugin.create;
