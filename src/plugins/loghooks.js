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


	/**
	 * @private
	 * @param {typedefs.WebpackCompilerAsyncHookName} hook
	 */
	addCompilerHookPromise(hook)
	{
		this.compiler.hooks[hook].tapPromise(`${hook}LogHookPromisePlugin`, async () => this.writeBuildTag(hook));
	};


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
		this.addCompilerHook("compilation", (_compilation) =>
		{
			// const compilation = /** @type {WebpackCompilation} */(arg);
			// compilation.hooks.beforeModuleHash.tap(
			// 	"LogCompilationHookBeforeModuleHashPlugin",
			// 	() => writeBuildTag("compilation.beforeModuleHash", env, wpConfig)
			// );
			// compilation.hooks.afterModuleHash.tap(
			// 	"LogCompilationHookAftereModuleHashPlugin",
			// 	() => writeBuildTag("compilation.afterModuleHash", env, wpConfig)
			// );
			// compilation.hooks.processAssets.tap(
			// 	{
			// 		name: "LogCompilationHookPluginAdditions",
			// 		stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
			// 	},
			// 	() => writeBuildTag("compilation.additions", env, wpConfig)
			// );
			// compilation.hooks.processAssets.tap(
			// 	{
			// 		name: "LogCompilationHookPluginAdditional",
			// 		stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
			// 	},
			// 	() => writeBuildTag("compilation.additional", env, wpConfig)
			// );
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
		this.addCompilerHookPromise("assetEmitted");
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
