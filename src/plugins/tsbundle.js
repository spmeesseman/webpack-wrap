/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/types.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const WpBuildBaseTsPlugin = require("./tsc");
const typedefs = require("../types/typedefs");
const { existsSync } = require("fs");
const { resolve } = require("path");
const { isString } = require("../utils");


/**
 * @class WpBuildTsBundlePlugin
 */
class WpBuildTsBundlePlugin extends WpBuildBaseTsPlugin
{
    /**
     * @class WpBuildTsBundlePlugin
     * @param {typedefs.WpBuildPluginOptions} options Plugin options to be applied
     */
	constructor(options)
    {
		super(options);
    }

    /**
     * Called by webpack runtime to initialize this plugin
     *
     * @function
     * @override
     * @param {typedefs.WebpackCompiler} compiler the compiler instance
     */
    apply(compiler)
    {
		const distPath = this.app.getDistPath({ build: "types" });
		const entry = this.app.wpc.entry[this.app.build.name];
		const entryFile = resolve(distPath, isString(entry) ? entry : (entry.import ? entry.import : (entry[0] ?? "")));
		if (entryFile && existsSync(entryFile) && this.app.args.build === this.app.build.name)
		{
			this.onApply(compiler,
			{
				bundleDtsFiles: {
					hook: "compilation",
					stage: "DERIVED",
					statsProperty: "tsbundle",
					statsPropertyColor: this.app.build.log.color,
					callback: this.bundleDts.bind(this)
				}
			});
		}
        else
		{
			this.onApply(compiler,
			{
				bundleDtsFiles: {
					hook: "afterEmit",
					statsProperty: "tsbundle",
					statsPropertyColor: this.app.build.log.color,
					callback: this.bundleDtsAfterEmit.bind(this)
				}
			});
		}
    }

	/**
	 * @param {typedefs.WebpackCompilation} compilation
	 */
	bundleDtsAfterEmit = (compilation) =>
	{
		this.compilation = compilation;
		this.bundleDts(compilation.assets);
	};

}


/**
 * @param {typedefs.WpBuildApp} app
 * @returns {WpBuildTsBundlePlugin | undefined}
 */
const tsbundle = (app) => app.build.plugins.tsbundle ? new WpBuildTsBundlePlugin({ app }) : undefined;


module.exports = tsbundle;
