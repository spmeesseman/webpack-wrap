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
 *     6.  Add the module into the module in the webpack exports byt importing and placing it
 *         in an appropriate position in the configuraation plugin array.
 *         file:///c:\Projects\vscode-taskexplorer\webpack\exports\plugins.js
 */

const { WebpackError } = require("webpack");
const { readFile } = require("fs/promises");
const typedefs = require("../types/typedefs");
const WpBuildCache = require("../utils/cache");
const { relative, basename } = require("path");
const WpwPluginWaitManager = require("./wait");
const WpwBaseModule = require("../core/basemodule");
const { isFunction, mergeIf, execAsync, WpBuildError, asArray, applyIf, WpwMessageEnum } = require("../utils");


/**
 * @abstract
 * @extends {WpwBaseModule}
 * @implements {typedefs.IWpBuildPlugin}
 */
class WpwPlugin extends WpwBaseModule
{
    /** @protected */
    cache;
    /** @type {typedefs.WebpackCompilation} */
    compilation;
    /** @type {typedefs.WebpackCompiler} compiler */
    compiler;
    /** @type {typedefs.WpwPluginOptions} @override @protected */
    options;
    /**  @type {typedefs.WebpackPluginInstance[]} @private */
    plugins;
    /** @type {typedefs.WebpackCacheFacade} @protected */
    wpCache;
    /** @type {typedefs.WebpackCacheFacade}  @protected */
    wpCacheCompilation;
    /** @type {typedefs.WebpackLogger} @protected */
    wpLogger;
    /**  @private  */
    static eventManager = new WpwPluginWaitManager();


