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
const WpwBaseModule = require("../core/basemodule");
const { isFunction, execAsync, asArray, isString } = require("../utils");
const { apply } = require("@spmeesseman/type-utils");
const { isPromise } = require("util/types");


/**
 * @abstract
 * @extends {WpwBaseModule}
 * @implements {typedefs.IWpwPlugin}
 */
class WpwPlugin extends WpwBaseModule
{
    /**
     * @private
     * @type {boolean | undefined}
     */
    static dependenciesLogged;

    /**
     * @protected
     * @type {WpwCache}
     */
    cache;
    /**
     * @type {typedefs.WebpackCompilation}
     */
    compilation;
    /**
     * @type {typedefs.WebpackCompiler}
     */
    compiler;
    /**
     * @private
     * @type {typedefs.WebpackPluginInstance[]}
     */
    plugins;
    /**
     * @readonly
     * @protected
     * @type {boolean}
     */
    isTaskTypeBuild;
    /**
     * @protected
     * @type {typedefs.WebpackCacheFacade}
     */
    wpCache;
    /**
     * @private
     * @type {typedefs.WebpackCacheFacade}
     */
    wpCacheCompilation;


    /**
     * @param {typedefs.WpwPluginOptions} options Plugin options to be applied
     */
	constructor(options)
    {
        super(options);
        apply(this, {
            plugins: [],
            stats: { hooksProcessed: 0, hookCount: 0 },
            cache: new WpwCache(this.build, this.cacheFilename(this.build.mode, this.baseName))
        });
    }


	/**
	 * @private
	 * @param {string} message
	 * @param {WpwError | typedefs.WebpackError | Error | undefined} [error]
	 * @throws {WpwError}
	 */
	addError(message, error) { this.build.addMessage({ code: WpwError.Code.ERROR_PLUGIN_FAILED, message, compilation: this.compilation, error }); }


    /**
     * Main webpack plugin initializtion handler, called by webpack runtime to initialize this plugin.
     *
     * @param {typedefs.WebpackCompiler} compiler
     */
    apply(compiler)
    {
        this.compiler = compiler;
        this.wpCache = compiler.getCache(this.name);
        this.hashDigestLength = compiler.options.output.hashDigestLength || this.build.wpc.output.hashDigestLength || 20;
        //
        // Set up a plugin wait hook if necessary
        //
        // const waitConfig = this.build.options.wait;
        // if (!this.build.isOnlyBuild && waitConfig?.items && waitConfig.items.length > 0) {
        //     compiler.hooks.beforeRun.tapAsync("onBeforeRunWait_" + this.build.name, () => this.build.eventManager.wait(this.build));
        // }
        //
        // Set up a hook so that the compiltion instance can be stored before it actually begins,
        // and the compilation dependencies can be logged if a high enough logging level is set
        //
        compiler.hooks.compilation.tap("onBeforeCompilationStart_" + this.name, this.onCompilation.bind(this));
        //
        // if there's any wrapped vendor plugin(s) that specify the 'hookVendorPluginFirst' flag, create
        // those hooks before the internl WpwPlugin hooks.  After applying internal hooks, then apply any
        // vendor plugins that do not specify the flag;
        //
        for (const p of this.plugins.filter(p => !!p.applyFirst)) { p.apply.call(p, compiler); }
        //
        // Add all internal WpwPlugin hooks
        //
        const options = this.onApply();
        if (this.build.hasError) { return; }
        if (options)
        {
            this.validateApplyOptions(compiler, options);
            const optionsArray = Object.entries(options),
                  hasCompilationHook = optionsArray.find(([ _, tapOpts ]) => tapOpts.hook === "compilation") ||
                                       optionsArray.every(([ _, tapOpts ]) => !!tapOpts.stage);
            if (hasCompilationHook)
            {
                const compilationHooks = /** @type {typedefs.WpwPluginCompilationTapOptionsPair[]} */(
                    optionsArray.filter(([ _, tapOpts ]) => tapOpts.hook === "compilation")
                );
                this.tapCompilationHooks(compilationHooks);
            }
            for (const [ name, tapOpts ] of optionsArray.filter(([ _, tapOpts ]) => tapOpts.hook && tapOpts.hook !== "compilation"))
            {
                const hook = compiler.hooks[tapOpts.hook];
                if (!tapOpts.async || !(/** @type {any} */(hook).tapPromise))
                {
                    hook.tap(`${this.name}_${name}`, this.wrapCallback(name, tapOpts));
                }
                else
                {   if (this.isAsyncHook(hook)) {
                        /** @type {typedefs.WebpackAsyncHook} */(hook).tapPromise(`${this.name}_${name}`, this.wrapCallback(name, tapOpts, true));
                    }
                    else {
                        return this.addError(`Invalid async hook parameters specified: ${tapOpts.hook}`);
                    }
                }
            }
        }
        //
        // if there's any wrapped vendor plugin(s) that does not specify the 'hookVendorPluginFirst'
        // flag, create those hooks now that the internl WpwPlugin hooks have been created.
        //
        for (const p of this.plugins.filter(p => !p.applyFirst)) { p.apply.call(p, compiler); }
    }


