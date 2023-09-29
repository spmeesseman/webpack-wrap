/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/runtimevars.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman\
 *//** */

const WpwPlugin = require("./base");
const typedefs = require("../types/typedefs");
const { isString, apply, isObjectEmpty, merge, WpwError } = require("../utils");


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
        super(apply(options, { globalCacheProps: [ "current", "next", "previous" ] }));
    }


    /**
     * @override
     * @returns {typedefs.WpwPluginTapOptions}
     */
    onApply()
    {
        return {
            getContenthashInfo: {
                hook: "compilation",
                stage: "PRE_PROCESS",
                callback: this.preprocess.bind(this)
            },
            replaceContenthashRuntimeVars: {
                hook: "compilation",
                stage: "ADDITIONS",
                statsProperty: "runtimeVars",
                callback: this.runtimeVars.bind(this)
            },
            saveNewContentHashInfo: {
                hook: "afterEmit",
                callback: this.saveAssetState.bind(this)
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
     * @param {boolean} [rotated] `true` indicates that values were read and rotated
     * i.e. `next` values were moved to `current`, and `next` is now blank
     */
    logAssetInfo = (rotated) =>
    {
        const logger = this.build.logger,
              hashInfo = this.globalCache,
              labelLength = this.build.log.pad.value || 45;
        logger.write(`${rotated ? "read" : "saved"} asset state for build environment ${logger.withColor(this.build.mode, logger.colors.italic)}`, 1);
        logger.write("   previous:", 2);
        if (!isObjectEmpty(hashInfo.current))
        {
            Object.keys(hashInfo.previous).forEach(
                (k) => logger.write(`      ${k.padEnd(labelLength - 7)} ` + logger.tag(hashInfo.current[k]), 2, "", 0, logger.colors.grey)
            );
        }
        else if (!isObjectEmpty(hashInfo.previous) && rotated === true) {
            logger.write("      there are no previous hashes stored", 2);
        }
        logger.write("   current:", 2);
        if (!isObjectEmpty(hashInfo.current))
        {
            Object.keys(hashInfo.current).forEach(
                (k) => logger.write(`      ${k.padEnd(labelLength - 7)} ` + logger.tag(hashInfo.current[k]), 2, "", 0, logger.colors.grey)
            );
        }
        else if (!isObjectEmpty(hashInfo.previous) && rotated === true) {
            logger.write("      values cleared and moved to 'previous'", 2);
        }
        logger.write("   next:", 2);
        if (!isObjectEmpty(hashInfo.next))
        {
            Object.keys(hashInfo.next).forEach(
                (k) => logger.write(`      ${k.padEnd(labelLength - 7)} ` + logger.tag(hashInfo.next[k]), 2, "", 0, logger.colors.grey)
            );
        }
        else if (!isObjectEmpty(hashInfo.current) && rotated === true) {
            logger.write("      values cleared and moved to 'current'", 2);
        }
    };


    /**
     * Collects content hashes from compiled assets
     * @param {typedefs.WebpackCompilationAssets} assets
     */
    preprocess = (assets) =>
    {
        const build = this.build,
              logger = build.logger,
              hashCurrent = this.globalCache.current;
        this.readAssetState();
        logger.write("validate cached hashes for all entry assets", 2);
        Object.entries(assets).filter(([ file, _ ]) => this.isEntryAsset(file)).forEach(([ file, _ ]) =>
		{
            const chunkName = this.fileNameStrip(file, true),
                  asset = this.compilation.getAsset(file);
            if (asset && asset.info.contenthash)
            {
                if (isString(asset.info.contenthash))
                {
                    if (!hashCurrent[chunkName] || hashCurrent[chunkName] !==  asset.info.contenthas)
                    {
                        hashCurrent[chunkName] = asset.info.contenthash;
                        logger.write(`updated ${hashCurrent[chunkName] ? "stale" : ""} contenthash for italic(${file})`, 2);
                        logger.value("   previous", hashCurrent[chunkName] || "n/a", 3);
                        logger.value("   new", asset.info.contenthash, 3);
                    }
                }
                else {
                    this.build.addMessage({
                        code: WpwError.Code.ERROR_GENERAL,
                        message: "Non-string content hash not supported yet: " + asset.name
                    });
                }
            }
        });
    };


    /**
     * Reads stored / cached content hashes from file
     * @private
     */
    readAssetState()
    {
        const build = this.build,
              cache = this.cache.get();
        // apply(this.globalCache, cache);
        merge(this.globalCache, cache);
        merge(this.globalCache.previous, { ...this.globalCache.current });
        merge(this.globalCache.current, { ...this.globalCache.next });
        this.globalCache.next = {};
        this.logAssetInfo(true);
    };


    /**
     * @private
     * @param {typedefs.WebpackCompilationAssets} assets
     */
    runtimeVars(assets)
    {
        const hashMap = this.globalCache.next,
              updates = /** @type {string[]} */([]);
        this.logger.write("replace runtime placeholder variables", 1);
		Object.entries(assets).forEach(([ file ]) =>
		{
            const asset = this.compilation.getAsset(file);
            if (asset && isString(asset.info.contenthash))
            {
                hashMap[this.fileNameStrip(file, true)] = asset.info.contenthash;
            }
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
     * Writes / caches asset content hashes to file
     * @private
     * @member saveAssetState
     */
    saveAssetState()
    {
        this.cache.set(this.globalCache);
        this.cache.save();
        this.logAssetInfo();
    }


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
        Object.entries(this.globalCache.next).forEach(([ chunkName, hash ]) =>
        {
            const regex = new RegExp(`(?:interface_[0-9]+\\.)?__WPWRAP__\\.contentHash(?:\\.|\\[")${chunkName}(?:"\\])? *(,|\r|\n)`, "gm");
            sourceCode = sourceCode.replace(regex, (_v, g) =>`"${hash}"${g}`);
        });
        return sourceCode;
    }

}


/**
 * Returns a `WpwRuntimeVarsPlugin` instance if appropriate for the current build
 * environment. Can be enabled/disable in .wpcrc.json by setting the `plugins.runtimevars`
 * property to a boolean value of  `true` or `false`
 * @param {typedefs.WpwBuild} build
 * @returns {WpwRuntimeVarsPlugin | undefined}
 */
const runtimevars = (build) => build.options.runtimevars ? new WpwRuntimeVarsPlugin({ build }) : undefined;


module.exports = runtimevars;
