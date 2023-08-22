/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/base.js
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
 *        as a key of the `plugins` object in both this project's rc file and the schema json.
 *        file:///c:\Projects\vscode-taskexplorer\webpack\.wpbuildrc.json
 *        file:///c:\Projects\vscode-taskexplorer\webpack\types\.wpbuildrc.schema.json
 *
 *     4. Add a module reference to plugin directory index file and add to it's module.exports
 *        file://c:\Projects\vscode-taskexplorer\webpack\plugin\index.js
 *
 *     5.  Add the module into the modulke in the webpack exports byt importing and placing it
 *         in an appropriate position in the configuraation plugin array.
 *         file:///c:\Projects\vscode-taskexplorer\webpack\exports\plugins.js
 */

const { readFile } = require("fs/promises");
const typedefs = require("../types/typedefs");
const { relative, basename } = require("path");
const { WebpackError, ModuleFilenameHelpers } = require("webpack");
const { isFunction, mergeIf, execAsync, WpBuildCache, isString, WpBuildError, lowerCaseFirstChar } = require("../utils");

//
// TODO: remove this typedef when all plugins have been converted to using typedefs definition file
//
/** @typedef {typedefs.WpBuildPluginOptions} WpBuildPluginOptions */


/**
 * @class WpBuildHashPlugin
 * @abstract
 */
class WpBuildPlugin
{
    /**
     * @protected
     */
    cache;
    /**
     * @type {typedefs.WebpackCompilation}
     * @protected
     */
    compilation;
    /**
     * @type {typedefs.WebpackCompiler} compiler
     * @protected
     */
    compiler;
    /**
     * @type {typedefs.WpBuildApp}
     * @protected
     */
    app;
    /**
     * @protected
     */
    hashDigestLength;
    /**
     * @protected
     * @type {typedefs.WpBuildConsoleLogger}
     */
    logger;
    /**
     * @protected
     */
    name;
    /**
     * @protected
     */
    options;
    /**
     * @private
     */
    plugins;
    /**
     * Runtime compiler cache
     * @protected
     * @type {typedefs.WebpackCacheFacade}
     */
    wpCache;
    /**
     * Runtime compilation cache
     * @type {typedefs.WebpackCacheFacade}
     * @protected
     */
    wpCacheCompilation;
    /**
     * @protected
     */
    wpConfig;
    /**
     * @type {typedefs.WebpackLogger}
     * @protected
     */
    wpLogger;


    /**
     * @class WpBuildPlugin
     * @param {typedefs.WpBuildPluginOptions} options Plugin options to be applied
     */
	constructor(options)
    {
        this.validatePluginOptions(options);
        this.app = options.app;
        this.logger = this.app.logger;
        this.wpConfig = options.app.wpc;
        this.name = this.constructor.name;
        this.options = /** @type {typedefs.WpBuildPluginOptionsRequired} */(mergeIf(options, { plugins: [] }));
        this.hashDigestLength = this.app.wpc.output.hashDigestLength || 20;
        this.initGlobalCache();
        this.cache = new WpBuildCache(this.app, `plugincache_${this.app.mode}_${this.name.replace(/WpBuild|Plugin/g, "")}.json`);
        if (options.wrapPlugin) {
            this.plugins = [ ...this.options.plugins.map(p => new p.ctor(this.getOptions())), this ];
        }
        else if (options.registerVendorPluginsOnly) {
            this.plugins = [ ...this.options.plugins.map(p => new p.ctor(p.options)) ];
        }
        else if (options.registerVendorPluginsFirst) {
            this.plugins = [ ...this.options.plugins.map(p => new p.ctor(p.options)), this ];
        }
        else {
            this.plugins = [ this, ...this.options.plugins.map(p => new p.ctor(p.options)) ];
        }
    }


    /**
     * Called by webpack runtime to initialize this plugin.  To be overridden by inheriting class.
     * @function
     * @public
     * @abstract
     * @param {typedefs.WebpackCompiler} compiler the compiler instance
     */
    apply(compiler) { this.compiler = compiler; }


    /**
     * Break property name into separate spaced words at each camel cased character
     * @function
     * @private
     * @param {string} prop
     * @returns {string}
     */
    breakProp = (prop) => prop.replace(/_/g, "")
                          .replace(/[A-Z]{2,}/g, (v) => v[0] + v.substring(1).toLowerCase())
                          .replace(/[a-z][A-Z]/g, (v) => `${v[0]} ${v[1]}`).toLowerCase();

