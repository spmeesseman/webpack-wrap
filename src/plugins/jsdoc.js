/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/types.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 */

const WpBuilPlugin = require("./base");
const typedefs = require("../types/typedefs");
const { existsSync } = require("fs");
const { resolve } = require("path");
const { isString } = require("../utils");


/**
 * @extends WpBuilPlugin
 */
class WpwJsDocPlugin extends WpBuilPlugin
{
    /**
     * @param {typedefs.WpBuildPluginOptions} options Plugin options to be applied
     */
	constructor(options) { super(options); }


    /**
     * Called by webpack runtime to initialize this plugin
     * @override
     * @param {typedefs.WebpackCompiler} compiler the compiler instance
     */
    apply(compiler)
    {
        this.onApply(compiler,
        {
            generateJsDocs: {
                async: true,
                hook: "done",
                statsProperty: "jsdoc",
                callback: this.generateJsDocs.bind(this)
            }
        });
    }

	/**
	 * @param {typedefs.WebpackCompilation} compilation
	 * @returns {Promise<void>}
	 */
	generateJsDocs = async (compilation) =>
	{
		this.compilation = compilation;
	};

}


/**
 * @param {typedefs.WpBuildApp} app
 * @returns {WpwJsDocPlugin | undefined}
 */
const jsdoc = (app) => app.build.options.tsbundle ? new WpwJsDocPlugin({ app }) : undefined;


module.exports = jsdoc;
