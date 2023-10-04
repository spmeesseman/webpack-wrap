/* eslint-disable import/no-extraneous-dependencies */
// // @ts-check

/**
 * @file schema/template/plugin.js
 * @version 0.0.1
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const WpwPlugin = require("@spmeesseman/webpack-wrap/plugins/base");
const typedefs = require("@spmeesseman/webpack-wrap/types/typedefs");

// const WpwBuild = require("../src/core/build");
// const WpwPlugin = require("../src/plugins/base");
// const typedefs = require("../src/types/typedefs");


/**
 * @extends WpwPlugin
 */
class WpwExamplePlugin extends WpwPlugin
{
    /**
     * @param {typedefs.WpwPluginOptions} options Plugin options to be applied
     */
	constructor(options)
	{
		super(options);
        this.buildOptions = /** @type {typedefs.WpwBuildOptionsConfig<"example">} */(this.app.build.options.example);
	}


	/**
     * @override
     * @param {typedefs.WpwBuild} build
	 * @returns {WpwJsDocPlugin | undefined}
     */
	static create = (build) => WpwJsDocPlugin.wrap(this, build, "example", this.validateJsDocInstalled);


    /**
     * @override
     */
    onApply()
    {
        return {
            someTask: {
                hook: "done",
                callback: this.cleanupTask.bind(this)
            },
            someCompilationTask: {
                async: true,
                hook: "compilation",
                stage: "ADDITIONS",
                statsProperty: this.optionsKey,
                callback: this.compilationTask.bind(this)
            }
        };
    }


    /**
     * @private
	 * @param {typedefs.WebpackCompilationAssets} assets
     */
    compilationTask(assets)
    {
        // ...
    }


    /**
     * @private
	 * @param {typedefs.WebpackStats} stats
     */
    cleanupTask(stats)
    {
        // ...
    }

}


module.exports = WpwExamplePlugin.create;
