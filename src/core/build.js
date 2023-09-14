/* eslint-disable jsdoc/valid-types */
/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/**
 * @file src/core/build.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const WpwBase = require("./base");
const { existsSync } = require("fs");
const wpexports = require("../exports");
const typedefs = require("../types/typedefs");
const WpwSourceCode = require("./sourcecode");
const { isAbsolute, relative, sep } = require("path");
const { isWpwBuildType, isWebpackTarget, WpwBuildOptionsKeys } = require("../types/constants");
const {
    utils, objUtils, typeUtils, validateSchema, WpwError, WpwLogger, applySchemaDefaults, merge,
    pickNot, resolvePath, isClass, apply, isPromise, pushIfNotExists
} = require("../utils");


/**
 * @extends {WpwBase}
 * @implements {typedefs.IWpwBuildConfig}
 * @implements {typedefs.IDisposable}
 */
class WpwBuild extends WpwBase
{
    /** @type {boolean | undefined} */
    active;
    /** @type {typedefs.WpwWebpackAliasConfig} */
    alias;
    /** @type {boolean} */
    auto;
    /** @type {boolean} */
    debug;
    /** @type {typedefs.WpwWebpackEntry} */
    entry;
    /** @type {WpwError[]} @private */
    errors;
    /** @type {WpwError[]} @private */
    info;
    /** @type {typedefs.WpwLog} */
    log;
    /** @type {typedefs.WpwWebpackMode} */
    mode;
    /** @type {string} @override */
    name;
    /** @type {typedefs.WpwBuildOptions} */
    options;
    /** @type {typedefs.WpwRcPaths} */
    paths;
    /** @type {typedefs.WpwSourceCode} */
    source;
    /** @type {typedefs.WebpackTarget} */
    target;
    /** @type {typedefs.WpwBuildType} */
    type;
    /** @type {typedefs.WpwVsCode} */
    vscode;
    /** @type {WpwError[]} @private */
    warnings;
    /** @type {typedefs.WpwWebpackConfig} */
    wpc;
    /** @type {typedefs.WpwRc}} @private */
    wrapper;


    /**
     * @param {typedefs.IWpwBuildConfig} config
     * @param {typedefs.WpwRc} wrapper
     */
    constructor(config, wrapper)
    {
        super(config);
        apply(this, { info: [], errors: [], warnings: [], wrapper });
        this.validateConfig(config);
        this.configure(config);
        this.logger = new WpwLogger(this.log);
        this.logger.write(`initializing configured build '${this.name}'`, 1);
        this.source = new WpwSourceCode(objUtils.clone(config.source), this);
        validateSchema(this, "WpwBuildConfig", this.logger);
        this.disposables.push(this.source, this.logger);
        this.logger.write(`successfully initialized build '${this.name}'`, 2);
    }


	/**
	 * Merges the base rc level and the environment level configurations into each
	 * build configuration and update`thiss` with fully configured build defs
     *
	 * @private
     * @param {typedefs.IWpwBuildConfig} buildConfig
	 */
    configure(buildConfig)
    {
        objUtils.merge(this, buildConfig);
        objUtils.apply(this, { target: this.getTarget(), type: this.getType() });
        objUtils.apply(this.log, { envTag1: this.name, envTag2: this.target });
        this.mergeDefaultOptions();
        this.configureOptions();
        this.resolveAliasPaths();
    }


	/**
	 * @private
	 */
    configureOptions()
    {
        const messages = [];
        const optionMessage = (/** @type {string} */ o) =>
            `the ${o} option was auto-enabled, enable this option for the ${this.name} build in .wpwraprc to bury this message`;

        if (this.type === "types")
        {
            if (this.options.types?.mode === "tscheck" && !this.options.tscheck)
            {
                this.options.tscheck = { enabled: true };
                pushIfNotExists(messages, "tscheck");
            }
        }
        else if (this.type === "tests")
        {
            if  (!this.options.vendormod || !this.options.vendormod.nyc)
            {
                this.options.vendormod = merge(this.options.vendormod, { enabled: true, nyc: true });
                pushIfNotExists(messages, "vendormod.nyc");
            }
        }

        if (this.type !== "types" && this.source.type === "typescript" && !this.options.tscheck)
        {
            this.options.tscheck = { enabled: true };
            pushIfNotExists(messages, "tscheck");
        }

        if (this.options.sourcemaps)
        {
            if (!this.options.vendormod || !this.options.vendormod.source_map_plugin)
            {
                this.options.vendormod = merge(this.options.vendormod, { enabled: true, source_map_plugin: true });
                pushIfNotExists(messages, "vendormod.source_map_plugin");
            }
            if (this.options.devtool)
            {
                delete this.options.devtool;
                pushIfNotExists(messages, "removed option devtool (sourcemaps overrides)");
            }
        }

        messages.forEach((m) => {
            this.addMessage({ code: WpwError.Msg.INFO_AUTO_ENABLED_OPTION, message: optionMessage(m) });
        });
    }


