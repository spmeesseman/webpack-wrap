/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/istanbul.js
 * @version 0.0.1
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
     */
	static create = WpwMochaPlugin.wrap.bind(this);


    /**
     * @override
     */
    onApply() {}

}


module.exports = WpwMochaPlugin.create;
