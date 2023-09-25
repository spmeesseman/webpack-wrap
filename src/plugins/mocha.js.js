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
class WpwMochaPlugin extends WpwPlugin
{
    /**
     * @param {typedefs.WpwPluginOptions} options Plugin options to be applied
     */
	constructor(options)
	{
		super(options);
        this.buildOptions = /** @type {typedefs.WpwBuildOptionsConfig<"mocha">} */(this.buildOptions);
	}


	/**
     * @override
     * @param {typedefs.WpwBuild} build
	 * @returns {WpwMochaPlugin | undefined}
     */
	static create(build)
	{
		return build.options.types?.enabled ? new WpwMochaPlugin({ build }) : undefined;
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


module.exports = WpwMochaPlugin.create;