    /**
     * @function
     * @protected
     * @async
     * @param {string} filePath
     * @param {string} identifier
     * @param {string} outputDir Output directory of build
     * @param {typedefs.WebpackRawSource | undefined} source
     * @returns {Promise<typedefs.CacheResult>}
     */
    checkSnapshot = async (filePath, identifier, outputDir, source) =>
    {
        let data, /** @type {typedefs.CacheResult} */cacheEntry;
        const logger = this.logger,
              filePathRel = relative(outputDir, filePath),
              /** @type {typedefs.CacheResult} */result = { file: basename(filePathRel), snapshot: null, source };

        logger.value("   check cache for existing asset", filePathRel, 3);
        try {
            cacheEntry = await this.wpCacheCompilation.getPromise(`${filePath}|${identifier}`, null);
        }
        catch (e) {
            this.handleError(e, "failed while checking cache");
            return result;
        }

        if (cacheEntry && cacheEntry.snapshot)
        {
            let isValidSnapshot;
            logger.value("   check snapshot valid", filePathRel, 4);
            try {
                isValidSnapshot = await this.checkSnapshotValid(cacheEntry.snapshot);
            }
            catch (e) {
                this.handleError(e, "failed while checking snapshot");
                return result;
            }
            if (isValidSnapshot)
            {
                logger.value("   snapshot valid", filePathRel, 4);
                ({ source } = cacheEntry);
            }
            else {
                logger.write(`   snapshot for '${filePathRel}' is invalid`, 4);
            }
        }

        if (!source)
        {
            const startTime = Date.now();
            data = data || await readFile(filePath);
            source = new this.compiler.webpack.sources.RawSource(data);
            logger.value("   create snapshot", filePathRel, 4);
            try {
                result.snapshot = await this.createSnapshot(startTime, filePath);
            }
            catch (e) {
                this.handleError(e, "failed while creating snapshot");
                return result;
            }
            if (source && result.snapshot)
            {
                logger.value("   cache snapshot", filePathRel, 4);
                try {
                    const hash = this.getContentHash(source.buffer());
                    result.snapshot.setFileHashes(hash);
                    await this.wpCacheCompilation.storePromise(`${filePath}|${identifier}`, null, { source, snapshot: result.snapshot, hash });
                    result.source = source;
                }
                catch (e) {
                    this.handleError(e, "failed while caching snapshot");
                    return result;
                }
            }
        }

        return result;
    };


    /**
     * @function
     * @protected
     * @async
     * @param {string} filePath
     * @param {string} identifier
     * @param {string} outputDir Output directory of build
     * @returns {Promise<boolean>}
     */
    checkSnapshotExists = async (filePath, identifier, outputDir) =>
    {
        const logger = this.logger,
              filePathRel = relative(outputDir, filePath);
        let /** @type {typedefs.CacheResult | undefined} */cacheEntry;
        logger.value("   check cache for existing asset snapshot", filePathRel, 3);
        try {
            cacheEntry = await this.wpCacheCompilation.getPromise(`${filePath}|${identifier}`, null);
        }
        catch (e) {
            this.handleError(e, "failed while checking if cached snapshot exists");
        }
        return !!cacheEntry && !!cacheEntry.snapshot;
    };


	/**
	 * @function
	 * @protected
	 * @async
	 * @param {typedefs.WebpackSnapshot} snapshot
	 * @returns {Promise<boolean | undefined>}
	 */
	checkSnapshotValid = async (snapshot) =>
	{
		return new Promise((resolve, reject) =>
		{
			this.compilation.fileSystemInfo.checkSnapshotValid(snapshot, (e, isValid) => { if (e) { reject(e); } else { resolve(isValid); }});
		});
	};


	/**
	 * @function
	 * @protected
	 * @async
	 * @param {number} startTime
	 * @param {string} dependency
	 * @returns {Promise<typedefs.WebpackSnapshot | undefined | null>}
	 */
	createSnapshot = async (startTime, dependency) =>
	{
		return new Promise((resolve, reject) =>
		{
			this.compilation.fileSystemInfo.createSnapshot(startTime, [ dependency ], // @ts-ignore
				undefined, undefined, null, (e, snapshot) => { if (e) { reject(e); } else { resolve(snapshot); }}
			);
		});
	};


	/**
	 * @function Executes a command via a promisified node exec()
	 * @param {string} command
	 * @param {string} program
	 * @param {string | string[]} [ignoreOut]
	 * @returns {Promise<number | null>}
	 */
	exec = (command, program, ignoreOut) =>
        execAsync({ command, program, logger: this.logger, execOptions: { cwd: this.app.getRcPath("base") }, ignoreOut });



