/* eslint-disable jsdoc/valid-types */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/types.js
 * @version 0.0.1
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *
 * @description
 *
 * Base abstract plugin for builds that do not produce a "module" as per what webpack is basically
 * designed for, but for a "task build", such as a types package or jsdoc packaging task.  Typical
 * tasks that might usually be done by a task runner such as Gulp, Grunt, Ant, etc...
 *
 * The concept is to use a "fake" or virtual file as the entry point so that the webpack process
 * runs as it would normally.  The virtual file is removed during compilation while the output of
 * the specific task is added and emitted in the (probably) 'process_additional_assets' stage.
 *
 *//** */

const { join } = require("path");
const WpwPlugin = require("./base");
const WpwError = require("../utils/message");
const typedefs = require("../types/typedefs");
const { existsAsync, capitalize, findFiles } = require("../utils");
const { rm, unlink, writeFile } = require("fs/promises");
const { applyIf, isFunction, isPromise, isString } = require("@spmeesseman/type-utils");


/**
 * @extends WpwPlugin
 */
class WpwBaseTaskPlugin extends WpwPlugin
{
	/**
	 * @protected
	 * @type {string}
	 */
	buildPathTemp;
    /**
     * @override
	 * @protected
     * @type {boolean}
     */
    isTaskTypeBuild = true;


    /**
     * @param {typedefs.WpwPluginBaseTaskOptions} options
     */
	constructor(options)
	{
		super(options);
		this.validateBaseTaskOptions();
		this.buildPathTemp = join(this.build.getTempPath(), this.build.type, "virtual");
	}


    /**
     * @override
     */
    onApply()
    {
		const taskOwner = capitalize(this.optionsKey);
		return applyIf(
        {
			[`execute${taskOwner}Build`]: {
				async: true,
                hook: "compilation",
				stage: "ADDITIONAL",
				statsProperty: this.optionsKey,
                callback: this.buildTask.bind(this)
            },
			[`execute${taskOwner}Cleanup`]: {
				async: true,
				hook: "done",
				callback: this.cleanTask.bind(this)
			},
			[`inject${taskOwner}VirtualEntryFileFor`]: {
				async: true,
				hook: "beforeRun",
				callback: this.injectVirtualEntryFile.bind(this)
			}
        }, this.options.hooks);
    }


	/**
	 * @private
	 * @param {typedefs.WebpackCompilationAssets} assets
	 */
	async buildTask(assets)
	{
		const result = this[this.options.taskHandler](assets);
		if (isPromise(result)) {
			await result;
		}
		const virtualEntryFile = Object.keys(assets).find(f => f.endsWith(this.virtualFile));
		if (virtualEntryFile) {
			this.logger.write(`   delete virtual entry asset '${virtualEntryFile}' from compilation`, 3);
			this.compilation.deleteAsset(virtualEntryFile);
		}
		const realEntryFiles = Object.keys(assets).filter(f => (/entry[0-9](?:.*?)\.js/).test(f));
		realEntryFiles.forEach((realEntryFile) => {
			this.logger.write(`   delete entry asset '${realEntryFile}' from compilation`, 3);
			this.compilation.deleteAsset(realEntryFile);
		});
	};


	/**
	 * @private
	 * @param {typedefs.WebpackStats} _stats
	 */
	async cleanTask(_stats)
	{
		if (await existsAsync(this.virtualFilePath)) {
			await unlink(this.virtualFilePath);
		}
		if (await existsAsync(this.buildPathTemp)) {
			await rm(this.buildPathTemp, { recursive: true, force: true });
		}
	};


	/**
	 * @private
	 * @param {typedefs.WebpackCompiler} _compiler
	 */
	async injectVirtualEntryFile(_compiler)
	{
		const dummyCode = "console.log('dummy source');",
			  source = `export default () => { ${JSON.stringify(dummyCode)}; }`;
        await writeFile(this.virtualFilePath, source);
	}


	/**
	 * @protected
	 * @param {Record<string, any>} options
	 * @param {boolean} [excludeFalseFlags]
	 * @returns {string[]}
	 */
	configToArgs(options, excludeFalseFlags)
	{
		return Object.entries(options).filter(
			([ _, v ]) => v !== undefined && (!excludeFalseFlags || v !== false)
		)
		.map(
			([ k, v ]) =>
			{
				if (isString(v) && v.includes(" ") && v[0] !== "\"") {
					return `--${k} "${v}"`;
				}
				return v !== true ? `--${k} ${v}` : `--${k}`;
			}
		);
	}


    /**
     * @private
     * @throws {typedefs.WpwError}
     */
	validateBaseTaskOptions()
    {
		const _get = (/** @type {string} */ p) => new WpwError({
            wpc: this.wpc,
            capture: this.validateBaseTaskOptions,
            code: WpwError.Code.ERROR_RESOURCE_MISSING,
            message: `config validation failed for task module ${this.name}: property ${p}`
        });
        if (!isFunction(this[this.options.taskHandler])) {
            throw _get("taskHandler");
        }
    }

}


module.exports = WpwBaseTaskPlugin;