    /**
     * Break property name into separate spaced words at each camel cased character
     *
     * @private
     * @param {string} prop
     * @returns {string} string
     */
    breakProp(prop) { return prop.replace(/_/g, "").replace(/[A-Z]{2,}/g, (v) => v[0] + v.substring(1).toLowerCase())
                                 .replace(/[a-z][A-Z]/g, (v) => `${v[0]} ${v[1]}`).toLowerCase(); }


    /**
     * Wpw plugin cache  name ("not" webpack cache)
     *
     * @protected
     * @param {string} mode
     * @param {string} name
     */
    cacheFilename(mode, name) { return `plugincache_${mode}_${name}.json`; }


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
        let data;
        const logger = this.logger,
              filePathRel = relative(outputDir, filePath),
              /** @type {typedefs.CacheResult} */result = { file: basename(filePathRel), snapshot: null, source };

        const cacheEntry = await this.getCacheEntry(filePath, identifier, null);
        if (cacheEntry && cacheEntry.snapshot)
        {
            let isValidSnapshot;
            logger.value("   check snapshot valid", filePathRel, 4);
            try {
                isValidSnapshot = await this.checkSnapshotValid(cacheEntry.snapshot);
            }
            catch (e) {
                this.addError("failed while checking snapshot", e);
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
                this.addError("failed while creating snapshot", e);
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
                    this.addError("failed while caching snapshot", e);
                    return result;
                }
            }
        }

        return result;
    };


	/**
	 * @private
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
    static compilationHookConfig(hook, stage, callback, async, statsProperty)
    {
        return { async: !!async, hook: "compilation", stage, hookCompilation: hook, callback, statsProperty };
    }


    /**
     * @protected
     * @param {typedefs.WebpackCompilerHookName} hook
     * @param {typedefs.WpwPluginHookHandler} callback
     * @param {boolean} [async]
     * @param {string} [statsProperty]
     * @returns {typedefs.WpwPluginBaseTapOptions} WpwPluginTapOptions
     */
    static compilerHookConfig(hook, callback, async, statsProperty) { return { async: !!async, hook, callback, statsProperty }; }


	/**
	 * @private
	 * @param {number} startTime
	 * @param {string} dependency
	 * @returns {Promise<typedefs.WebpackSnapshot | undefined | null>} Promise<WebpackSnapshot | undefined | null>
	 */
	async createSnapshot(startTime, dependency)
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
	async exec(command, program, ignoreOut)
    {
        const result = await execAsync({
            command, program, logger: this.logger, logPad: "   ", execOptions: { cwd: this.wpc.context }, ignoreOut
        });
        for (const message of result.errors)
        {
            this.build.addMessage({
                message,
                compilation: this.compilation,
                code: WpwError.Code.ERROR_NON_ZERO_EXIT_CODE
            });
        }
        return result.code;
    };


    /**
     * @private
     * @param {string} filePath
     * @param {string | number} identifier
     * @param {typedefs.WebpackEtag | null} [etag]
     * @returns {Promise<typedefs.CacheResult | undefined>}
     */
    async getCacheEntry(filePath, identifier, etag)
    {
        this.logger.value("   check cache for existing asset", filePath, 3);
        try {
            return this.wpCacheCompilation.getPromise(`${filePath}|${identifier}`, etag ?? null);
            // const cache = this.compiler.getCache(`${this.build.name}_${this.build.type}_${this.build.wpc.target}`.toLowerCase());
        }
        catch (e)
        {   this.build.addMessage({
                error: e,
                compilation: this.compilation ,
                code: WpwError.Code.ERROR_JSDOC_FAILED,
                message: "jsdoc build failed - failed while checking cache"
            });
        }
    }


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
     * @param {boolean} [_applyFirst]
     * @returns {typedefs.WebpackPluginInstance | typedefs.WebpackPluginInstanceOrUndef[] | undefined} WebpackPluginInstance
     */
    getVendorPlugin(_applyFirst) { return undefined; }


    /**
     * @protected
     * @param {string|any} hook
     * @returns {boolean} hook is WebpackAsyncHook
     */
    // * @returns {hook is typedefs.WebpackAsyncHook} hook is WebpackAsyncHook
    isAsyncHook(hook) { return isFunction(hook.tapPromise); }


    /**
     * @protected
     * @param {string} file
     * @returns {boolean} boolean
     */
    isEntryAsset(file) { return WpwPlugin.getEntriesRegex(this.wpc).test(file); }


    /**
     * @param {any} hook
     * @returns {boolean} hook is WebpackHook
     */
    // * @returns {hook is typedefs.WebpackHook} <-- "is" causes jsdoc errors
    isTapable(hook) { return isFunction(hook.tap) || isFunction(hook.tapPromise); }


    /**
     * May be implemented by extending WpwPlugin if internal hooks are to be set up.
     * All plugins either (1) have internal hooks, (2) wrap a vendor plugin, or (3) both.
     *
     * @abstract
     * @protected
     * @returns {typedefs.WpwPluginTapOptions | undefined | void}
     */
    onApply() { return; }


    /**
     * @private
     * @param {typedefs.WebpackCompilation} compilation
     */
    onCompilation(compilation)
    {
        this.compilation = compilation;
        this.wpCacheCompilation = compilation.getCache(this.cacheName);
        if (!WpwPlugin.dependenciesLogged) {
            compilation.hooks.beforeCodeGeneration.tap("onBeforeCodeGeneration_" + this.name, () => this.printCompilationDependencies());
            WpwPlugin.dependenciesLogged = true;
        }
    }


    /**
     * @protected
     * @param {typedefs.WebpackAsset[]} [assets]
     */
    printAssets(assets)
    {
        assets = assets || this.compilation.getAssets();
        if (assets.length > 0)
        {
            if (assets.length <= 10 || this.logger.level >= 4) {
                this.logger.value("   current assets", assets.map(a => a.name).join(", "), 3);
            }
            else {
                this.logger.value("   current assets", assets.slice(0, 10).map(a => a.name).join(", ") +
                                `[ + ${assets.length - 10} more ...increase logging level to view all ]`, 3);
            }
        }
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
     * @param {typedefs.WpwPluginCompilationTapOptionsPair[]} optionsArray
     */
    tapCompilationHooks(optionsArray)
    {
        this.compiler.hooks.compilation.tap(this.name, (compilation) =>
        {
            if (compilation.getStats().hasErrors()) {
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
                        return this.addError("Invalid hook parameters: stage and hookCompilation not specified");
                    }
                }
                else if (tapOpts.hookCompilation === "processAssets" && !tapOpts.stage)
                {
                    return this.addError("Invalid hook parameters: stage not specified for processAssets");
                }
                this.tapCompilationStage(name, compilation, tapOpts);
            });
        });
    }


    /**
     * @protected
     * @param {string} optionName
     * @param {typedefs.WebpackCompilation} compilation
     * @param {typedefs.WpwPluginCompilationTapOptions} options
     * @throws {WebpackError}
     */
    tapCompilationStage(optionName, compilation, options)
    {
        const stageEnum = options.stage ? this.compiler.webpack.Compilation[`PROCESS_ASSETS_STAGE_${options.stage}`] : null,
              name = `${this.name}_${options.stage}`,
              hook = compilation.hooks[options.hookCompilation];

        if (!this.isTapable(hook)) { return; }

        if (stageEnum && options.hookCompilation === "processAssets")
        {
            const logMsg = this.breakProp(optionName).padEnd(this.build.logger.valuePad - 3) + this.logger.tag(`processassets: ${options.stage} stage`);
            if (!options.async) {
                /** @type {typedefs.WebpackSyncHook} */(hook).tap({ name, stage: stageEnum }, this.wrapCallback(logMsg, options));
            }
            else {
                /** @type {typedefs.WebpackAsyncHook} */(hook).tapPromise({ name, stage: stageEnum }, this.wrapCallback(logMsg, options, true));
            }
        }
        else
        {   if (!options.async) {
                /** @type {typedefs.WebpackSyncHook} */(hook).tap(name, this.wrapCallback(optionName, options));
            }
            else {
                if (this.isAsyncHook(hook)) {
                    /** @type {typedefs.WebpackAsyncHook} */(hook).tapPromise(name, this.wrapCallback(optionName, options, true));
                }
                else {
                    return this.addError(`Invalid async hook specified: ${options.hook}`);
                }
            }
        }
        this.tapStatsPrinter(name, options);
    }


    /**
     * @protected
     * @param {string} name
     * @param {typedefs.WpwPluginBaseTapOptions} options
     */
    tapStatsPrinter(name, options)
    {
        const property = options.statsProperty;
        if (!property) { return; }
        this.compilation.hooks.statsPrinter.tap(name, (stats) =>
        {
            const printFn = (/** @type {{}} */prop, /** @type {typedefs.WebpackStatsPrinterContext} */context) => {
                    const statsColor = context[this.build.log.color || "green"];
                    return prop ? statsColor?.(context.formatFlag?.(this.breakProp(property)) || "") || "" : "";
            };
            stats.hooks.print.for(`asset.info.${property}`).tap(name, printFn);
        });
    }


    /**
     * @private
     * @param {typedefs.WebpackCompiler} compiler
     * @param {typedefs.WpwPluginTapOptions} options
     * @throws {WpwError}
     */
	validateApplyOptions(compiler, options)
    {
        if (!options) { return; }
        for (const o of Object.values(options))
        {
            if (!o.hook) {
                return this.addError("Invalid hook parameters specified: hook name is undefined");
            }
            if (o.async && !this.isAsyncHook(compiler.hooks[o.hook]))
            {
                return this.addError(`Invalid hook parameters specified: ${o.hook} is not asynchronous`);
            }
        }
    }


    /**
     * Wraps a vendor plugin to give it access to the WpwBuild instance, and couples it with
     * the the WpwPlugin instance.
     *
     * @template {WpwPlugin} T
     * @param {typedefs.WpwPluginConstructor<T>} clsType the extended WpwPlugin class type
     * @param {typedefs.WpwBuild} build current build wrapper
     * @param {typedefs.WpwBuildOptionsKey} buildOptionsKey
     * @param {typedefs.WpwModuleOptionsValidationArgs | typedefs.WpwModuleOptionsValidationArgs[]} [validation]
     * @returns {T | undefined} T | undefined
     */
    static wrap(clsType, build, buildOptionsKey, validation)
    {
        const buildOptions = build.options[buildOptionsKey],
              enabled = buildOptions && buildOptions.enabled !== false;
        if (enabled && asArray(validation).every(o => isFunction(o) ? o(build) : buildOptions[o[0]] === o[1]))
        {
            const plugin = new clsType({ build, buildOptions });
            plugin.plugins.push(
                ...asArray(plugin.getVendorPlugin(true)).filter(p => !!p), ...asArray(plugin.getVendorPlugin()).filter(p => !!p)
            );
            return plugin;
        }
    }


    /**
     * @private
     * @template {boolean | undefined} T
     * @template {T extends true ? typedefs.WpwPluginWrappedHookHandlerAsync : typedefs.WpwPluginWrappedHookHandlerSync} R
     * @param {string} message If camel-cased, will be formatted with {@link WpwPlugin.breakProp breakProp()}
     * @param {typedefs.WpwPluginBaseTapOptions} options
     * @param {T} [_async]
     * @returns {R} WpwPluginWrappedHookHandler
     */
    wrapCallback(message, options, _async)
    {
        const logger = this.logger,
              callback = isString(options.callback) ? this[options.callback].bind(this) : options.callback,
              logMsg = this.breakProp(message);
        return /** @type {R} */((/** @type {...any} */...args) =>
        {
            logger.start(logMsg, 1);
            const result = callback(...args),
                  _done = () => logger.success(logMsg.replace("       ", "      ").replace(/^start /, ""), 1);
            if (isPromise(result)) {
                result.then((r) => { _done(); return r; });
            }
            else { _done(); }
            return result;
        });
    }

}


module.exports = WpwPlugin;