    /**
     * @override
     */
    dispose = async () =>
    {
        const l = this.logger;
        if (this.info.length > 0) {
            l.warning("REPORTED INFORMATIONAL MESSAGES FOR THIS BUILD:");
            this.info.splice(0).forEach(e => this.printNonFatalIssue(e, l.warning));
        }
        if (this.warnings.length > 0) {
            l.warning("REPORTED NON-FATAL WARNINGS FOR THIS BUILD:");
            this.warnings.splice(0).forEach(w => this.printNonFatalIssue(w, l.warning));
        }
        if (this.errors.length > 0) {
            l.warning("REPORTED ERRORS FOR THIS BUILD:");
            this.errors.splice(0).forEach(e => this.printNonFatalIssue(e, l.error));
        }
        for (const d of this.disposables.splice(0))
        {
            const result = d.dispose();
            if (isPromise(result)) {
                await result;
            }
        }
    };


    get buildCount() { return this.wrapper.buildCount; }
    get cmdLine() { return this.wrapper.args; }
    get isOnlyBuild() { return this.wrapper.isSingleBuild; }
    get pkgJson() { return this.wrapper.pkgJson; }


    /**
     * @param {typedefs.WpwMessageInfo} info
     * @param {string} [pad]
     */
    addMessage = (info, pad) =>
    {
        const l = this.logger,
              icons = this.logger.icons,
              compilation = info.compilation,
              hasCompilation = compilation && isClass(compilation);
        if (/WPW[0-2][0-9][0-9]/.test(info.code))
        {
            const i = WpwError.get(apply({ wpc: this.wpc }, info));
            l.write(i.message, 1, pad, icons.blue.info, l.colors.white);
            this.info.push(i);
        }
        else if (/WPW[3-5][0-9][0-9]/.test(info.code))
        {
            const w = WpwError.get(apply({ wpc: this.wpc }, info));
            l.write(w.message, undefined, pad, icons.color.warning, l.colors.yellow);
            this.warnings.push(w);
            if (hasCompilation) {
                compilation.warnings.push(w);
            }
        }
        else if (/WPW[6-8][0-9][0-9]/.test(info.code))
        {
            const e = WpwError.get(apply({ wpc: this.wpc }, info));
            this.errors.push(e);
            l.write(e.message, undefined, pad, icons.color.error, l.colors.red);
            if (hasCompilation) {
                compilation.errors.push(e);
            }
            else { throw e; }
        }
        else if (/WPW9[0-9][0-9]/.test(info.code)) {
            l.write("reserved message type", undefined, pad, icons.color.warning);
        }
        else {
            l.warning("unknown message type", pad);
        }
    };


    /**
     * @param {string} name
     * @returns {typedefs.WpwBuild | undefined}
     */
    getBuild = (name) => this.wrapper.getBuild(name);


    /**
     * @template {typedefs.WpwGetRcPathOptions | undefined} P
     * @template {P extends { stat: true } ? string | undefined : string} R
     * @param {P} [options]
     * @returns {R}
     */
    getBasePath = (options) => (!options || !options.ctx ? this.getRcPath("base", options) : this.getRcPath("ctx", options));


    /**
     * @template {typedefs.WpwGetRcPathOptions | undefined} P
     * @template {P extends { stat: true } ? string | undefined : string} R
     * @param {P} [options]
     * @returns {R}
     */
    getContextPath = (options) => this.getRcPath("ctx", options);


    /**
     * @template {typedefs.WpwGetRcPathOptions | undefined} P
     * @template {P extends { stat: true } ? string | undefined : string} R
     * @param {P} [options]
     * @returns {R}
     */
    getDistPath = (options) => /** @type {R} */(this.getRcPath("dist", options));


