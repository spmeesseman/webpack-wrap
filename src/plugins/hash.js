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
     * @param {typedefs.WpwBuild} build
	 * @returns {WpwHashPlugin | undefined}
     */
	static create = (build) => WpwHashPlugin.wrap(this, build, "hash");


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
     * Reads stored / cached content hashes from file
     *
     * @private
     * @param {typedefs.WebpackCompilationParams} _params
     */
    readAssetState(_params)
    {
        const cache = this.cache.get();
        // apply(this.globalCache, cache);
        merge(this.globalCache, cache);
        this.globalCache.previous = merge(this.globalCache.previous, this.globalCache.current);
        this.globalCache.current = merge(this.globalCache.current, this.globalCache.next);
        this.globalCache.next = {};
        this.logAssetInfo(true);
    };


    /**
     * Reads stored / cached content hashes from file
     *
     * @private
     * @param {typedefs.WebpackCompilation} compilation
     */
    verifyAssetState(compilation)
    {
        const build = this.build,
              logger = build.logger,
              hashCurrent = this.globalCache.current;
        Object.entries(compilation.getAssets()).filter(([ file, _ ]) => this.isEntryAsset(file)).forEach(([ file, _ ]) =>
		{
            const chunkName = this.fileNameStrip(file, true),
                  asset = this.compilation.getAsset(file);
            if (asset && asset.info.contenthash)
            {
                if (isString(asset.info.contenthash))
                {
                    if (!hashCurrent[chunkName] || hashCurrent[chunkName] !==  asset.info.contenthash)
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
        this.logAssetInfo();
    };


    /**
     * Writes / caches asset content hashes to file
     *
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
                    message: "failed to extrat contenthash from chunk " + chunk.name
                });
            }
        }
    };


    /**
     * @private
     */
    updateAssetState2()
    {
        Object.entries(this.compilation.getAssets()).filter(([ file, _ ]) => this.isEntryAsset(file)).forEach(([ file, _ ]) =>
		{
            const chunkName = this.fileNameStrip(file, true),
                  asset = this.compilation.getAsset(file);
            if (asset && asset.info.contenthash)
            {
                if (isString(asset.info.contenthash))
                {
                    this.globalCache.next[chunkName] = asset.info.contenthash;
                }
                else {
                    this.build.addMessage({
                        code: WpwError.Code.ERROR_GENERAL,
                        message: "Non-string content hash not supported yet: " + asset.name
                    });
                }
            }
        });
        this.logAssetInfo();
    };

}


module.exports = WpwHashPlugin.create;
