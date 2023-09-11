/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/**
 * @file utils/app.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const WpwBase = require("./base");
const WpwSourceCode = require("./sourcecode");
const { isWpwBuildType, isWebpackTarget, WpwBuildConfigKeys } = require("../types/constants");
const {
    utils, objUtils, typedefs, typeUtils, validateSchema, WpwError, WpwLogger, applySchemaDefaults
} = require("../utils");


/**
 * @extends {WpwBase}
 * @implements {typedefs.IWpwBuildConfig}
 * @implements {typedefs.IDisposable}
 */
class WpwBuild extends WpwBase
{
    /** @type {string} @override */
    name;
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
    /** @type {typedefs.WpwLog} */
    log;
    /** @type {typedefs.WpwWebpackMode} */
    mode;
    /** @type {typedefs.WpwBuildOptions} */
    options;
    /** @type {typedefs.WpwRcPaths} */
    paths;
    /** @type {typedefs.WpBuildApp}} @private */
    wrapper;
    /** @type {typedefs.WpwSourceCode} */
    source;
    /** @type {typedefs.WebpackTarget} */
    target;
    /** @type {typedefs.WpwBuildType} */
    type;
    /** @type {typedefs.WpwVsCode} */
    vscode;


    /**
     * @param {typedefs.IWpwBuildConfig} config
     * @param {typedefs.WpBuildApp} wrapper
     */
    constructor(config, wrapper)
    {
        super(config);
        this.wrapper = wrapper;
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
	 * build configuration and update`this.builds` with fully configured build defs
     *
	 * @private
     * @param {typedefs.IWpwBuildConfig} buildConfig
	 */
    configure(buildConfig)
    {
        objUtils.merge(this, buildConfig);
        objUtils.apply(buildConfig, { target: this.getTarget(), type: this.getType() });
        objUtils.apply(this.log, { envTag1: this.name, envTag2: this.target });
        this.mergeDefaultBuildOptions();
        this.resolveAliasPaths();
    }


    /**
     * @private
     */
    getTarget()
    {
        let target = this.target;
        if (!isWebpackTarget(target))
        {
            target = "node";
            if (isWebpackTarget(this.wrapper.cmdLine.target)) { target = this.wrapper.cmdLine.target; }
            else if ((/web(?:worker|app|view)/).test(this.name) || this.type === "webapp") { target = "webworker"; }
            else if ((/web|browser/).test(this.name)) { target = "web"; }
            else if ((/module|node/).test(this.name) || this.type === "module") { target = "node"; }
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
            type = "module";
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
    mergeDefaultBuildOptions()
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
                throw WpwError.get("invalid build options schema");
            }
        });
    }


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

}


module.exports = WpwBuild;
