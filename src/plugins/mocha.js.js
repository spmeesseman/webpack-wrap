/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/istanbul.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const WpwPlugin = require("./base");
const WpwBuild = require("../core/build");
const typedefs = require("../types/typedefs");


/**
 * @extends WpwPlugin
 */
class WpwExamplePlugin extends WpwPlugin
{
    /** @type {typedefs.WpwBuildOptionsConfig<"mocha">} @private */
    buildOptions;


    /**
     * @param {typedefs.WpwPluginOptions} options Plugin options to be applied
     */
	constructor(options)
	{
		super(options);
        this.buildOptions = /** @type {typedefs.WpwBuildOptionsConfig<"mocha">} */(this.build.options.jsdoc);
	}


	/**
     * @override
     * @param {typedefs.WpwBuild} build
	 * @returns {WpwExamplePlugin | undefined}
     */
	static build(build)
	{
		return build.options.types?.enabled ? new WpwExamplePlugin({ build }) : undefined;
	}


    /**
     * Called by webpack runtime to initialize this plugin
     *
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
