/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/istanbul.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const WpwPlugin = require("./base");
const { apply } = require("../utils");
const typedefs = require("../types/typedefs");


/**
 * @extends WpwPlugin
 */
class WpwIstanbulPlugin extends WpwPlugin
{
    /**
     * @protected
     * @type {typedefs.WpwBuildOptionsConfig<"istanbul">}
     */
    buildOptions;


    /**
     * @param {typedefs.WpwPluginOptions} options
     */
	constructor(options) { super(options); }


	/**
     * @override
     * @param {typedefs.WpwBuild} build
	 * @returns {WpwIstanbulPlugin | undefined}
     */
	static create(build)
	{
		return build.options.istanbul ? new WpwIstanbulPlugin({ build }) : undefined;
	}


    /**
     * @override
     * @param {typedefs.WebpackCompiler} compiler the compiler instance
     */
    apply(compiler)
    {
        this.onApply(compiler,
        {
            performCodeCoverageTasks: {
                hook: "compilation",
                stage: "ADDITIONS",
                statsProperty: "istanbul",
                callback: this.istanbulTags.bind(this)
            }
        });
    }


    /**
     * @private
     * @param {typedefs.WebpackCompilationAssets} assets
     */
    istanbulTags(assets)
    {
		this.logger.write("istanbul ignore tag insertion for external requires");
		Object.keys(assets).filter(f => this.isEntryAsset(f)).forEach((file) =>
		{
            this.logger.value("   update asset with tag insertion", file, 4);
            this.compilation.updateAsset(
                file, (source) => this.tagSource(file, source), (info) => apply({ ...(info || {}) }, { istanbul: true })
            );
        });
    }


    /**
     * @private
     * @param {string} file
     * @param {typedefs.WebpackSource} sourceInfo
     * @returns {typedefs.WebpackSource}
     */
    tagSource(file, sourceInfo)
    {
        const regex = /\n[ \t]*module\.exports \= require\(/gm,
              sourceCode = sourceInfo.source().toString().replace(regex, (v) => "/* istanbul ignore next */" + v),
              { source, map } = sourceInfo.sourceAndMap();
        return map && (this.compiler.options.devtool || this.build.options.devtool?.enabled) ?
               new this.compiler.webpack.sources.SourceMapSource(sourceCode, file, map, source) :
               new this.compiler.webpack.sources.RawSource(sourceCode);
    }


    // /**
    //  * @param {WebpackSource} sourceInfo
    //  * @param {WebpackCompiler} compiler
    //  */
    // source2(sourceInfo, compiler)
    // {
    //     // let cached = cache.get(old);
    //     // if (!cached || cached.comment !== comment) {
    //     //     const source = options.footer
    //     //         ? new ConcatSource(old, "\n", comment)
    //     //         : new ConcatSource(comment, "\n", old);
    //     //     cache.set(old, { source, comment });
    //     //     return source;
    //     // }
    //     // return cached.source;
    //     const { source, map } = osourceInfold.sourceAndMap(),
    //           regex = /\n[ \t]*module\.exports \= require\(/gm,
    //           content = source.toString().replace(regex, (v) => "/* istanbul ignore next */" + v);
    //     return map && (compiler.options.devtool || this.build.plugins.sourcemaps) ?
    //            new compiler.webpack.sources.SourceMapSource(content, file, map) :
    //            new compiler.webpack.sources.RawSource(content);
    // }

    // const { createInstrumenter } = require("istanbul-lib-instrument");
    //
    // /** @typedef {import("../types").WebpackStatsAsset} WebpackStatsAsset */
    // /** @typedef {import("../types").WebpackPluginInstance} WebpackPluginInstance */
    //
    //
    // /**
    //  * @param {WpwBuild} build
    //  * @returns {WebpackPluginInstance | undefined}
    //  */
    // const istanbul = (build) =>
    // {
    //     /** @type {WebpackPluginInstance | undefined} */
    //     let plugin;
    //     // if (build.plugins.instrument !== false && build === "extension" && build.mode === "test")
    //     // {
    //     //     plugin =
    //     //     {
    //     //         apply: (compiler) =>
    //     //         {
    //     //             compiler.hooks.compilation.tap("CompileThisCompilationPlugin_STAGE_ADDITIONS", (compilation) =>
    //     //             {
    //     //                 // const cache = compilation.getCache("CompileThisCompilationPlugin"),
    //     //                 //       logger = compilation.getLogger("CompileProcessAssetsCompilationPlugin");
    //     //                 compilation.hooks.processAssets.tap(
    //     //                 {
    //     //                     name: "CompileProcessAssets_STAGE_ADDITIONS",
    //     //                     stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
    //     //                 },
    //     //                 (assets) =>
    //     //                 {
    //     //                     const entriesRgx = `(?:${Object.keys(wpConfig.entry).reduce((e, c) => `${!!c ? `${c}|` : c}${e}`, "")})`;
    //     //                     const instrumenter = createInstrumenter(
    //     //                     {   // coverageGlobalScopeFunc: false,
    //     //                         // coverageGlobalScope: "window",
    //     //                         coverageVariable: "__coverage__",
    //     //                         preserveComments: true,
    //     //                         produceSourceMap: true,
    //     //                         autoWrap: true,
    //     //                         esModules: true,
    //     //                         compact: false,
    //     //                     });
    //     //                     Object.entries(assets).filter(a => new RegExp(entriesRgx).test(a[0])).forEach(a =>
    //     //                     {
    //     //                         // const shouldInstrument = testExclude.shouldInstrument(fileName);
    //     //                         // if (shouldInstrument)
    //     //                         // {
    //     //                         const fileName = a[0],
    //     //                               { source, map } = a[1].sourceAndMap(),
    //     //                               sourceMap = sanitizeSourceMap(map),
    //     //                               instrumented = instrumenter.instrumentSync(source.toString(), fileName, sourceMap);
    //     //                         compilation.updateAsset(fileName, new compiler.webpack.sources.RawSource(instrumented));
    //     //                         // }
    //     //                     });
    //     //                     // if (compilation.hooks.statsPrinter)
    //     //                     // {
    //     //                     //     compilation.hooks.statsPrinter.tap("CompileThisCompilationPlugin", (stats) =>
    //     //                     //     {
    //     //                     //         stats.hooks.print.for("asset.info.copied").tap(
    //     //                     //             "CompileProcessAssetsCompilationPlugin",
    //     //                     //             (copied, { green, formatFlag }) => {
    //     //                     //                 return copied ? /** @type {Function} */(green)(/** @type {Function} */(formatFlag)("copied")) : ""
    //     //                     //             }
    //     //                     //         );
    //     //                     //     });
    //     //                     // }
    //     //                 });
    //     //             });
    //     //         }
    //     //     };
    //     // }
    // //     return plugin;
    // // };


    // const sanitizeSourceMap = (rawSourceMap) =>
    // {
    //     // Delete sourcesContent since it is optional and if it contains process.env.NODE_ENV vite will break when trying to replace it
    //     const { sourcesContent, ...sourceMap } = rawSourceMap;
    //     // JSON parse/stringify trick required for istanbul to accept the SourceMap
    //     return JSON.parse(JSON.stringify(sourceMap));
    // };
}


module.exports = WpwIstanbulPlugin.create;
