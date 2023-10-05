/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/runtimevars.js
 * @version 0.0.1
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman\
 *//** */

const WpwPlugin = require("./base");
const WpwError = require("../utils/message");
const typedefs = require("../types/typedefs");
const { isString, apply, isObjectEmpty, merge } = require("@spmeesseman/type-utils");


/**
 * @extends WpwPlugin
 */
class WpwReleasePlugin extends WpwPlugin
{
    /**
     * @param {typedefs.WpwPluginOptions} options Plugin options to be applied
     */
	constructor(options)
    {
        super(options);
        this.buildOptions = /** @type {typedefs.WpwBuildOptionsConfig<"release">} */(this.buildOptions); // reset for typings
    }


	/**
     * @override
     */
	static create = WpwReleasePlugin.wrap.bind(this);


    /**
     * @override
     * @returns {typedefs.WpwPluginTapOptions}
     */
    onApply()
    {
        return {
            executeRelease: {
                hook: "done",
                callback: this.executeRelease.bind(this)
            }
        };
    }


    /**
     * @private
     */
    executeRelease()
    {
    }

}


module.exports = WpwReleasePlugin.create;
