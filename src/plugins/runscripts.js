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
const { isFunction, execAsync, merge, pickNot, WpwPluginConfigRunScriptsProps, apply, capitalize } = require("../utils");
const { execSync } = require("child_process");


/**
 * @extends WpBuildPlugin
 */
class WpwRunScriptsPlugin extends WpBuildPlugin
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
        const customTaps = /** @type {typedefs.WpBuildPluginTapOptions} */({});
        const pluginOptions = pickNot(
            /** @type {typedefs.WpwPluginConfigRunScripts} */(this.app.build.options.runscripts),
            ...WpwPluginConfigRunScriptsProps
        );

        Object.entries(pluginOptions).forEach(([ stage, tapConfig ]) =>
        {
            const tapKey = `runScripts${capitalize(stage)}`;
            const customTap = customTaps[tapKey] = /** @type {typedefs.WpBuildPluginTapOptionsEntry} */({
                async: tapConfig.async,
                hook: stage,
                callback: () => this.runScripts(stage)
            });
            if (customTap.stage && customTap.hook === "compilation") {
                customTap.stage = /** @type {typedefs.WebpackCompilationHookStage} */(customTap.stage.toUpperCase());
            }
        });

        this.onApply(compiler, Object.assign(customTaps,
        /** @type {typedefs.WpBuildPluginTapOptions} */({
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
     * @param {typedefs.WpwPluginConfigRunScriptsScriptDef} script
     * @returns {string}
     */
    buildCommand = (script) => script.path + " " + (script.args ? " " + script.args.join(" ") : "");


    /**
     * @param {string} stage
	 * @returns {Promise<void>}
     */
    runScripts = async (stage) =>
    {
        const options = /** @type {typedefs.WpwPluginConfigRunScripts} */(this.app.build.options.runscripts);
        if (options[stage])
        {
            const stageOptions = /** @type {typedefs.WpwPluginConfigRunScriptsHookConfig} */(options[stage]);
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
                const stageOptions = /** @type {typedefs.WpwPluginConfigRunScriptsHookConfig} */(options[stage]);
                for (const script of stageOptions.scripts) { execSync(this.buildCommand(script)); }
            }
        }
    };

}


/**
 * Returns a `WpBuildLogHookStagesPlugin` instance if appropriate for the current build
 * environment. Can be enabled/disable in .wpconfigrc.json by setting the `plugins.loghooks`
 * property to a boolean value of  `true` or `false`
 *
 * @param {typedefs.WpBuildApp} app
 * @returns {WpwRunScriptsPlugin | undefined}
 */
const runscripts = (app) => app.build.options.runscripts ? new WpwRunScriptsPlugin({ app }) : undefined;


module.exports = runscripts;
