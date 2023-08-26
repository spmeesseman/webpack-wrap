/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/runtimevars.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 *
 * @description
 *
 * When adding a new plugin, perform the following tasks:
 *
 *     1. Add the plugin filename (w/o extnsion) to the `WpBuildPluginName` type near the
 *        top of the WpBuild types file
 *        file:///c:\Projects\vscode-taskexplorer\webpack\types\wpbuild.d.ts
 *
 *     2. Adjust the default application object's plugins hash by adding the plugin filename
 *        (w/o/ extension) as a key of the `plugins()` return object
 *        file:///:\Projects\vscode-taskexplorer\webpack\utils\environment.js
 *
 *     3. Adjust the rc configuration files by adding the plugin filename (w/o/ extension)
 *        as a key of the `plugins` object in both the schema json file and the defaults file
 *        file:///c:\Projects\vscode-taskexplorer\webpack\schema\.wpbuildrc.schema.json
 *        file:///c:\Projects\vscode-taskexplorer\webpack\schema\.wpbuildrc.defaults.json
 *
 *     4. Run the `generate-wpbuild-types` script / npm task to rebyuild rc.d.ts definition file
 *        file:///c:\Projects\vscode-taskexplorer\webpack\.wpbuildrc.json
 *        file:///c:\Projects\vscode-taskexplorer\webpack\schema\.wpbuildrc.schema.json
 *
 *     5. Add a module reference to plugin directory index file and add to it's module.exports
 *        file://c:\Projects\vscode-taskexplorer\webpack\plugin\index.js
 *
 *     6.  Add the module into the modulke in the webpack exports byt importing and placing it
 *         in an appropriate position in the configuraation plugin array.
 *         file:///c:\Projects\vscode-taskexplorer\webpack\exports\plugins.js
 */

const WpBuildPlugin = require("./base");
const { isString, apply, isObjectEmpty, merge, WpBuildError } = require("../utils");

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */
/** @typedef {import("../types").WebpackSource} WebpackSource */
/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WebpackAssetInfo} WebpackAssetInfo */
/** @typedef {import("../types").WebpackCompilation} WebpackCompilation */
/** @typedef {import("./base").WpBuildPluginOptions} WpBuildPluginOptions */
/** @typedef {import("../types").WebpackCompilationAssets} WebpackCompilationAssets */


/**
 * @class WpBuildRuntimeVarsPlugin
 */
class WpBuildRuntimeVarsPlugin extends WpBuildPlugin
{
    /**
     * @class WpBuildRuntimeVarsPlugin
     * @param {WpBuildPluginOptions} options Plugin options to be applied
     */
	constructor(options)
    {
        super(apply(options, { globalCacheProps: [ "current", "next", "previous" ] }));
    }


    /**
     * @function Called by webpack runtime to initialize this plugin
     * @public
     * @override
     * @member apply
     * @param {WebpackCompiler} compiler the compiler instance
     */
    apply(compiler)
    {
        this.onApply(compiler,
        {
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
        });
    }


    /**
     * @function
     * @private
     * @member info
     * @param {WebpackAssetInfo} info
     * @returns {WebpackAssetInfo}
     */
    info = (info) => apply({ ...(info || {}) }, { runtimeVars: true });


    /**
     * @function
     * @private
     * @member logAssetInfo
     * @param {boolean} [rotated] `true` indicates that values were read and rotated
     * i.e. `next` values were moved to `current`, and `next` is now blank
     */
    logAssetInfo = (rotated) =>
    {
        const logger = this.app.logger,
              hashInfo = this.app.global.runtimeVars,
              labelLength = this.app.build.log.pad.value || 45;
        logger.write(`${rotated ? "read" : "saved"} asset state for build environment ${logger.withColor(this.app.mode, logger.colors.italic)}`, 1);
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
     * @function Collects content hashes from compiled assets
     * @private
     * @member preprocess
     * @param {WebpackCompilationAssets} assets
     */
    preprocess = (assets) =>
    {
        const app = this.app,
              logger = app.logger,
              hashCurrent = app.global.runtimeVars.current;
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
                    this.compilation.warnings.push(
                        new WpBuildError("Non-string content hash not supported yet: " + asset.name, "runtimevars.js")
                    );
                }
            }
        });
    };


    /**
     * @function Reads stored / cached content hashes from file
     * @private
     * @member readAssetState
     */
    readAssetState()
    {
        const app = this.app,
              cache = this.cache.get();
        // apply(app.global.runtimeVars, cache);
        merge(app.global.runtimeVars, cache);
        merge(app.global.runtimeVars.previous, { ...app.global.runtimeVars.current });
        merge(app.global.runtimeVars.current, { ...app.global.runtimeVars.next });
        app.global.runtimeVars.next = {};
        this.logAssetInfo(true);
    };


    /**
     * @function
     * @private
     * @member runtimeVars
     * @param {WebpackCompilationAssets} assets
     */
    runtimeVars(assets)
    {
        const hashMap = this.app.global.runtimeVars.next,
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
     * @function Writes / caches asset content hashes to file
     * @private
     * @member saveAssetState
     */
    saveAssetState()
    {
        this.cache.set(this.app.global.runtimeVars);
        this.cache.save();
        this.logAssetInfo();
    }


    /**
     * @function Performs all source code modifications
     * @private
     * @member source
     * @param {string} file
     * @param {WebpackSource} sourceInfo
     * @returns {WebpackSource}
     */
    source(file, sourceInfo)
    {
        let sourceCode = sourceInfo.source().toString();
        /* MOD 1 */sourceCode = this.sourceUpdateHashVars(sourceCode);
        return this.sourceObj(file, sourceCode, sourceInfo);
    }


    /**
     * @function
     * @private
     * @member sourceObj
     * @param {string} file
     * @param {string | Buffer} content
     * @param {WebpackSource} sourceInfo
     * @returns {WebpackSource}
     */
    sourceObj(file, content, sourceInfo)
    {
        const { source, map } = sourceInfo.sourceAndMap();
        return map && (this.compiler.options.devtool || this.app.build.options.sourcemaps) ?
               new this.compiler.webpack.sources.SourceMapSource(content, file, map, source) :
               new this.compiler.webpack.sources.RawSource(content);
    }


    /**
     * @function Performs source code modifications for \_\_WPBUILD\_\_[contentHash]
     * @private
     * @member sourceUpdateHashVars
     * @param {string} sourceCode
     * @returns {string}
     */
    sourceUpdateHashVars(sourceCode)
    {
        Object.entries(this.app.global.runtimeVars.next).forEach(([ chunkName, hash ]) =>
        {
            const regex = new RegExp(`(?:interface_[0-9]+\\.)?__WPBUILD__\\.contentHash(?:\\.|\\[")${chunkName}(?:"\\])? *(,|\r|\n)`, "gm");
            sourceCode = sourceCode.replace(regex, (_v, g) =>`"${hash}"${g}`);
        });
        return sourceCode;
    }

}


/**
 * Returns a `WpBuildRuntimeVarsPlugin` instance if appropriate for the current build
 * environment. Can be enabled/disable in .wpconfigrc.json by setting the `plugins.runtimevars`
 * property to a boolean value of  `true` or `false`
 * @function
 * @module
 * @param {WpBuildApp} app
 * @returns {WpBuildRuntimeVarsPlugin | undefined}
 */
const runtimevars = (app) => app.build.options.runtimevars && app.isMain ? new WpBuildRuntimeVarsPlugin({ app }) : undefined;


module.exports = runtimevars;
