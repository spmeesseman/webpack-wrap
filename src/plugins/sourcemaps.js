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
const WpBuildApp = require("../core/app");
const WpwError = require("../utils/message");
const typedefs = require("../types/typedefs");
// const { Compilation } = require("webpack");
const { apply, requireResolve } = require("../utils");
// const CopyInMemoryPlugin = require("copy-asset-in-memory-webpack-plugin");
// const webpack = require("webpack");
/** @typedef {import("../types/typedefs").WebpackType} WebpackType */
const webpack = /** @type {WebpackType} */(requireResolve("webpack"));


/**
 * @extends WpwPlugin
 */
class WpBuildSourceMapsPlugin extends WpwPlugin
{
    /** @type {typedefs.WpwBuildOptionsConfig<"sourcemaps">} @private */
    buildOptions;

	/**
	 * @param {typedefs.WpwPluginOptions} options Plugin options to be applied
	 */
	constructor(options)
	{
        super(apply(options, { registerVendorPluginsFirst: true }));
        this.buildOptions = /** @type {typedefs.WpwBuildOptionsConfig<"sourcemaps">} */(this.app.build.options.types);
	}


	/**
     * @override
     * @param {WpBuildApp} app
	 * @returns {WpBuildSourceMapsPlugin | undefined}
     */
	static build = (app) =>
        app.build.options.sourcemaps ? WpwPlugin.wrap(WpBuildSourceMapsPlugin, app, "sourcemaps") : undefined;


    /**
     * Called by webpack runtime to initialize this plugin
     * @override
     * @param {typedefs.WebpackCompiler} compiler the compiler instance
     */
    apply(compiler)
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


    /**
     * @private
     * @param {typedefs.WebpackCompilationAssets} assets
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
            this.app.addWarning(WpwError.Msg.WARNING_SOURCEMAPS_RUNTIMEVARS_NOT_SET);
        }
    };


	/**
	 * @override
	 * @returns {typedefs.WebpackPluginInstance}
	 */
	getVendorPlugin = () =>
	{
		return new webpack.SourceMapDevToolPlugin(
        {
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
        });
    };

}


module.exports = WpBuildSourceMapsPlugin.build;
