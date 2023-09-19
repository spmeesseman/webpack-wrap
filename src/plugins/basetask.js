/* eslint-disable jsdoc/valid-types */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/types.js
 * @version 0.0.1
 * @license MIT
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
const typedefs = require("../types/typedefs");
const { rm, unlink, writeFile } = require("fs/promises");
const { existsAsync, WpwError, applyIf, isFunction, isPromise } = require("../utils");


/**
 * @extends WpwPlugin
 */
class WpwBaseTaskPlugin extends WpwPlugin
{
	/** @type {string} @protected */
	buildPathTemp;
    /** @type {string} @protected */
	virtualFile;
	/** @type {string} @protected */
	virtualFilePath;


    /**
     * @param {typedefs.WpwPluginBaseTaskOptions} options
     */
	constructor(options)
	{
		super(options);
		this.validateBaseTaskOptions();
		this.virtualFile = `${this.build.name}${this.build.source.dotext}`;
		this.virtualFilePath = `${this.build.global.cacheDir}/${this.virtualFile}`;
		this.buildPathTemp = join(this.build.getTempPath(), this.build.type, "virtual");
	}


    /**
     * Called by webpack runtime to initialize this plugin
	 *
     * @override
     * @param {typedefs.WebpackCompiler} compiler the compiler instance
     */
    apply(compiler)
    {
		this.onApply(compiler, applyIf(
        {
			build: {
				async: true,
                hook: "compilation",
				stage: "ADDITIONAL",
				statsProperty: this.buildOptionsKey,
                callback: this.buildTask.bind(this)
            },
			clean: {
				async: true,
				hook: "done",
				callback: this.cleanTask.bind(this)
			},
			injectVirtualEntryFile: {
				async: true,
				hook: "beforeRun",
				callback: this.injectVirtualEntryFile.bind(this)
			}
        }, this.options.hooks));
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
			this.logger.write(`delete virtual entry asset '${virtualEntryFile}' from compilation`, 3);
			this.compilation.deleteAsset(virtualEntryFile);
		}
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
     * @private
     * @throws {typedefs.WpwError}
     */
	validateBaseTaskOptions()
    {
        if (!isFunction(this[this.options.taskHandler])) {
            throw WpwError.getErrorMissing("options.taskHandler", this.wpc, "invalid option [basetask]");
        }
    }

}


module.exports = WpwBaseTaskPlugin;