    /**
     * @private
     * @template {typedefs.WpwGetRcPathOptions | undefined} P
     * @template {P extends { stat: true } ? string | undefined : string} R
     * @param {typedefs.WpwRcPathsKey} pathKey
     * @param {P} [options]
     * @returns {R}
     */
    getRcPath = (pathKey, options) =>
    {
        let path;
        const opts = options || /** @type {typedefs.WpwGetRcPathOptions} */({}),
              basePath = opts.ctx ? this.paths.ctx : this.paths.base,
              buildName = opts.build || this.name,
              build = this.getBuild(buildName);

        const _getPath = /** @param {string | undefined} path */(path) =>
        {
            if (path)
            {
                if (opts.rel)
                {
                    if (isAbsolute(path))
                    {
                        if (opts.stat && !existsSync(path)) {
                            path = undefined;
                        }
                        else
                        {
                            path = relative(basePath, path);
                            if (path === basePath) {
                                path = ".";
                            }
                            else if (opts.dot) {
                                path = "." + (opts.psx ? "/" : sep) + path;
                            }
                        }
                    }
                    else
                    {
                        if (opts.stat && !existsSync(resolvePath(basePath, path))) {
                            path = undefined;
                        }
                        else if (opts.dot && !(/^\.[\\\/]/).test(path)) {
                            path = "." + (opts.psx ? "/" : sep) + path;
                        }
                    }
                }
                else
                {
                    if (!isAbsolute(path)) {
                        path = resolvePath(basePath, path);
                    }
                    if (opts.stat && !existsSync(resolvePath(basePath, path))) {
                        path = undefined;
                    }
                }

                return path ? (!opts.psx ? path : path.replace(/\\/g, "/")) : undefined;
            }
        };

        if (build) {
            path = _getPath(build.paths[pathKey]);
        }

        return /** @type {R} */(path || _getPath(this.paths[pathKey]) || _getPath(this.wrapper.paths[pathKey]) || _getPath(basePath));
    };


    /**
     * @template {typedefs.WpwGetRcPathOptions | undefined} P
     * @template {P extends { stat: true } ? string | undefined : string} R
     * @param {P} [options]
     * @returns {R}
     */
    getSrcPath = (options) => this.getRcPath("src", options);


    /**
     * @private
     */
    getTarget()
    {
        let target = this.target;
        if (!isWebpackTarget(target))
        {
            target = "node";
            if (isWebpackTarget(this.cmdLine.target)) { target = this.cmdLine.target; }
            else if ((/web(?:worker|webapp|view)/).test(this.name) || this.type === "webapp") { target = "webworker"; }
            else if ((/web|browser/).test(this.name)) { target = "web"; }
            else if ((/module|node|app/).test(this.name) || this.type === "app") { target = "node"; }
        }
        return target;
    }


    /**
     * @private
     */
    getType()
    {
        let type = this.type;
        if (!type)
        {
            type = "app";
            if (isWpwBuildType(this.name)) { type = this.name; }
            else if ((/web(?:worker|app|view)/).test(this.name)) { type = "webapp"; }
            else if ((/tests?/).test(this.name)) { type = "tests"; }
            else if ((/typ(?:es|ings)/).test(this.name)) { type = "types"; }
            else if (this.target === "webworker") { type = "webapp"; }
        }
        return type;
    }


    /**
     * Applies all default values from schema definitions, and then Removes all options
     * objects that are defined but not enabled, or sets the 'enabled'  flag on the object
     * if it is determined to be enabled but the propertty has been omitted in the config file
     *
     * @throws {WpwError}
     */
    mergeDefaultOptions()
    {
        const options = this.options,
              initialOptions = this.initialConfig.options;
        Object.keys(options).forEach((k) =>
        {
            applySchemaDefaults(options[k], "WpwBuildOptions", k);
            if (options[k] === true) {
                options[k] = { enabled: true };
            }
            else if (options[k] === false) {
                delete options[k];
            }
            else if (typeUtils.isObject(options[k]))
            {
                if (options[k].enabled === false || options[k].enabled !== true)
                {
                    if (!initialOptions[k] || initialOptions[k].enabled === false) {
                        delete options[k];
                    }
                    else {
                        options[k].enabled = true;
                    }
                }
                else if (typeUtils.isObjectEmpty(options[k]) || typeUtils.isEmpty(options[k].enabled)) {
                    options[k].enabled = true;
                }
            }
            else {
                throw WpwError.get({ code: WpwError.Msg.ERROR_SCHEMA_VALIDATION, message: `build options [${this.name}]` });
            }
        });
    }


