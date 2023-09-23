/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file src/plugins/sourcemaps.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const WpwPlugin = require("./base");
const typedefs = require("../types/typedefs");
const { apply, requireResolve } = require("../utils");
const webpack = /** @type {typedefs.WebpackType} */(requireResolve("webpack"));


/**
 * @extends WpwPlugin
 */
class WpwSourceMapsPlugin extends WpwPlugin
{
    /**
     * @param {typedefs.WpwPluginOptions} options
     */
	constructor(options)
	{
		super(options);
        this.buildOptions = /** @type {typedefs.WpwBuildOptionsConfig<"devtool">} */(this.buildOptions); // reset for typings
	}


	/**
     * @override
     * @param {typedefs.WpwBuild} build
	 * @returns {WpwSourceMapsPlugin | undefined}
     */
	static create = (build) =>
    {
        const devtoolConfig= build.options.devtool,
              outputConfig = build.options.output;
        if (devtoolConfig && devtoolConfig.enabled && (outputConfig?.immutable !== false || devtoolConfig.syncHash !== false))
        {
            return WpwSourceMapsPlugin.wrap(WpwSourceMapsPlugin, build, "devtool");
        }
    };


    /**
     * Called by webpack runtime to initialize this plugin
     * @override
     * @param {typedefs.WebpackCompiler} compiler the compiler instance
     */
    apply(compiler)
    {
        if (this.buildOptions.syncHash !== false)
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
        else {
            this.onApply(compiler);
        }
    }


    /**
     * @private
     * @param {typedefs.WebpackCompilationAssets} assets
     */
    renameMap = (assets) =>
    {
        this.logger.write("rename sourcemaps with entry module contenthash", 1);
        Object.entries(assets).filter(([ file ]) => file.endsWith(".map")).forEach(([ file ]) =>
        {
            const asset = this.compilation.getAsset(file);
            if (asset)
            {
                const entryHash = this.build.global.runtimeVars.next[this.fileNameStrip(file, true)],
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
    };


	/**
	 * @override
	 * @returns {typedefs.WebpackPluginInstance | undefined}
	 */
	getVendorPlugin = () =>
	{
        if (this.buildOptions.mode === "plugin")
        {
            const outputOptions = this.build.options.output || {},
                  immutable = outputOptions.immutable !== false;

            return new webpack.SourceMapDevToolPlugin(
            {
                test: /\.(js|jsx)($|\?)/i,
                filename: immutable ? "[name].[contenthash].js.map" : "[name].js.map",
                exclude: /(?:node_modules|(?:vendor|runtime|tests)(?:\.[a-f0-9]{16,})?\.js)/,
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
                moduleFilenameTemplate: (/** @type {any} */info) =>
                {
                    if ((/[\" \|]/).test(info.absoluteResourcePath)) {
                        return info.absoluteResourcePath.replace(/\"/g, "").replace(/[ \|]/g, "_");
                    }
                    return `${info.absoluteResourcePath}`;
                },
                fallbackModuleFilenameTemplate: immutable ? "[absolute-resource-path]?[hash]" : "[absolute-resource-path]"
            });
        }
    };

}


module.exports = WpwSourceMapsPlugin.create;
