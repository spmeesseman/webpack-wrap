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
const { execSync } = require("child_process");
const { execAsync, capitalize } = require("../utils");
const { pickNot, asArray } = require("@spmeesseman/type-utils");
const { WpwPluginConfigRunScriptsKeys } = require("../types/constants");


/**
 * @extends WpwPlugin
 */
class WpwRunScriptsPlugin extends WpwPlugin
{
    /**
     * @param {typedefs.WpwPluginOptions} options Plugin options to be applied
     */
	constructor(options)
	{
		super(options);
        this.buildOptions = /** @type {typedefs.WpwBuildOptionsConfig<"runscripts">} */(this.buildOptions);
	}


	/**
     * @override
     */
	static create = WpwRunScriptsPlugin.wrap.bind(this);


    /**
     * @override
     * @returns {typedefs.WpwPluginTapOptions}
     */
    onApply()
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

        return {
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
        };
    }


    /**
     * @private
     * @param {typedefs.WpwPluginConfigRunScriptsItemDef} script
     * @returns {string}
     */
    buildCommand = (script) => `${script.type} ${script.path} ${script.args ? " " + script.args.join(" ") : ""}`;


    /**
     * @param {string} stage
	 * @returns {Promise<void>}
     */
    runScripts = async (stage) =>
    {
        for (const scriptDef of asArray(this.buildOptions.scripts))
        {
            if (scriptDef.async)
            {
                if (scriptDef.mode === "parallel")
                {
                    await Promise.all(
                        scriptDef.items.map(script => execAsync({ command: this.buildCommand(script) }))
                    );
                }
                else {
                    for (const script of scriptDef.items) {
                        await execAsync({ command: this.buildCommand(script), logger: this.build.logger, logPad: "   " });
                    }
                }
            }
            else
            {   for (const script of scriptDef.items) {
                    execSync(this.buildCommand(script));
                }
            }
        }
    };

}


module.exports = WpwRunScriptsPlugin.create;
