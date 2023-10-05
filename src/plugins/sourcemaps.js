/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file src/plugins/sourcemaps.js
 * @version 0.0.1
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
     */
	static create = (build) =>
    {
        const devtoolConfig= build.options.devtool,
              outputConfig = build.options.output;
        if (devtoolConfig && devtoolConfig.enabled && (outputConfig?.hash !== false || devtoolConfig.syncHash !== false))
        {
            return WpwSourceMapsPlugin.wrap(build);
        }
    };


    /**
     * @override
     * @returns {typedefs.WpwPluginTapOptions | undefined}
     */
    onApply()
    {
        if (this.buildOptions.syncHash !== false)
        {
            return {
                renameSourceMaps: {
                    hook: "compilation",
                    stage: "DEV_TOOLING",
                    hookCompilation: "processAssets",
                    callback: this.renameMap.bind(this)
                }
            };
        }
    }


    /**
     * @private
     * @param {typedefs.WebpackCompilationAssets} assets
     */
    renameMap = (assets) =>
    {
        const l = this.logger.write("rename sourcemaps: replace filename hashes with corresponding entry module hash", 1),
              compilation = this.compilation;

        Object.entries(assets).filter(([ file ]) => file.endsWith(".map")).forEach(([ file ]) =>
        {
            const asset = compilation.getAsset(file);
            if (asset)
            {
                const entryHash = this.build.global.runtimeVars.next[this.fileNameStrip(file, true)],
                      newFile = this.fileNameStrip(file).replace(".js.map", `.${entryHash}.js.map`);
                l.write(`found sourcemap asset italic(${asset.name})`, 1);
                l.value("   current filename", file, 2);
                l.value("   new filename", newFile, 2);
                l.value("   asset info", JSON.stringify(asset.info), 3);
                compilation.renameAsset(file, newFile);
                const srcAsset = compilation.getAsset(newFile.replace(".map", ""));
                if (srcAsset && srcAsset.info.related && srcAsset.info.related.sourceMap)
                {
                    const sources = this.compiler.webpack.sources,
                          { source, map } = srcAsset.source.sourceAndMap(),
                          newInfo = apply({ ...srcAsset.info }, { related: { ...srcAsset.info.related, sourceMap: newFile }});
                    let newSource = source;
                    l.write("   update source entry asset with new sourcemap filename", 2);
                    l.value("   source entry asset info", JSON.stringify(srcAsset.info), 3);
                    newSource = source.toString().replace(file, newFile);
                    compilation.updateAsset(srcAsset.name, new sources.SourceMapSource(newSource, srcAsset.name, map), newInfo);
                }
            }
        });
    };


	/**
	 * @override
     * @param {true} [applyFirst]
	 * @returns {typedefs.WebpackPluginInstance | undefined}
	 */
	getVendorPlugin = (applyFirst) =>
	{
        if (applyFirst && this.buildOptions.mode === "plugin")
        {
            const outputOptions = this.build.options.output || {},
            hash = outputOptions.hash !== false;

            return new webpack.SourceMapDevToolPlugin(
            {
                test: /\.(js|jsx)($|\?)/i,
                filename: hash ? "[name].[contenthash].js.map" : "[name].js.map",
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
                fallbackModuleFilenameTemplate: hash ? "[absolute-resource-path]?[hash]" : "[absolute-resource-path]"
            });
        }
    };

}


module.exports = WpwSourceMapsPlugin.create;