   /**
    * @private
    */
    printBuildProperties = () =>
    {
        const l = this.logger;
        l.sep();
        l.write("Global Configuration:", 1, "", 0, l.colors.white);
        Object.keys(this.global).filter(k => typeof this.global[k] !== "object").forEach(
            (k) => l.value(`   ${k}`, this.global[k], 1)
        );
        l.sep();
        l.write("Base Configuration:", 1, "", 0, l.colors.white);
        l.value("   name", this.pkgJson.scopedName.name, 1);
        if (this.pkgJson.scopedName.scope) {
            l.value("   npm scope", this.pkgJson.scopedName.scope, 1);
        }
        l.value("   mode", this.wrapper.mode, 1);
        l.value("   logging level", this.wrapper.log.level, 1);
        l.value("   app version", this.pkgJson.version, 1);
        l.value("   wpw version", this.wrapper.wpwVersion, 2);
        l.value("   wpw schema version", this.wrapper.schemaVersion, 2);
        l.value("   # of active builds", this.buildCount, 2);
        l.value("   active build names", this.wrapper.apps.map(a => a.name).join(", "), 2);
        l.value("   # of defined builds", this.wrapper.builds.length, 2);
        l.value("   defined build names", this.wrapper.builds.map(b => b.name).join(", "), 2);
        l.sep();
        l.write("Build Configuration:", 1, "", 0, l.colors.white);
        l.value("   name", this.name, 1);
        l.value("   type", this.type, 1);
        l.value("   target", this.target, 1);
        l.value("   source code type", this.source.type, 2);
        l.value("   is vscode extension", !!this.vscode && !!this.vscode.type, 2);
        l.value("   logging level", this.log.level, 2);
        l.value("   alias configuration", JSON.stringify(this.alias), 3);
        l.value("   log configuration", JSON.stringify(this.log), 3);
        l.value("   options configuration", JSON.stringify(this.options), 3);
        l.value("   paths configuration", JSON.stringify(this.paths), 3);
        l.sep();
        if (l.level >= 2)
        {
            l.write("Build Options:", 2, "", 0, l.colors.white);
            WpwBuildOptionsKeys.forEach((key) => { l.value(`   ${key} enabled`, !!this.options[key]); });
            l.value("   options configuration", JSON.stringify(this.options), 3);
            l.sep();
            l.write("Build Paths:", 2, "", 0, l.colors.white);
            l.value("   base/project directory", this.getBasePath());
            l.value("   context directory", this.getContextPath());
            l.value("   distribution directory", this.getDistPath());
            l.value("   source directory", this.getSrcPath());
            l.value("   temp directory", this.getRcPath("temp"));
            l.sep();
            l.write(`Build Paths Relative to [${this.getBasePath()}]:`, 2, "", 0, l.colors.white);
            l.value("   context directory", this.getContextPath({ rel: true }));
            l.value("   distribution directory", this.getDistPath({ rel: true }));
            l.value("   source directory", this.getSrcPath({ rel: true }));
            l.sep();
        }
        l.write("Source Code Configuration:", 1, "", 0, l.colors.white);
        l.value("   source code ext", this.source.ext, 1);
        l.value("   source code type", this.source.type, 1);
        l.value("   ts/js config file", this.source.config.file, 2);
        l.value("   ts/js config directory", this.source.config.dir, 2);
        l.value("   ts/js config path", this.source.config.path, 2);
        l.value("   sourcecode configured options", JSON.stringify(pickNot(this.source.config, "raw", "options")), 3);
        l.value("   ts/js configured options", JSON.stringify(pickNot(this.source.config.options, "compilerOptions", "files")), 3);
        l.value("   ts/js configured compiler options", JSON.stringify(this.source.config.options.compilerOptions), 3);
        l.value("   ts/js configured files", JSON.stringify(this.source.config.options.files), 4);
        l.sep();
    };


    printBuildStart = () =>
    {
        this.logger.value(
            `Start Webpack build ${++this.global.buildCount}`,
            this.logger.tag(this.name) + " " + this.logger.tag(this.target),
            undefined, undefined, this.logger.icons.color.start, this.logger.colors.white
        );
    };


    /**
     * @private
     * @param {WpwError} e
     * @param {Function} fn
     * @param {string} [icon]
     */
    printNonFatalIssue = (e, fn, icon) =>
    {
        if (!icon || fn.name !== "write") {
            fn.call(this.logger, `Location: ${e.file}`);
        }
        else {
            fn.call(this.logger, `Location: ${e.file}`, undefined, "", this.logger.icons.color.star);
        }
        fn.call(this.logger, "   " + e.message);
    };


