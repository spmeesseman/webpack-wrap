/* eslint-disable import/no-extraneous-dependencies */

// ___ENABLE_TS_CHECK___@ts-check

/**
 * @file examples/plugin.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const WpBuildApp = require("@spmeesseman/webpack-wrap/core/app");
const WpwPlugin = require("@spmeesseman/webpack-wrap/plugins/base");
const typedefs = require("@spmeesseman/webpack-wrap/types/typedefs");

// const WpBuildApp = require("../src/core/app");
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
     * @param {WpBuildApp} app
	 * @returns {WpwExamplePlugin | undefined}
     */
	static build(app)
	{
		return app.build.options.types?.enabled ? new WpwExamplePlugin({ app }) : undefined;
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


module.exports = WpwExamplePlugin.build;
