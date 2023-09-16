/* eslint-disable import/no-extraneous-dependencies */

// ___ENABLE_TS_CHECK___@ts-check

/**
 * @file examples/plugin.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const WpwBuild= require("@spmeesseman/webpack-wrap/core/build");
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
    /** @type {typedefs.WpwBuildOptionsConfig<"REPLACE__plugin_key__REPLACE">} @private */
    buildOptions;


    /**
     * @param {typedefs.WpwPluginOptions} options Plugin options to be applied
     */
	constructor(options)
	{
		super(options);
        this.buildOptions = /** @type {typedefs.WpwBuildOptionsConfig<"REPLACE__plugin_key__REPLACE">} */(this.app.build.options.jsdoc);
	}


	/**
     * @override
     * @param {WpwBuild} build
	 * @returns {WpwExamplePlugin | undefined}
     */
	static create(build)
	{
		return app.build.options.types?.enabled ? new WpwExamplePlugin({ build }) : undefined;
	}


    /**
     * Called by webpack runtime to initialize this plugin
     * @override
     * @param {typedefs.WebpackCompiler} compiler the compiler instance
     */
    apply(compiler)
    {
        this.onApply(compiler
        // {
        //     someTaskName: {
        //         hook: "compilation",
        //         stage: "ADDITIONS",
        //         statsProperty: "istanbul",
        //         callback: this.istanbulTags.bind(this)
        //     }
        // }
        );
    }

}


module.exports = WpwExamplePlugin.create;