    /**
     * @private
     */
    printWpcProperties = () =>
     {
         const l = this.logger;
         l.write("Webpack Configuration:", 1, "", 0, l.colors.white);
         l.value("   build name", this.wpc.name, 1);
         l.value("   mode", this.wpc.mode, 1);
         l.value("   target",this.wpc.target, 1);
         l.value("   infrastructure logging level", this.wpc.infrastructureLogging?.level || "none", 2);
         l.value("   context directory", this.wpc.context, 1);
         l.value("   output directory", this.wpc.output.path, 1);
         l.value("   entry", JSON.stringify(this.wpc.entry), 3);
         l.value("   resolve", JSON.stringify(this.wpc.resolve), 3);
         l.value("   output", JSON.stringify(this.wpc.output), 3);
         l.value("   rules", JSON.stringify(this.wpc.module.rules), 3);
         l.sep();
    };


    /**
     * @private
     */
    resolveAliasPaths = () =>
    {
        if (!this.alias) { return; }

        const alias = this.alias,
              jstsConfig = this.source.config,
              jstsDir = jstsConfig.dir,
              jstsPaths = jstsConfig.options.compilerOptions.paths;

        const _pushAlias = (/** @type {string} */ key, /** @type {string} */ path) =>
        {
            const value = alias[key];
            if (typeUtils.isArray(value))
            {
                if (!value.includes(path)) {
                    value.push(path);
                }
            }
            else { alias[key] = [ path ]; }
        };

        if (jstsDir && jstsPaths)
        {
            Object.entries(jstsPaths).filter(p => typeUtils.isArray(p)).forEach(([ key, paths ]) =>
            {
                if (paths) utils.asArray(paths).forEach((p) => _pushAlias(key, utils.resolvePath(jstsDir, p)), this);
            });
        }

        if (!alias[":env"])
        {
            const basePath = this.paths.base,
                  srcPath = utils.relativePath(basePath, this.paths.src),
                  envGlob = `**/${srcPath}/**/{env,environment,target}/${this.target}/`,
                  envDirs = utils.findFilesSync(envGlob, { cwd: basePath, absolute: true, dotRelative: false });
            envDirs.forEach((path) => _pushAlias(":env", path), this);
        }
    };


    /**
     * @private
     * @param {typedefs.IWpwBuildConfig} config
     */
    validateConfig(config)
    {
        if (!config.name) {
            throw WpwError.getErrorMissing("build[config.name]");
        }
        if (!config.type) {
            throw WpwError.getErrorMissing("build[config.type]");
        }
        if (!config.mode) {
            throw WpwError.getErrorMissing("build[config.mode]");
        }
        if (!config.target) {
            throw WpwError.getErrorMissing("build[config.target]");
        }
    }


    /**
     * @private
     * @returns {typedefs.WpwWebpackConfig}
     */
    webpackDefaultExports = () =>
    {
        const build = this;
        return {
            cache: { type: "memory" },
            context: build.paths.ctx || build.paths.base,
            entry: {},
            mode: build.mode === "test" ? "none" : build.mode,
            module: { rules: [] },
            name: `${this.pkgJson.scopedName.scope}|${this.pkgJson.version}|${build.name}|${build.mode}|${build.target}`,
            output: { path: this.getDistPath() }, // { path: this.getDistPath({ rel: true }) }
            plugins: [],
            resolve: {},
            target: build.target
        };
    };


    /**
     * @returns {typedefs.WpwWebpackConfig}
     */
    webpackExports = () =>
    {
        this.wpc = this.webpackDefaultExports();
        this.global.buildCount = this.global.buildCount || 0;
        this.printBuildStart();
        try
        {   wpexports.cache(this);          // Asset cache
            wpexports.experiments(this);    // Set any experimental flags that will be used
            wpexports.entry(this);          // Entry points for built output
            wpexports.externals(this);      // External modules
            wpexports.ignorewarnings(this); // Warnings from the compiler to ignore
            wpexports.optimization(this);   // Build optimization
            wpexports.minification(this);   // Minification / Terser plugin options
            wpexports.output(this);         // Output specifications
            wpexports.devtool(this);        // Dev tool / sourcemap control
            wpexports.resolve(this);        // Resolve config
            wpexports.rules(this);          // Loaders & build rules
            wpexports.stats(this);          // Stats i.e. console output & webpack verbosity
            wpexports.watch(this);          // Watch-mode options
            wpexports.plugins(this);        // Plugins - exports.plugins() inits all plugin.plugins
            this.printBuildProperties();
            this.printWpcProperties();
        }
        catch (e)
        {   this.logger.blank(undefined, this.logger.icons.color.error);
            this.logger.error("An error was encountered while creating the webpack configuration export");
            this.logger.error("Using the following build parameters:");
            this.logger.blank(undefined, this.logger.icons.color.error);
            this.printBuildProperties();
            this.logger.blank(undefined, this.logger.icons.color.error);
            throw e;
        }
        return this.wpc;
    };

}


module.exports = WpwBuild;
