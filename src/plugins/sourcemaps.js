/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/sourcemaps.js
 * IMPORTANT NOTE:
 * This module contains project specifc code and the sync script should be modified
 * if necessary when changes are made to this file.
 * TODO - Make it not project specific somehow
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const WpwPlugin = require("./base");
// const { Compilation } = require("webpack");
const { apply, WpBuildError, requireResolve } = require("../utils");
// const CopyInMemoryPlugin = require("copy-asset-in-memory-webpack-plugin");
// const webpack = require("webpack");
/** @typedef {import("../types/typedefs").WebpackType} WebpackType */
const webpack = /** @type {WebpackType} */(requireResolve("webpack"));

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */
/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WpwPluginOptions} WpwPluginOptions */
/** @typedef {import("../types").WebpackCompilationAssets} WebpackCompilationAssets */
/** @typedef {import("../types").WpBuildPluginVendorOptions} WpBuildPluginVendorOptions */


/**
 * @extends WpwPlugin
 */
class WpBuildSourceMapPlugin extends WpwPlugin
{
	/**
	 * @param {WpwPluginOptions} options Plugin options to be applied
	 */
	constructor(options)
    {
        super(apply(options, { plugins: WpBuildSourceMapPlugin.vendorPlugins(options.app), registerVendorPluginsFirst: true }));
    }


    /**
     * Called by webpack runtime to initialize this plugin
     * @override
     * @param {WebpackCompiler} compiler the compiler instance
     */
    apply(compiler)
    {
		if (this.app.isMain)
		{
			this.onApply(compiler,
			{
				renameSourceMaps: {
					hook: "compilation",
					stage: "DEV_TOOLING",
					hookCompilation: "processAssets",
					callback: this.renameMap.bind(this)
				}
			});
		}
    }


    /**
     * @private
     * @param {WebpackCompilationAssets} assets
     */
    renameMap = (assets) =>
    {
        this.logger.write("rename sourcemaps with entry module contenthash", 1);
        if (this.app.global.runtimeVars)
        {
            Object.entries(assets).filter(([ file ]) => file.endsWith(".map")).forEach(([ file ]) =>
            {
                const asset = this.compilation.getAsset(file);
                if (asset)
                {
                    const entryHash = this.app.global.runtimeVars.next[this.fileNameStrip(file, true)],
                        newFile = this.fileNameStrip(file).replace(".js.map", `.${entryHash}.js.map`);
                    this.logger.write(`found sourcemap ${asset.name}, rename using contenthash italic(${entryHash})`, 2);
                    this.logger.value("   current filename", file, 3);
                    this.logger.value("   new filename", newFile, 3);
                    this.logger.value("   asset info", JSON.stringify(asset.info), 4);
                    this.compilation.renameAsset(file, newFile);
                    const srcAsset = this.compilation.getAsset(newFile.replace(".map", ""));
                    if (srcAsset && srcAsset.info.related && srcAsset.info.related.sourceMap)
                    {
                        const sources = this.compiler.webpack.sources,
                            { source, map } = srcAsset.source.sourceAndMap(),
                            newInfo = apply({ ...srcAsset.info }, { related: { ...srcAsset.info.related, sourceMap: newFile }});
                        let newSource = source;
                        this.logger.write("   update source entry asset with new sourcemap filename", 2);
                        this.logger.value("   source entry asset info", JSON.stringify(srcAsset.info), 4);
                        newSource = source.toString().replace(file, newFile);
                        this.compilation.updateAsset(srcAsset.name, new sources.SourceMapSource(newSource, srcAsset.name, map), newInfo);
                    }
                }
            });
        }
        else {
            this.app.addWarning("WPW");
        }
    };


	/**
	 * @private
	 * @param {WpBuildApp} app
	 * @returns {WpBuildPluginVendorOptions[]}
	 */
	static vendorPlugins = (app) =>
	{
		return [
        {
            ctor: webpack.SourceMapDevToolPlugin,
            options: {
                test: /\.(js|jsx)($|\?)/i,
                exclude: // !app.isTests ?
                        /(?:node_modules|(?:vendor|runtime|tests)(?:\.[a-f0-9]{16,})?\.js)/, // :
                                       //  /(?:node_modules|(?:vendor|runtime)(?:\.[a-f0-9]{16,})?\.js)/,
                // filename: "[name].js.map",
                filename: "[name].[contenthash].js.map",
                //
                // The bundled node_modules will produce reference tags within the main entry point
                // files in the form:
                //
                //     external commonjs "vscode"
                //     external-node commonjs "crypto"
                //     ...etc...
                //
                // This breaks the istanbul reporting library when the tests have completed and the
                // coverage report is being built (via nyc.report()).  Replace the quote and space
                // characters in this external reference name with filename firiendly characters.
                //
                /** @type {any} */moduleFilenameTemplate: (/** @type {any} */info) =>
                {
                    if ((/[\" \|]/).test(info.absoluteResourcePath)) {
                        return info.absoluteResourcePath.replace(/\"/g, "").replace(/[ \|]/g, "_");
                    }
                    return `${info.absoluteResourcePath}`;
                },
                fallbackModuleFilenameTemplate: "[absolute-resource-path]?[hash]"
            }
        }];
        // {
        //     ctor: CopyInMemoryPlugin,
        //     options: {
        //         test: /.js.map$/,
        //         stage: Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE, // Default
        //         to: (fileName) => fileName.replace(/[a-f0-9]{16,}\./, app.global.runtimeVars.next[fileName.replace(/[a-f0-9]{16,}\.js/, "")] + "."),
        //         deleteOriginalAssets: true
        //     }
        // }];
    };

}

/**
 * @param {WpBuildApp} app
 * @returns {(WpBuildSourceMapPlugin)[]}
 */
const sourcemaps = (app) => app.build.options.sourcemaps &&  app.isMain ?  new WpBuildSourceMapPlugin({ app }).getPlugins() : [];


module.exports = sourcemaps;
