/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/types.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const WpBuildBaseTsPlugin = require("./tsc");
const typedefs = require("../types/typedefs");
const { existsSync } = require("fs");
const { resolve } = require("path");
const { isString } = require("../utils");


/**
 * @extends WpBuildBaseTsPlugin
 */
class WpBuildTsBundlePlugin extends WpBuildBaseTsPlugin
{
    /**
     * @param {typedefs.WpwPluginOptions} options Plugin options to be applied
     */
	constructor(options) { super(options); }


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
					callback: this.bundleDts.bind(this)
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
					callback: this.bundleDtsAfterEmit.bind(this)
				}
			});
		}
    }

	/**
	 * @param {typedefs.WebpackCompilation} compilation
	 * @returns {Promise<void>}
	 */
	bundleDtsAfterEmit = (compilation) =>
	{
		this.compilation = compilation;
		return this.bundleDts(compilation.assets);
	};

}


/**
 * @param {typedefs.WpBuildApp} app
 * @returns {WpBuildTsBundlePlugin | undefined}
 */
const tsbundle = (app) => app.build.options.types?.bundle ? new WpBuildTsBundlePlugin({ app }) : undefined;


module.exports = tsbundle;
