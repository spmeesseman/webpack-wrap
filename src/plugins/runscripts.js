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
const { isFunction, execAsync, merge } = require("../utils");
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
        const applyCfg = merge(/** @type {typedefs.WpBuildPluginTapOptions} */({}), {});
        this.onApply(compiler,
        {
            runScriptsInitialize: {
                hook: "initialize",
                callback: () => this.runScriptsSync("initialize")
            },
            runScriptsBeforeCompile: {
                async: true,
                hook: "compilation",
                stage: "PRE_PROCESS",
                callback: () => this.runScriptsAsync("beforeCompile")
            },
            runScriptsAfterCompile: {
                async: true,
                hook: "compilation",
                stage: "REPORT",
                callback: () => this.runScriptsAsync("afterCompile")
            },
            runScriptsAfterDone: {
                async: true,
                hook: "done",
                callback: () => this.runScriptsAsync("done")
            }
        });
    }


    /**
     * @param {typedefs.WpwPluginConfigRunScriptsScriptConfig} script
     * @returns {string}
     */
    buildCommand = (script) => script.path + " " + (script.args ? " " + script.args.join(" ") : "");


    /**
     * @param {string} stage
	 * @returns {Promise<void>}
     */
    runScriptsAsync = async (stage) =>
    {
        const options = /** @type {typedefs.WpwPluginConfigRunScripts} */(this.app.build.options.runscripts);
        if (options[stage])
        {
            if (options[stage].mode === "parallel")
            {
                await Promise.all(
                    options[stage].scripts.map(script => execAsync({ command: this.buildCommand(script) })));
            }
            else {
                for (const script of options[stage].scripts) {
                    await execAsync({ command: this.buildCommand(script) });
                }
            }
        }
    };


    /**
     * @param {string} stage
     */
    runScriptsSync = (stage) =>
    {
        const options = /** @type {typedefs.WpwPluginConfigRunScripts} */(this.app.build.options.runscripts);
        if (options[stage])
        {
            for (const script of options[stage].scripts) { execSync(this.buildCommand(script)); }
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
