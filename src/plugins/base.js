/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/base.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *
 * @description
 *
 * When adding a new extending plugin, perform the following tasks:
 *
 *     1. Add the plugin filename (w/o extnsion) to the `WpwPluginName` type near the
 *        top of the types file
 *        file:///c:\Projects\@spmeesseman\webpack-wrap\src\types\wpwbuild.ts
 *
 *     2. Adjust the schema file by adding the plugin name to relevant areas, and adding a
 *        new config definition object.
 *        file:///c:\Projects\@spmeesseman\webpack-wrap\src\schema\spm.schema.wpw.json
 *
 *     3. Run the `generate-rc-types` script / npm task to rebuild rc.ts definition file
 *        file:///c:\Projects\@spmeesseman\webpack-wrap\script\generate-rc-types.js
 *
 *     4. Add a module reference to plugin directory index file and add to it's module.exports
 *        file://c:\Projects\@spmeesseman\webpack-wrap\src\plugin\index.js
 *
 *     5.  Add the plugin into the webpack exports by importing and placing it in an appropriate
 *         position in the exports.plugins array.
 *         file:///c:\Projects\@spmeesseman\webpack-wrap\src\exports\plugins.js
 *//** */

 const WpwCache = require("../utils/cache");
const { readFile } = require("fs/promises");
const WpwError = require("../utils/message");
const typedefs = require("../types/typedefs");
const { relative, basename } = require("path");
const WpwPluginWaitManager = require("./wait");
const WpwBaseModule = require("../core/basemodule");
const { isFunction, execAsync, applyIf, asArray, isString } = require("../utils");


/**
 * @abstract
 * @extends {WpwBaseModule}
 * @implements {typedefs.IWpwPlugin}
 */
class WpwPlugin extends WpwBaseModule
{
    /**  @type {WpwPluginWaitManager}  @private  */
    static eventManager = new WpwPluginWaitManager();

    /** @type {WpwCache} @protected */
    cache;
    /** @type {typedefs.WebpackCompilation} */
    compilation;
    /** @type {typedefs.WebpackCompiler} */
    compiler;
    /**  @type {typedefs.WebpackPluginInstance[]} @private */
    plugins;
    /** @type {typedefs.WebpackCacheFacade} @protected */
    wpCache;
    /** @type {typedefs.WebpackCacheFacade}  @protected */
    wpCacheCompilation;
    /** @type {typedefs.WebpackLogger} @protected */
    wpLogger;


    /**
     * @param {typedefs.WpwPluginOptions} options Plugin options to be applied
     */
	constructor(options)
    {
        super(options);
        this.plugins = [];
        this.cache = new WpwCache(this.build, this.cacheFilename(this.build.mode, this.baseName));
    }


    /**
     * Called by webpack runtime to initialize this plugin.  To be overridden by inheriting class.
     *
     * @abstract
     * @param {typedefs.WebpackCompiler} compiler
     */
    apply(compiler) { this.compiler = compiler; }


    /**
     * Break property name into separate spaced words at each camel cased character
     *
     * @private
     * @param {string} prop
     * @returns {string} string
     */
    breakProp = (prop) => prop.replace(/_/g, "").replace(/[A-Z]{2,}/g, (v) => v[0] + v.substring(1).toLowerCase())
                              .replace(/[a-z][A-Z]/g, (v) => `${v[0]} ${v[1]}`).toLowerCase();


    /**
     * Wpw plugin cache  name ("not" webpack cache)
     *
     * @protected
     * @param {string} mode
     * @param {string} name
     */
    cacheFilename = (mode, name) => `plugincache_${mode}_${name}.json`;


    /**
     * @protected
     * @param {string} filePath
     * @param {string} identifier
     * @param {string} outputDir Output directory of build
     * @param {typedefs.WebpackRawSource | undefined} [source]
     * @returns {Promise<typedefs.CacheResult>} Promise<CacheResult>
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
            this.handleError("failed while checking cache", e);
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
                this.handleError("failed while checking snapshot", e);
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
                this.handleError("failed while creating snapshot", e);
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
                    this.handleError("failed while caching snapshot", e);
                    return result;
                }
            }
        }

        return result;
    };


    /**
     * @protected
     * @param {string} filePath
     * @param {string} identifier
     * @param {string} outputDir Output directory of build
     * @returns {Promise<boolean>} Promise<boolean>
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
            this.handleError("failed while checking if cached snapshot exists", e);
        }
        return !!cacheEntry && !!cacheEntry.snapshot;
    };


	/**
	 * @protected
	 * @param {typedefs.WebpackSnapshot} snapshot
	 * @returns {Promise<boolean | undefined>} Promise<boolean | undefined>
	 */
	checkSnapshotValid = async (snapshot) =>
	{
		return new Promise((resolve, reject) =>
		{
			this.compilation.fileSystemInfo.checkSnapshotValid(snapshot, (e, isValid) => { if (e) { reject(e); } else { resolve(isValid); }});
		});
	};