	/**
	 * @function
	 * @protected
	 * @param {string} file
	 * @param {boolean} [rmvExt] Remove file extension
	 * @returns {string}
	 */
    fileNameStrip = (file, rmvExt) =>
    {
        let newFile = file.replace(new RegExp(`\\.[a-f0-9]{${this.hashDigestLength},}`), "");
        if (rmvExt) {
            newFile = newFile.replace(/\.js(?:\.map)?/, "");
        }
        return newFile;
    };


	/**
	 * @function
	 * @protected
	 * @returns {RegExp}
	 */
    fileNameHashRegex = () => new RegExp(`\\.[a-z0-9]{${this.hashDigestLength},}`);


	/**
	 * @function
	 * @protected
	 * @param {Buffer} source
	 * @returns {string}
	 */
	getContentHash(source)
	{
		const {hashDigest, hashDigestLength, hashFunction, hashSalt } = this.compilation.outputOptions,
			  hash = this.compiler.webpack.util.createHash(/** @type {string} */hashFunction);
		if (hashSalt) {
			hash.update(hashSalt);
		}
		return hash.update(source).digest(hashDigest).toString().slice(0, hashDigestLength);
	}


    /**
     * @function
     * @public
     * @static
     * @param {typedefs.WpBuildWebpackConfig} wpConfig Webpack config object
     * @param {boolean} [dbg]
     * @param {boolean} [ext]
     * @param {boolean} [hash]
     * @returns {RegExp}
     */
    static getEntriesRegex = (wpConfig, dbg, ext, hash) =>
    {
        return new RegExp(
            `(?:${Object.keys(wpConfig.entry).reduce((e, c) => `${e ? e + "|" : ""}${c}`, "")})` +
            `(?:\\.debug)${!dbg ? "?" : ""}(?:\\.[a-z0-9]{${wpConfig.output.hashDigestLength || 20}})` +
            `${!hash ? "?" : ""}(?:\\.js|\\.js\\.map)${!ext ? "?" : ""}`
        );
    };


    /**
     * @function
     * @protected
     * @abstract
     */
    getOptions() {}


    /**
     * @function
     * @public
     * @returns {(typedefs.WebpackPluginInstance | InstanceType<WpBuildPlugin>)[]}
     */
    getPlugins() { return this.plugins; }


	/**
	 * @function
	 * @protected
	 * @param {Error | WebpackError | string} e
	 * @param {string | undefined | null | false | 0} [msgOrFile]
	 * @param {string | undefined} [fileOrDetails]
	 * @param {string | undefined} [details]
	 */
	handleError(e, msgOrFile, fileOrDetails, details)
	{
        if (isString(e))
        {
            e = msgOrFile ? new WpBuildError(e, msgOrFile, fileOrDetails) : new WebpackError(e);
        }
        else if (!(e instanceof WebpackError) && !(e instanceof WpBuildError))
        {
            this.app.logger.error(msgOrFile ?? "an error has occurred");
            if (!fileOrDetails) {
                e = new WebpackError(e.message);
            }
            else {
                e = new WpBuildError(e.message, fileOrDetails, details);
            }
        }
        this.app.logger.error(e);
        this.compilation.errors.push(/** @type {WebpackError} */(e));
	}


    /**
     * @function
     * @private
     */
    initGlobalCache()
    {
        const baseProp = lowerCaseFirstChar(this.name.replace("WpBuild", "").replace("Plugin", ""));
        if (!this.app.global[baseProp]) {
            this.app.global[baseProp] = {};
        }
        this.options.globalCacheProps?.filter(p => !this.app.global[baseProp][p]).forEach(
            (p) => { this.app.global[baseProp][p] = {}; }
        );
    };


    /**
     * @function
     * @private
     * @param {any} hook
     * @returns {hook is typedefs.WebpackAsyncCompilerHook | typedefs.WebpackAsyncCompilationHook}
     */
    isAsyncHook = (hook) => isFunction(hook.tapPromise);


    /**
     * @function
     * @protected
     * @param {string} file
     * @returns {boolean}
     */
    isEntryAsset = (file) => WpBuildPlugin.getEntriesRegex(this.wpConfig).test(file);


    /**
     * @function
     * @private
     * @param {any} hook
     * @returns {hook is typedefs.WebpackAsyncCompilerHook | typedefs.WebpackAsyncCompilationHook}
     */
    isTapable = (hook) => isFunction(hook.tap) || isFunction(hook.tapPromise);


