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
const { existsAsync, WpwError, applyIf } = require("../utils");


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
		this.buildTask = this[options.taskHandler];
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
				callback: this.clean.bind(this)
			},
			injectVirtualEntryFile: {
				async: true,
				hook: "beforeRun",
				callback: this.injectVirtualEntryFile.bind(this)
			}
        }, this.options.hooks));
    }


	/**
	 * @abstract
	 * @param {typedefs.WebpackCompilationAssets} _assets
	 */
	async buildTask(_assets)
	{
		this.build.addMessage({ code: WpwError.Msg.ERROR_ABSTRACT_FUNCTION, message: `name[${this.name}][buildTask]` });
	};


	/**
	 * @private
	 * @param {typedefs.WebpackStats} _stats
	 */
	async clean(_stats)
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

}


module.exports = WpwBaseTaskPlugin;
