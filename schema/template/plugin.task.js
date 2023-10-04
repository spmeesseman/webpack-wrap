// // @ts-check

/**
 * @file src/plugins/script.js
 * @version 0.0.1
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const typedefs = require("../types/typedefs");
const { apply } = require("@spmeesseman/type-utils");
const WpwError = require("@spmeesseman/webpack-wrap/utils/message");
const WpwBaseTaskPlugin = require("@spmeesseman/webpack-wrap/plugins/basetask");


/**
 * @extends WpwBaseTaskPlugin
 */
class WpwExampleTaskPlugin extends WpwBaseTaskPlugin
{
    /**
     * @param {typedefs.WpwPluginOptions} options
     */
	constructor(options)
	{
		super(apply({ taskHandler: "executeTaskBuild" }, options));
        this.buildOptions = /** @type {typedefs.WpwBuildOptionsConfig<"script">} */(this.buildOptions); // reset for typings
	}


	/**
     * @override
     * @param {typedefs.WpwBuild} build
	 * @returns {WpwExampleTaskPlugin | undefined}
     */
	static create = (build) => WpwExampleTaskPlugin.wrap(this, build, "script");


    /**
	 * @param {typedefs.WebpackCompilationAssets} assets
	 * @returns {Promise<void>}
	 */
    async executeTaskBuild(assets)
    {
		this.build.addError(new WpwError({ code: WpwError.Code.ERROR_NOT_IMPLEMENTED, message: "user plugin", compilation: this.conpilation }));
    }

}


module.exports = WpwExampleTaskPlugin.create;