    /**
     * Webpack ModuleFilenameHelpers - matches properties `include`, `exclude`, and
     * `test` on the plugin options object
     * @function
     * @protected
     * @param {string} str
     * @returns {boolean}
     */
    matchObject = (str) => ModuleFilenameHelpers.matchObject.bind(undefined, this.options, str);


    /**
     * Called by extending class from apply()
     * @function
     * @protected
     * @param {typedefs.WebpackCompiler} compiler the compiler instance
     * @param {typedefs.WpBuildPluginTapOptionsHash} options
     * @throws {WebpackError}
     */
    onApply(compiler, options)
    {
        this.validateApplyOptions(compiler, options);

        const optionsArray = Object.entries(options);
        this.compiler = compiler;
        this.wpCache = compiler.getCache(this.name);
        this.wpLogger = compiler.getInfrastructureLogger(this.name);
        this.hashDigestLength = compiler.options.output.hashDigestLength || this.app.wpc.output.hashDigestLength || 20;

        const hasCompilationHook = optionsArray.find(([ _, tapOpts ]) => tapOpts.hook === "compilation") ||
                                   optionsArray.every(([ _, tapOpts ]) => !!tapOpts.stage);
        if (hasCompilationHook)
        {
            this.tapCompilationHooks(optionsArray.filter(([ _, tapOpts ]) => tapOpts.hook === "compilation"));
        }

        for (const [ name, tapOpts ] of optionsArray.filter(([ _, tapOpts ]) => tapOpts.hook && tapOpts.hook !== "compilation"))
        {
            const hook = compiler.hooks[tapOpts.hook];
            if (!tapOpts.async)
            {
                hook.tap(`${this.name}_${name}`, this.wrapCallback(name, tapOpts).bind(this));
            }
            else
            {   if (this.isAsyncHook(hook))
                {
                    hook.tapPromise(`${this.name}_${name}`, this.wrapCallback(name, tapOpts).bind(this));
                }
                else {
                    this.handleError(new WebpackError(`Invalid async hook parameters specified: ${tapOpts.hook}`));
                    return;
                }
            }
        }
    }


    /**
     * @function
     * @protected
     * @param {typedefs.WebpackCompilation} compilation
     * @returns {boolean}
     */
    onCompilation(compilation)
    {
        this.compilation = compilation;
        this.wpLogger = compilation.getLogger(this.name);
        this.wpCacheCompilation = compilation.getCache(this.name);
        return !compilation.getStats().hasErrors();
    }


    /**
     * @function
     * @private
     * @param {[string, typedefs.WpBuildPluginTapOptions][]} optionsArray
     */
    tapCompilationHooks(optionsArray)
    {
        this.compiler.hooks.compilation.tap(this.name, (compilation) =>
        {
            if (!this.onCompilation(compilation)) {
                return;
            }
            optionsArray.forEach(([ name, tapOpts ]) =>
            {
                if (!tapOpts.hookCompilation)
                {
                    if (tapOpts.stage) {
                        tapOpts.hookCompilation = "processAssets";
                    }
                    else {
                        this.handleError(new WebpackError("Invalid hook parameters: stage and hookCompilation not specified"));
                        return;
                    }
                }
                else if (tapOpts.hookCompilation === "processAssets" && !tapOpts.stage)
                {
                    this.handleError(new WebpackError("Invalid hook parameters: stage not specified for processAssets"));
                    return;
                }
                this.tapCompilationStage(name, /** @type {typedefs.WpBuildPluginCompilationOptions} */(tapOpts));
            });
        });
    }


    /**
     * @function
     * @protected
     * @param {string} optionName
     * @param {typedefs.WpBuildPluginCompilationOptions} options
     * @returns {void}
     * @throws {WebpackError}
     */
    tapCompilationStage(optionName, options)
    {
        const stageEnum = options.stage ? this.compiler.webpack.Compilation[`PROCESS_ASSETS_STAGE_${options.stage}`] : null,
              name = `${this.name}_${options.stage}`,
              hook = this.compilation.hooks[options.hookCompilation];
        if (this.isTapable(hook))
        {
            if (stageEnum && options.hookCompilation === "processAssets")
            {
                const logMsg = this.breakProp(optionName).padEnd(this.app.build.log.pad.value - 3) + this.logger.tag(`processassets: ${options.stage} stage`);
                if (!options.async) {
                    hook.tap({ name, stage: stageEnum }, this.wrapCallback(logMsg, options).bind(this));
                }
                else {
                    hook.tapPromise({ name, stage: stageEnum }, this.wrapCallback(logMsg, options).bind(this));
                }
            }
            else
            {
                if (!options.async) {
                    hook.tap(name, this.wrapCallback(optionName, options).bind(this));
                }
                else {
                    if (this.isAsyncHook(hook)) {
                        hook.tapPromise(name, this.wrapCallback(optionName, options).bind(this));
                    }
                    else {
                        this.handleError(new WebpackError(`Invalid async hook specified: ${options.hook}`));
                        return;
                    }
                }
            }
            this.tapStatsPrinter(name, options);
        }
    }


