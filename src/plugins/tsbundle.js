/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/types.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const WpwTscPlugin = require("./tsc");
const typedefs = require("../types/typedefs");
const { existsSync } = require("fs");
const { resolve } = require("path");
const { isString } = require("../utils");


/**
 * @extends WpwTscPlugin
 */
class WpwTsBundlePlugin extends WpwTscPlugin
{
    /**
     * @param {typedefs.WpwPluginOptions} options Plugin options to be applied
     */
	constructor(options) { super(options); }


	/**
     * @override
     * @param {typedefs.WpBuildApp} app
	 * @returns {WpwTsBundlePlugin | undefined}
     */
	static build = (app) =>
	{
		const typesOpts = app.build.options.types;
		if (typesOpts && typesOpts.enabled && typesOpts.bundle && typesOpts.mode === "plugin") {
			return new WpwTsBundlePlugin({ app });
		}
	};


    /**
     * Called by webpack runtime to initialize this plugin
     * @override
     * @param {typedefs.WebpackCompiler} compiler the compiler instance
     */
    apply(compiler)
    {
		const distPath = this.app.getDistPath({ build: "types" });
		const entry = this.app.wpc.entry[this.app.build.name] || this.app.wpc.entry.index;
		const entryFile = resolve(distPath, isString(entry) ? entry : (entry.import ? entry.import : (entry[0] ?? "")));
		if (entryFile && existsSync(entryFile) && this.app.isOnlyBuild)
		{
			this.onApply(compiler,
			{
				bundleDtsFiles: {
					async: true,
					hook: "compilation",
					stage: "DERIVED",
					statsProperty: "tsbundle",
					callback: () => this.bundleDts("tsbundle")
				}
			});
		}
        else
		{
			this.onApply(compiler,
			{
				bundleDtsFiles: {
					async: true,
					hook: "afterEmit",
					statsProperty: "tsbundle",
					callback: () => this.bundleDts("tsbundle")
				}
			});
		}
    }

}


module.exports = WpwTsBundlePlugin.build;