    /**
     * @protected
     * @param {typedefs.WebpackCompilationHookName} hook
     * @param {typedefs.WebpackCompilationHookStage} stage
     * @param {typedefs.WpwPluginHookHandler} callback
     * @param {boolean} [async]
     * @param {string} [statsProperty]
     * @returns {typedefs.WpwPluginCompilationTapOptions} WpwPluginTapOptions
     */
    static compilationHookConfig = (hook, stage, callback, async, statsProperty) =>
        ({ async: !!async, hook: "compilation", stage, hookCompilation: hook, callback, statsProperty });


    /**
     * @protected
     * @param {typedefs.WebpackCompilerHookName} hook
     * @param {typedefs.WpwPluginHookHandler} callback
     * @param {boolean} [async]
     * @param {string} [statsProperty]
     * @returns {typedefs.WpwPluginBaseTapOptions} WpwPluginTapOptions
     */
    static compilerHookConfig = (hook, callback, async, statsProperty) => ({ async: !!async, hook, callback, statsProperty });


	/**
	 * @protected
	 * @param {number} startTime
	 * @param {string} dependency
	 * @returns {Promise<typedefs.WebpackSnapshot | undefined | null>} Promise<WebpackSnapshot | undefined | null>
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
	 * Executes a command via a promisified node exec()
	 * @param {string} command
	 * @param {string} program
	 * @param {string | string[]} [ignoreOut]
	 * @returns {Promise<number | null>} Promise<number | null>
	 */
	exec = async (command, program, ignoreOut) =>
    {
        const result = await execAsync({ command, program, logger: this.logger, execOptions: { cwd: this.wpc.context }, ignoreOut });
        result.errors.forEach(e => this.build.addMessage({ code: WpwError.Code.ERROR_TYPESCRIPT, compilation: this.compilation, message: e }));
        return result.code;
    };


	/**
	 * @protected
	 * @param {Buffer} source
	 * @returns {string} string
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
     * @param {typedefs.WpwWebpackConfig} wpConfig Webpack config object
     * @param {boolean} [dbg]
     * @param {boolean} [ext]
     * @param {boolean} [hash]
     * @returns {RegExp}
     */
    static getEntriesRegex = (wpConfig, dbg, ext, hash) => new RegExp(
        `(?:${Object.keys(wpConfig.entry).reduce((e, c) => `${e ? e + "|" : ""}${c}`, "")})` +
        `(?:\\.debug)${!dbg ? "?" : ""}(?:\\.[a-z0-9]{${wpConfig.output.hashDigestLength || 20}})` +
        `${!hash ? "?" : ""}(?:\\.js|\\.js\\.map)${!ext ? "?" : ""}`
    );


    /**
     * @abstract
	 * @protected
     * @returns {typedefs.WebpackPluginInstance | typedefs.WebpackPluginInstance[] | undefined} WebpackPluginInstance
     */
    getVendorPlugin() { return undefined; }


	/**
	 * @private
	 * @param {string} message
	 * @param {WpwError | typedefs.WebpackError | Error | undefined} [error]
	 * @throws {WpwError}
	 */
	handleError(message, error)
	{
        this.build.addMessage({ code: WpwError.Code.ERROR_GENERAL, message, compilation: this.compilation, error });
	}


    /**
     * @protected
     * @param {string|any} hook
     * @returns {hook is typedefs.WebpackAsyncCompilerHook | typedefs.WebpackAsyncCompilationHook} hook is AsyncCompilerHook | AsyncCompilationHook
     */
    isAsyncHook = (hook) => isFunction(hook.tapPromise);


    /**
     * @protected
     * @param {string} file
     * @returns {boolean} boolean
     */
    isEntryAsset = (file) => WpwPlugin.getEntriesRegex(this.wpc).test(file);


    /**
     * @param {any} hook
     * @returns {hook is typedefs.WebpackAsyncCompilerHook | typedefs.WebpackAsyncCompilationHook}
     */
    isTapable = (hook) => isFunction(hook.tap) || isFunction(hook.tapPromise);


