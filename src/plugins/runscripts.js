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
const { execSync } = require("child_process");
const { execAsync, pickNot, capitalize } = require("../utils");
const { WpwPluginConfigRunScriptsKeys } = require("../types/constants");


/**
 * @extends WpwPlugin
 */
class WpwRunScriptsPlugin extends WpwPlugin
{
    /** @type {typedefs.WpwBuildOptionsConfig<"runscripts">} @private */
    buildOptions;

    /**
     * @param {typedefs.WpwPluginOptions} options Plugin options to be applied
     */
	constructor(options)
	{
		super(options);
        this.buildOptions = /** @type {typedefs.WpwBuildOptionsConfig<"runscripts">} */(this.build.options.runscripts);
	}


    /**
     * Called by webpack runtime to initialize this plugin
     * @override
     * @param {typedefs.WebpackCompiler} compiler the compiler instance
     */
    apply(compiler)
    {
        const customTaps = /** @type {typedefs.WpwPluginTapOptions} */({});
        const pluginOptions = pickNot(this.buildOptions, ...WpwPluginConfigRunScriptsKeys);

        Object.entries(pluginOptions).forEach(([ stage, tapConfig ]) =>
        {
            const tapKey = `runScripts${capitalize(stage)}`;
            const customTap = customTaps[tapKey] = /** @type {typedefs.WpwPluginBaseTapOptions} */({
                async: tapConfig.async,
                hook: stage,
                callback: () => this.runScripts(stage)
            });
            if (customTap.stage && customTap.hook === "compilation") {
                customTap.stage = /** @type {typedefs.WebpackCompilationHookStage} */(customTap.stage.toUpperCase());
            }
        });

        this.onApply(compiler, Object.assign(customTaps,
        /** @type {typedefs.WpwPluginTapOptions} */({
            runScriptsInitialize: {
                hook: "initialize",
                callback: () => this.runScripts("initialize")
            },
            runScriptsBeforeCompile: {
                async: true,
                hook: "compilation",
                stage: "PRE_PROCESS",
                callback: () => this.runScripts("beforeCompile")
            },
            runScriptsAfterCompile: {
                async: true,
                hook: "compilation",
                stage: "REPORT",
                callback: () => this.runScripts("afterCompile")
            },
            runScriptsAfterDone: {
                async: true,
                hook: "done",
                callback: () => this.runScripts("done")
            }
        })));
    }


    /**
     * @param {typedefs.WpwPluginConfigRunScriptsItemDef} script
     * @returns {string}
     */
    buildCommand = (script) => script.path + " " + (script.args ? " " + script.args.join(" ") : "");


    /**
     * @param {string} stage
	 * @returns {Promise<void>}
     */
    runScripts = async (stage) =>
    {
        const options = /** @type {typedefs.WpwPluginConfigRunScripts} */(this.build.options.runscripts);
        if (options[stage])
        {
            const stageOptions = /** @type {typedefs.WpwPluginConfigRunScriptsItem} */(options[stage]);
            if (stageOptions.async)
            {
                if (stageOptions.mode === "parallel")
                {
                    await Promise.all(
                        stageOptions.scripts.map(script => execAsync({ command: this.buildCommand(script) }))
                    );
                }
                else {
                    for (const script of stageOptions.scripts) {
                        await execAsync({ command: this.buildCommand(script) });
                    }
                }
            }
            else {
                const stageOptions = /** @type {typedefs.WpwPluginConfigRunScriptsItem} */(options[stage]);
                for (const script of stageOptions.scripts) { execSync(this.buildCommand(script)); }
            }
        }
    };

}


/**
 * Returns a `WpwLoggerHookStagesPlugin` instance if appropriate for the current build
 * environment. Can be enabled/disable in .wpcrc.json by setting the `plugins.loghooks`
 * property to a boolean value of  `true` or `false`
 *
 * @param {typedefs.WpwBuild} build
 * @returns {WpwRunScriptsPlugin | undefined}
 */
const runscripts = (build) => build.options.runscripts ? new WpwRunScriptsPlugin({ build }) : undefined;


module.exports = runscripts;