    /**
     * @param {typedefs.WpwPluginOptions} options Plugin options to be applied
     */
	constructor(options)
    {
        super(options);
        this.plugins = [];
        this.validatePluginOptions(options);
        this.options = applyIf(this.options, options);
        this.cache = new WpBuildCache(this.app, WpwPlugin.cacheFilename(this.app.build.mode, this.baseName));
        if (!this.options.wrapPlugin)
        {
            mergeIf(this.options, { plugins: [] });
            const plugins = asArray(this.options.plugins);
            if (options.registerVendorPluginsOnly) {
                this.plugins = [ ...plugins.map(p => new p.ctor(p.options)) ];
            }
            else if (options.registerVendorPluginsFirst) {
                this.plugins = [ ...plugins.map(p => new p.ctor(p.options)), this ];
            }
            else {
                this.plugins = [ this, ...plugins.map(p => new p.ctor(p.options)) ];
            }
        }
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
     * @returns {string}
     */
    breakProp = (prop) => prop.replace(/_/g, "").replace(/[A-Z]{2,}/g, (v) => v[0] + v.substring(1).toLowerCase())
                              .replace(/[a-z][A-Z]/g, (v) => `${v[0]} ${v[1]}`).toLowerCase();


    /**  @protected  */
    static cacheFilename = (/** @type {string} */ mode, /** @type {string} */ name) => `plugincache_${mode}_${name}.json`;


    /**
     * @protected
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
            this.handleError("failed while checking if cached snapshot exists", e);
        }
        return !!cacheEntry && !!cacheEntry.snapshot;
    };


	/**
	 * @protected
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
	 * @protected
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
	 * Executes a command via a promisified node exec()
	 * @param {string} command
	 * @param {string} program
	 * @param {string | string[]} [ignoreOut]
	 * @returns {Promise<number | null>}
	 */
	exec = (command, program, ignoreOut) =>
        execAsync({ command, program, logger: this.logger, execOptions: { cwd: this.wpc.context }, ignoreOut });


	/**
	 * @protected
	 * @returns {RegExp}
	 */
    fileNameHashRegex = () => new RegExp(`\\.[a-z0-9]{${this.hashDigestLength},}`);


	/**
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
     * @returns {(typedefs.WebpackPluginInstance | InstanceType<WpwPlugin>)[]}
     */
    getPlugins() { return this.plugins; }


    /**
     * @abstract
	 * @protected
     * @returns {typedefs.WebpackPluginInstance}
     */
    getVendorPlugin() { return { apply: () => {} }; };


	/**
	 * @private
	 * @param {string} message
	 * @param {WpBuildError | WebpackError | Error | undefined} [error]
	 * @throws {WpBuildError}
	 */
	handleError(message, error)
	{
        const err = error ?? new WpBuildError(message, error);
        this.app.addError(WpwMessageEnum.ERROR_GENERAL, this.compilation, err);
        if (!this.compilation) {
            throw err;
        }
	}


    /**
     * @protected
     * @param {string|any} hook
     * @returns {hook is typedefs.WebpackAsyncCompilerHook | typedefs.WebpackAsyncCompilationHook}
     */
    isAsyncHook = (hook) => isFunction(hook.tapPromise);


    /**
     * @protected
     * @param {string} file
     * @returns {boolean}
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
     * @param {typedefs.WpBuildPluginTapOptions} [options]
     * @throws {WebpackError}
     */
    onApply(compiler, options)
    {
        this.compiler = compiler;
        this.wpCache = compiler.getCache(this.name);
        this.wpLogger = compiler.getInfrastructureLogger(this.name);
        this.hashDigestLength = compiler.options.output.hashDigestLength || this.app.wpc.output.hashDigestLength || 20;

        if (options)
        {
            this.validateApplyOptions(compiler, options);
            const optionsArray = Object.entries(options),
                  hasCompilationHook = optionsArray.find(([ _, tapOpts ]) => tapOpts.hook === "compilation") ||
                                       optionsArray.every(([ _, tapOpts ]) => !!tapOpts.stage);
            if (hasCompilationHook)
            {
                const compilationHooks = /** @type {[string, typedefs.WpBuildPluginCompilationOptionsEntry][]} */(
                    optionsArray.filter(([ _, tapOpts ]) => tapOpts.hook === "compilation")
                );
                this.tapCompilationHooks(compilationHooks);
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
                        this.handleError(`Invalid async hook parameters specified: ${tapOpts.hook}`);
                        return;
                    }
                }
            }
        }
        //
        // if there's a wrapped vendor plugin, then forward the compiler instance to the plugin's apply() method
        //
        if (this.options.wrapPlugin) {
            this.plugins[0].apply.call(this.plugins[0], compiler);
        }
    }


    /**
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
     * Extending plugins need to call this function when it's specific tassks are done/complete.
     * Used in the {@link WpwPlugin.eventInfo wait} functionality
     *
     * @protected
     * @param {...any} args any plugin specific arguments
     */
    onDone(...args) { WpwPlugin.eventManager.onPluginDone(this.name, ...args); }


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
     * @param {[string, typedefs.WpBuildPluginCompilationOptionsEntry][]} optionsArray
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
                this.tapCompilationStage(name, /** @type {typedefs.WpBuildPluginCompilationOptionsEntry} */(tapOpts));
            });
        });
    }


    /**
     * @protected
     * @param {string} optionName
     * @param {typedefs.WpBuildPluginCompilationOptionsEntry} options
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
                const logMsg = this.breakProp(optionName).padEnd(this.app.logger.valuePad - 3) + this.logger.tag(`processassets: ${options.stage} stage`);
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
     * @param {typedefs.WpBuildPluginTapOptionsEntry} options
     */
    tapStatsPrinter(name, options)
    {
        const property = options.statsProperty;
        if (property)
        {
            this.compilation.hooks.statsPrinter.tap(name, (stats) =>
            {
                const printFn = (/** @type {{}} */prop, /** @type {typedefs.WebpackStatsPrinterContext} */context) => {
                      const statsColor = context[this.app.build.log.color || "green"];
                      return prop ? statsColor?.(context.formatFlag?.(this.breakProp(property)) || "") || "" : "";
                };
                stats.hooks.print.for(`asset.info.${property}`).tap(name, printFn);
            });
        }
    }


    /**
     * @private
     * @param {typedefs.WebpackCompiler} compiler
     * @param {typedefs.WpBuildPluginTapOptions} options
     * @throws {WpBuildError}
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
     * @private
     * @param {typedefs.WpwPluginOptions} _options Plugin options to be applied
     * @throws {typedefs.WpBuildError}
     */
	validatePluginOptions(_options)
    {
    }


    /**
     * Wraps a vendor plugin to give it access to the WpBuildApp instance. vendor plugin instantiation
     * is done via the constructor's call to  the {@link WpwPlugin.getOptions getOptions()} override
     * @template {WpwPlugin} T
     * @param {new(arg1: typedefs.WpwPluginOptions) => T} clsType the extended WpwPlugin class type
     * @param {typedefs.WpBuildApp} app current build wrapper
     * @param {typedefs.WpwBuildOptionsKey} optionsKey
     * @returns {T | undefined}
     */
    static wrap(clsType, app, optionsKey)
    {
        if (app.build.options[optionsKey]?.enabled)
        {
            const plugin = new clsType({ app, wrapPlugin: true });
            plugin.plugins.push(plugin.getVendorPlugin());
            return plugin;
        }
    }


    /**
     * @private
     * @param {string} message If camel-cased, will be formatted with {@link WpwPlugin.breakProp breakProp()}
     * @param {typedefs.WpBuildPluginTapOptionsEntry} options
     * @returns {typedefs.WpBuildCallback}
     */
    wrapCallback(message, options)
    {
        let cb;
        const logger = this.logger,
              callback = options.callback,
              logMsg = this.breakProp(message),
              eMgr= WpwPlugin.eventManager,
              wait = this.app.build.options.wait;

        if (!options.async) {
            cb = (/** @type {any} */arg) => {
                logger.start(logMsg, 1);
                callback(arg);
                eMgr.emit(`${this.name}_start`, options.hook);
            };
        }
        else {
            cb = async (/** @type {any} */arg) => {
                logger.start(logMsg, 1);
                await callback(arg);
                eMgr.emit(`${this.name}_start`, options.hook);
            };
        }
        if (wait)
        {
            Object.keys(wait).forEach(waitPlugin =>
            {
                const delayedCb = cb;
                cb = () => {
                    eMgr.register({
                        type: "event",
                        source: /** @type {typedefs.WpwBuildOptionsPluginKey} */(this.key),
                        target: /** @type {typedefs.WpwBuildOptionsPluginKey} */(waitPlugin),
                        name: `${waitPlugin}_done`,
                        callback: () => delayedCb.call(this, message, options)
                    });
                };
            }, this);
        }
        return cb;
    }
}


module.exports = WpwPlugin;