    /**
     * Called by extending class on call to apply() from webpack runtime
     * @protected
     * @param {typedefs.WebpackCompiler} compiler
     * @param {typedefs.WpwPluginTapOptions} [options]
     */
    onApply(compiler, options)
    {
        this.compiler = compiler;
        this.wpCache = compiler.getCache(this.name);
        this.wpLogger = compiler.getInfrastructureLogger(this.name);
        this.hashDigestLength = compiler.options.output.hashDigestLength || this.build.wpc.output.hashDigestLength || 20;

        // this.tapCompilationHooks([[ "setCompilationInstance", {
        //     hook: "compilation",
        //     stage: "PRE_PROCESS",
        //     callback: this.onCompilation.bind(this),
        //     hookCompilation: "processAssets"
        // }]]);
        compiler.hooks.compilation.tap("setCompilationInstance", (c) => { this.compilation = c; });

        if (options)
        {
            this.validateApplyOptions(compiler, options);
            const optionsArray = Object.entries(options),
                  hasCompilationHook = optionsArray.find(([ _, tapOpts ]) => tapOpts.hook === "compilation") ||
                                       optionsArray.every(([ _, tapOpts ]) => !!tapOpts.stage);
            if (hasCompilationHook)
            {
                const compilationHooks = /** @type {[string, typedefs.WpwPluginCompilationTapOptions][]} */(
                    optionsArray.filter(([ _, tapOpts ]) => tapOpts.hook === "compilation")
                );
                this.tapCompilationHooks(compilationHooks);
            }

            for (const [ name, tapOpts ] of optionsArray.filter(([ _, tapOpts ]) => tapOpts.hook && tapOpts.hook !== "compilation"))
            {
                const hook = compiler.hooks[tapOpts.hook];
                if (!tapOpts.async)
                {
                    hook.tap(`${this.name}_${name}`, this.wrapCallback(name, tapOpts));
                }
                else
                {   if (this.isAsyncHook(hook))
                    {
                        hook.tapPromise(`${this.name}_${name}`, this.wrapCallback(name, tapOpts, true));
                    }
                    else {
                        this.handleError(`Invalid async hook parameters specified: ${tapOpts.hook}`);
                        return;
                    }
                }
            }
        }

        //
        // if there's a wrapped vendor plugin(s), then forward the compiler instance to the plugin's apply() method
        //
        for (const p of this.plugins) { p.apply.call(p, compiler); }
    }


    /**
     * @protected
     * @param {typedefs.WebpackCompilation} compilation
     * @returns {boolean} boolean
     */
    onCompilation(compilation)
    {
        this.compilation = compilation;
        this.wpLogger = compilation.getLogger(this.name);
        this.wpCacheCompilation = compilation.getCache(this.cacheName);
        return !compilation.getStats().hasErrors();
    }


    /**
     * @protected
     */
    printCompilationDependencies()
    {
        const l = this.logger;
		l.value("   # of build dependencies", this.compilation.buildDependencies.size, 2);
		if (this.compilation.buildDependencies.size > 0 && l.level >= 3) {
			l.write("   build dependencies:", 3);
			this.compilation.buildDependencies.forEach(d => l.write("      " + d, 3));
		}
		l.value("   # of context dependencies", this.compilation.contextDependencies.size, 2);
		if (this.compilation.contextDependencies.size > 0 && l.level >= 3) {
			l.write("   context dependencies:", 3);
			this.compilation.contextDependencies.forEach(d => l.write("      " + d, 3));
		}
		l.value("   # of file dependencies", this.compilation.fileDependencies.size, 2);
		if (this.compilation.fileDependencies.size > 0 && l.level >= 3) {
			l.write("   file dependencies:", 3);
			this.compilation.fileDependencies.forEach(d => l.write("      " + d, 3));
		}
		l.value("   # of missing dependencies", this.compilation.missingDependencies.size, 2);
		if (this.compilation.missingDependencies.size > 0 && l.level >= 3) {
			l.write("   missing dependencies:", 3);
			this.compilation.missingDependencies.forEach(d => l.write("      " + d, 3));
		}
    }