    /**
     * @function
     * @protected
     * @param {string} name
     * @param {typedefs.WpBuildPluginCompilationOptions} options
     */
    tapStatsPrinter(name, options)
    {
        const property = options.statsProperty;
        if (property)
        {
            this.compilation.hooks.statsPrinter.tap(name, (stats) =>
            {
                const printFn = (/** @type {{}} */prop, /** @type {typedefs.WebpackStatsPrinterContext} */context) =>
                      prop ? context[options.statsPropertyColor || "green"]?.(context.formatFlag?.(this.breakProp(property)) || "") || "" : "";
                stats.hooks.print.for(`asset.info.${property}`).tap(name, printFn);
            });
        }
    }


    /**
     * @function
     * @private
     * @param {typedefs.WebpackCompiler} compiler the compiler instance
     * @param {typedefs.WpBuildPluginTapOptionsHash} options Plugin options to be applied
     * @throws {WpBuildError}
     */
	validateApplyOptions(compiler, options)
    {
        if (options)
        {
            Object.values(options).forEach((o) =>
            {
                if (o.async && !this.isAsyncHook(compiler.hooks[o.hook]))
                {
                    throw new WebpackError(`Invalid hook parameters specified: ${o.hook} is not asynchronou`);
                }
            });
            for (const o of Object.values(options).filter((tapOpts) => tapOpts.hook))
            {
                const hook = compiler.hooks[o.hook],
                      isAsync = this.isAsyncHook(hook);
                if (o.async && !isAsync)
                {
                    this.handleError(new WebpackError(`Invalid hook parameters specified: ${o.hook} is not asynchronous`));
                    return;
                }
            }
        }
    }


    /**
     * @function
     * @private
     * @param {typedefs.WpBuildPluginOptions} options Plugin options to be applied
     * @throws {WpBuildError}
     */
	validatePluginOptions(options)
    {
        // if (options.plugins)
        // {
        //     Object.values(asArray(options.plugins)).forEach((o) =>
        //     {
        //         if (o.async && o.hook !== WebpackCompilerAsyncHookName)
        //         {
        //             throw new WebpackError(`Specified hook '${o.hook}' is not asynchronous`);
        //         }
        //     });
        // }
    }


    /**
     * @function
     * @private
     * @param {string} message If camel-cased, will be formatted with {@link WpBuildPlugin.breakProp breakProp()}
     * @param {typedefs.WpBuildPluginTapOptions} options
     * @returns {typedefs.WpBuildCallback}
     */
    wrapCallback(message, options)
    {
        const logger = this.logger,
              callback = options.callback,
              logMsg = this.breakProp(message);
        if (!options.async) {
            return (...args) => { logger.start(logMsg, 1); callback.call(this, ...args); };
        }
        return async (...args) => { logger.start(logMsg, 1); await callback.call(this, ...args); };
    }


    /**
     * @param {typeof WpBuildPlugin} clsType Plugin options to be applied
     * @param {typedefs.WpBuildPluginOptions} options Plugin options to be applied
     * @returns {WpBuildPlugin}
     */
    static wrapVendorPlugin = (clsType, options) => new clsType({ wrapPlugin: true, ...options });


    // /**
    //  * @template T
    //  * @function
    //  * @protected
    //  * @member wrapTry
    //  * @param {Function} fn
    //  * @param {string} msg
    //  * @param {...any} args
    //  * @returns {PromiseLike<T> | T | Error}
    //  */
    // wrapTry = (fn, msg, ...args) =>
    // {
    //     this.app.logger.write(msg, 3);
    //     try {
    //         const r = fn.call(this, ...args);
    //         if (isPromise(r)) {
    //             return r.then((v) => v);
    //         }
    //         else {
    //             return r;
    //         }
    //     }
    //     catch (e) {
    //         this.handleError(e, `Failed: ${msg}`);
    //         return /** @type {Error} */(e);
    //     }
    // };
}


module.exports = WpBuildPlugin;
