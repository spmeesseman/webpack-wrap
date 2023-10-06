/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/runtimevars.js
 * @version 0.0.1
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman\
 *//** */

const WpwPlugin = require("./base");
const WpwError = require("../utils/message");
const typedefs = require("../types/typedefs");
const { isString, apply, isObjectEmpty, merge } = require("@spmeesseman/type-utils");


/**
 * @extends WpwPlugin
 */
class WpwHashPlugin extends WpwPlugin
{
    /**
     * @param {typedefs.WpwPluginOptions} options Plugin options to be applied
     */
	constructor(options)
    {
        super(apply(options, { globalCacheProps: [ "current", "next", "previous" ] }));
        this.buildOptions = /** @type {typedefs.WpwBuildOptionsConfig<"hash">} */(this.buildOptions); // reset for typings
    }


	/**
     * @override
     */
	static create = WpwHashPlugin.wrap.bind(this);


    /**
     * @override
     * @returns {typedefs.WpwPluginTapOptions}
     */
    onApply()
    {
        return {
            readPreviousContentashState: {
                hook: "beforeCompile",
                callback: this.readAssetState.bind(this)
            },
            verifyPreviousContentashState: {
                hook: "finishMake",
                callback: this.verifyAssetState.bind(this)
            },
            updateContenthashState: {
                hook: "compilation",
                hookCompilation: "chunkAsset",
                callback: this.updateAssetState.bind(this)
            },
            saveContenthashState: {
                hook: "afterEmit",
                callback: this.saveAssetState.bind(this)
            }
        };
    }


    /**
     * @private
     * @param {boolean} [rotated] `true` indicates that values were read and rotated
     * i.e. `next` values were moved to `current`, and `next` is now blank
     */
    logAssetInfo = (rotated) =>
    {
        const l = this.build.logger,
              hashInfo = this.globalCache;
        l.write("   previous:", 2);
        if (!isObjectEmpty(hashInfo.previous))
        {
            Object.keys(hashInfo.previous).forEach(k => l.writeMsgTag(`      ${k}`, hashInfo.current[k], 2, "", null, l.colors.grey));
        }
        else {
            l.write("      there are no previous hashes stored", 2);
        }
        l.write("   current:", 2);
        if (!isObjectEmpty(hashInfo.current))
        {
            Object.keys(hashInfo.current).forEach(k => l.writeMsgTag(`      ${k}`, hashInfo.current[k], 2, "", null, l.colors.grey));
        }
        else if (!isObjectEmpty(hashInfo.previous) && rotated === true) {
            l.write("      values cleared and moved to 'previous'", 2);
        }
        else {
            l.write("      there are no current hashes stored", 2);
        }
        l.write("   next:", 2);
        if (!isObjectEmpty(hashInfo.next))
        {
            Object.keys(hashInfo.current).forEach(k => l.writeMsgTag(`      ${k}`, hashInfo.next[k], 2, "", null, l.colors.grey));
        }
        else if (!isObjectEmpty(hashInfo.current) && rotated === true) {
            l.write("      values cleared and moved to 'current'", 2);
        }
    };


    /**
     * Reads stored / cached content hashes from file
     *
     * @private
     * @param {typedefs.WebpackCompilationParams} _params
     */
    readAssetState(_params)
    {
        const l = this.logger;
        l.write(`read asset state for build environment ${l.withColor(this.build.mode, l.colors.italic)}`, 1);
        const cache = this.cache.get();
        // apply(this.globalCache, cache);
        merge(this.globalCache, cache);
        this.globalCache.previous = merge(this.globalCache.previous, this.globalCache.current);
        this.globalCache.current = merge(this.globalCache.current, this.globalCache.next);
        this.globalCache.next = {};
        this.logAssetInfo(true);
        l.write("asset state read and cached", 1);
    };


    /**
     * Verifies stored / cached content hashes before new compilation
     *
     * @private
     * @param {typedefs.WebpackCompilation} compilation
     */
    verifyAssetState(compilation)
    {
        let changed = false;
        const build = this.build,
              logger = build.logger,
              hashCurrent = this.globalCache.current;
        Object.entries(compilation.getAssets()).filter(([ file, _ ]) => this.isEntryAsset(file)).forEach(([ file, _ ]) =>
		{
            const chunkName = this.fileNameStrip(file, true),
                  asset = this.compilation.getAsset(file);
            logger.write(`check asset italic(${chunkName}/${file})`, 2);
            if (asset && asset.info.contenthash)
            {
                if (isString(asset.info.contenthash))
                {
                    if (!hashCurrent[chunkName] || hashCurrent[chunkName] !==  asset.info.contenthash)
                    {
                        changed = true;
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
        if (changed) { this.logAssetInfo(); }
    };


    /**
     * Writes / caches asset content hashes to disk
     *
     * @private
     * @member saveAssetState
     */
    saveAssetState()
    {
        const l = this.logger;
        l.write(`save asset state for build environment ${l.withColor(this.build.mode, l.colors.italic)}`, 1);
        this.cache.set(this.globalCache);
        this.cache.save();
        this.logAssetInfo();
        l.write("asset state saved", 1);
    }


    /**
     * @private
     * @param {typedefs.WebpackChunk} chunk
     */
    updateAssetState(chunk)
    {
        if (chunk.name)
        {
            const hash = chunk.contentHash.javascript;
            if (hash)
            {
                this.logger.value(`update '${chunk.name}' contenthash`, hash, 1);
                this.globalCache.next[chunk.name] = hash;
                if (!this.globalCache.current[chunk.name]) {
                    this.globalCache.current[chunk.name] = hash;
                }
            }
            else {
                this.build.addMessage({
                    code: WpwError.Code.ERROR_GENERAL,
                    message: "failed to extract contenthash from chunk " + chunk.name
                });
            }
        }
    };

}


module.exports = WpwHashPlugin.create;