    /**
     * @private
     * @param {[string, typedefs.WpwPluginCompilationTapOptions][]} optionsArray
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
                        this.handleError("Invalid hook parameters: stage and hookCompilation not specified");
                        return;
                    }
                }
                else if (tapOpts.hookCompilation === "processAssets" && !tapOpts.stage)
                {
                    this.handleError("Invalid hook parameters: stage not specified for processAssets");
                    return;
                }
                this.tapCompilationStage(name, /** @type {typedefs.WpwPluginCompilationTapOptions} */(tapOpts));
            });
        });
    }


    /**
     * @protected
     * @param {string} optionName
     * @param {typedefs.WpwPluginCompilationTapOptions} options
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
                const logMsg = this.breakProp(optionName).padEnd(this.build.logger.valuePad - 3) + this.logger.tag(`processassets: ${options.stage} stage`);
                if (!options.async) {
                    hook.tap({ name, stage: stageEnum }, this.wrapCallback(logMsg, options));
                }
                else {
                    hook.tapPromise({ name, stage: stageEnum }, this.wrapCallback(logMsg, options, true));
                }
            }
            else
            {
                if (!options.async) {
                    hook.tap(name, this.wrapCallback(optionName, options));
                }
                else {
                    if (this.isAsyncHook(hook)) {
                        hook.tapPromise(name, this.wrapCallback(optionName, options, true));
                    }
                    else {
                        this.handleError(`Invalid async hook specified: ${options.hook}`);
                        return;
                    }
                }
            }
            this.tapStatsPrinter(name, options);
        }
    }


    /**
     * @protected
     * @param {string} name
     * @param {typedefs.WpwPluginBaseTapOptions} options
     */
    tapStatsPrinter(name, options)
    {
        const property = options.statsProperty;
        if (property)
        {
            this.compilation.hooks.statsPrinter.tap(name, (stats) =>
            {
                const printFn = (/** @type {{}} */prop, /** @type {typedefs.WebpackStatsPrinterContext} */context) => {
                      const statsColor = context[this.build.log.color || "green"];
                      return prop ? statsColor?.(context.formatFlag?.(this.breakProp(property)) || "") || "" : "";
                };
                stats.hooks.print.for(`asset.info.${property}`).tap(name, printFn);
            });
        }
    }


    /**
     * @private
     * @param {typedefs.WebpackCompiler} compiler
     * @param {typedefs.WpwPluginTapOptions} options
     * @throws {WpwError}
     */
	validateApplyOptions(compiler, options)
    {
        if (options)
        {
            for (const o of Object.values(options))
            {
                if (!o.hook) {
                    this.handleError("Invalid hook parameters specified:hook name is undefined");
                    return;
                }
                if (o.async && !this.isAsyncHook(compiler.hooks[o.hook]))
                {
                    this.handleError(`Invalid hook parameters specified: ${o.hook} is not asynchronous`);
                    return;
                }
            }
        }
    }


    /**
     * Wraps a vendor plugin to give it access to the WpwBuild instance, and couples it with
     * the the WpwPlugin instance.
     *
     * @template {WpwPlugin} T
     * @param {new(arg1: typedefs.WpwPluginOptions) => T} clsType the extended WpwPlugin class type
     * @param {typedefs.WpwBuild} build current build wrapper
     * @param {typedefs.WpwBuildOptionsKey} buildOptionsKey
     * @param {Partial<typedefs.WpwPluginOptions>} [pluginOptions]
     * @param {[ string, string | boolean | number ][]} [addOptionsKeysCheck]
     * @returns {T | undefined} T | undefined
     */
    static wrap(clsType, build, buildOptionsKey, pluginOptions, addOptionsKeysCheck)
    {
        const buildOptions = build.options[buildOptionsKey];
        if (buildOptions && buildOptions.enabled !== false && asArray(addOptionsKeysCheck).every(o => buildOptions[o[0]] === o[1]))
        {
            const plugin = new clsType(applyIf({ build }, pluginOptions));
            plugin.plugins.push(...asArray(plugin.getVendorPlugin()));
            plugin.buildOptions = buildOptions;
            return plugin;
        }
    }


    /**
     * @private
     * @template {boolean} T
     * @template {T extends true ? typedefs.WpwPluginWrappedHookHandlerAsync : typedefs.WpwPluginWrappedHookHandlerSync} R
     * @param {string} message If camel-cased, will be formatted with {@link WpwPlugin.breakProp breakProp()}
     * @param {typedefs.WpwPluginBaseTapOptions} options
     * @param {T} [async]
     * @returns {R} WpwPluginWrappedHookHandler
     */
    wrapCallback(message, options, async)
    {
        let cb;
        const logger = this.logger,
              callback = isString(options.callback) ? this[options.callback].bind(this) : options.callback,
              logMsg = this.breakProp(message),
              eMgr= WpwPlugin.eventManager,
              wait = this.build.options.wait;

        if (async !== true)
        {
            cb = (/** @type {...any} */...args) =>
            {
                logger.start(logMsg, 1);
                const result = callback(...args);
                if (result) {
                    eMgr.emit(`${this.name}_${options.hook}`, this.name, result);
                }
            };
        }
        else
        {
            cb = async (/** @type {...any} */...args) =>
            {
                logger.start(logMsg, 1);
                const result = await callback(...args);
                if (result) {
                    eMgr.emit(`${this.name}_${options.hook}`, this.name, result);
                }
            };
        }

        if (wait?.items)
        {
            const delayedCb = cb;
            wait.items.forEach((waitConfig) =>
            {   //
                // We wait for the last item in the array to complete i.e emit it's 'done' event
                // so just set the return cb to the last array items event registration
                //
                cb = () => {
                    eMgr.register({
                        mode: waitConfig.mode,
                        source: this.buildOptionsKey,
                        name: waitConfig.name,
                        callback: () => delayedCb
                    });
                };
            }, this);
        }
        return /** @type {R} */(cb);
    }
}


module.exports = WpwPlugin;
