/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/runtimevars.js
 * @version 0.0.1
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman\
 *//** */

const WpwPlugin = require("./base");
const typedefs = require("../types/typedefs");
const { apply } = require("@spmeesseman/type-utils");


/**
 * @extends WpwPlugin
 */
class WpwRuntimeVarsPlugin extends WpwPlugin
{
    /**
     * @param {typedefs.WpwPluginOptions} options Plugin options to be applied
     */
	constructor(options)
    {
        super(options);
        this.buildOptions = /** @type {typedefs.WpwBuildOptionsConfig<"runtimevars">} */(this.buildOptions); // reset for typings
    }


	/**
     * @override
     */
	static create = WpwRuntimeVarsPlugin.wrap.bind(this);


    /**
     * @override
     * @returns {typedefs.WpwPluginTapOptions}
     */
    onApply()
    {
        return {
            replaceContenthashRuntimeVars: {
                hook: "compilation",
                stage: "ADDITIONS",
                statsProperty: this.optionsKey,
                callback: this.runtimeVars.bind(this)
            }
        };
    }


    /**
     * @private
     * @param {typedefs.WebpackAssetInfo} info
     * @returns {typedefs.WebpackAssetInfo}
     */
    info = (info) => apply({ ...(info || {}) }, { runtimeVars: true });


    /**
     * @private
     * @param {typedefs.WebpackCompilationAssets} assets
     */
    runtimeVars(assets)
    {
        const updates = /** @type {string[]} */([]);
        this.logger.write("replace runtime placeholder variables", 1);
		Object.entries(assets).forEach(([ file ]) =>
		{
            if (this.isEntryAsset(file)) {
                this.logger.value("   queue asset for variable replacement", file, 3);
                updates.push(file);
            }
        });
        updates.forEach(
            (file) => this.compilation.updateAsset(file, source => this.source(file, source), this.info.bind(this))
        );
        this.logger.write("runtime placeholder variable replacement completed", 2);
    };


    /**
     * Performs all source code modifications
     * @private
     * @param {string} file
     * @param {typedefs.WebpackSource} sourceInfo
     * @returns {typedefs.WebpackSource}
     */
    source(file, sourceInfo)
    {
        let sourceCode = sourceInfo.source().toString();
        /* MOD 1 */sourceCode = this.sourceUpdateHashVars(sourceCode);
        return this.sourceObj(file, sourceCode, sourceInfo);
    }


    /**
     * @private
     * @param {string} file
     * @param {string | Buffer} content
     * @param {typedefs.WebpackSource} sourceInfo
     * @returns {typedefs.WebpackSource}
     */
    sourceObj(file, content, sourceInfo)
    {
        const { source, map } = sourceInfo.sourceAndMap();
        return map && (this.compiler.options.devtool || this.build.options.devtool?.enabled) ?
               new this.compiler.webpack.sources.SourceMapSource(content, file, map, source) :
               new this.compiler.webpack.sources.RawSource(content);
    }


    /**
     * Performs source code modifications for \_\__WPWRAP__\_\_[contentHash]
     * @private
     * @param {string} sourceCode
     * @returns {string}
     */
    sourceUpdateHashVars(sourceCode)
    {
        Object.entries(this.global.hash.next).forEach(([ chunkName, hash ]) =>
        {
            const regex = new RegExp(`(?:interface_[0-9]+\\.)?__WPWRAP__\\.contentHash(?:\\.|\\[")${chunkName}(?:"\\])? *(,|\r|\n)`, "gm");
            sourceCode = sourceCode.replace(regex, (_v, g) =>`"${hash}"${g}`);
        });
        return sourceCode;
    }

}


module.exports = WpwRuntimeVarsPlugin.create;
