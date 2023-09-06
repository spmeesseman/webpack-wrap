/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

/**
 * @file utils/app.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const os = require("os");
const WpwSourceCode = require("./sourcecode");
const { mkdirSync, existsSync, readFileSync } = require("fs");
const { resolve, dirname, sep } = require("path");
const { isWpwBuildType, isWebpackTarget } = require("../types/constants");
const {
    apply, merge, mergeIf, resolvePath, asArray, WpwLogger, typedefs, applyIf, isArray,
    relativePath, findFilesSync, validateSchema, validateBuildOptions, isBoolean, getDefinitionSchemaProperties, isObject, getDefinitionSchema, isPrimitive, WpBuildError
} = require("../utils");

const defaultTempDir = `node_modules${sep}.cache${sep}wpbuild${sep}temp`;


/**
 * @implements {typedefs.IWpwBuild}
 * @implements {typedefs.IDisposable}
 */
class WpwBuild
{
    /** @type {typedefs.JsonSchema} @private */
    static schema;

    /** @type {string} */
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
    /** @type {WpwLogger} @private */
    logger;
    /** @type {typedefs.WpwWebpackMode} */
    mode;
    /** @type {typedefs.WpwBuildOptions} */
    options;
    /** @type {typedefs.WpwRcPaths} */
    paths;
    /** @type {typedefs.WpwRc}} @private */
    rc;
    /** @type {typedefs.WpwSourceCode} */
    source;
    /** @type {typedefs.WebpackTarget} */
    target;
    /** @type {typedefs.WpwBuildType} */
    type;
    /** @type {typedefs.WpwVsCode} */
    vscode;


    /**
     * @param {typedefs.IWpwBuild} config
     * @param {typedefs.WpwRc} rc
     * @param {WpwLogger} logger
     */
    constructor(config, rc, logger)
    {
        this.rc = rc;
        this.logger = logger;
        this.configure(config);
        const sourceConfig = merge({}, this.source);
        this.source = new WpwSourceCode(sourceConfig, this, this.logger);
        //
        // Alias paths need to be resolved "after" app` instance is created (notably the `app.source` instance)
        //
        this.resolveAliasPaths();
    }


    dispose = () => this.source.dispose();


    /**
     * @private
     * @param {typedefs.WpwBuildModeConfigBase} rc
     * @returns {typedefs.WpwBuildModeConfigBase}
     */
    applyDefaultRc = (rc) =>
    {
        if (!rc.options) { rc.options = {}; }
        if (!rc.log) {
            rc.log = WpwLogger.defaultOptions();
        }
        else
        {   if (!rc.log.colors) {
                rc.log.colors = WpwLogger.defaultOptions().colors;
            }
            else if (!rc.log.colors.default) {
                rc.log.colors.default = WpwLogger.defaultOptions().colors.default;
            }
            if (!rc.log.pad) {
                rc.log.pad = WpwLogger.defaultOptions().pad;
            }
        }
        if (!rc.paths) {
            rc.paths = { base: ".", src: "src", dist: "dist", ctx: ".", temp: defaultTempDir };
        }
        else
        {   if (!rc.paths.base) { rc.paths.base = "."; }
            if (!rc.paths.src) { rc.paths.src = "src"; }
            if (!rc.paths.dist) { rc.paths.dist = "dist"; }
            if (!rc.paths.ctx) { rc.paths.ctx = "."; }
            if (!rc.paths.temp) { rc.paths.temp = defaultTempDir; }
        }
        if (!rc.source)
        {
            rc.source = {
                type: "javascript", ext: "js",
                config: { options: { compilerOptions: {}, files: [] }, excludeAbs: [], includeAbs: [] }
            };
        }
        else
        {
            if (!rc.source.type) {
                rc.source.type = "javascript";
                rc.source.type = "js";
            }
            else if (!rc.source.ext) {
                rc.source.ext = rc.source.type === "javascript" ? "js" : "ts";
            }
            if (!rc.source.config) {
                rc.source.config = {
                    options: { compilerOptions: {}, files: [] }, excludeAbs: [], includeAbs: []
                };
            }
            else if (!rc.source.config.options) {
                rc.source.config.options = { compilerOptions: {}, files: [] };
            }
        }
        return rc;
    };


	/**
	 * Merges the base rc level and the environment level configurations into each
	 * build configuration and update`this.builds` with fully configured build defs
     *
	 * @private
     * @param {typedefs.IWpwBuild} buildConfig
	 */
    configure = (buildConfig) =>
    {
        /**  @template D, S */
        const _applyProperty = (/** @type {string}  */property, /** @type {D}  */dst, /** @type {S}  */src) =>
        {
            if (src[property])
            {
                if (!dst[property]) {
                    dst[property] = merge({}, src[property]);
                }
                else {
                    mergeIf(dst[property], src[property]);
                }
            }
        };

        const _applyRc = (/** @type {typedefs.IWpwBuild}  */dst, /** @type {typedefs.WpwBuildModeConfigBase}  */src) =>
        {
            _applyProperty("paths", dst, src);
            _applyProperty("options", dst, src);
            _applyProperty("alias", dst, src);
            _applyProperty("source", dst, src);
            _applyProperty("vscode", dst, src);
            _applyProperty("log", dst, src);
            if (dst.log.color) {
                const clr = dst.log.color;
                applyIf(dst.log.colors, { valueStar: clr, buildBracket: clr, tagBracket: clr, infoIcon: clr });
            }
            apply(dst, { mode: dst.mode });
            return dst;
        };

        this.logger.write(`configure build '${this.name}'`, 1);
        merge(this, buildConfig);

        this.logger.write("   apply base configuration", 2);
        apply(this, { mode: this.mode || this.rc.mode, target: this.getTarget(), type: this.getType() });
        _applyRc(this, this.applyDefaultRc(this.rc));

        const modeRc = /** @type {Partial<typedefs.WpwBuildModeConfig>} */(this.rc[this.rc.mode]);
        const modeBuildRc = asArray(modeRc?.builds).find(b => b.name === this.name);
        if (modeBuildRc) {
            this.logger.write("   apply mode configuration", 2);
            _applyRc(this, modeBuildRc);
        }

        this.logger.write("   resolve build paths", 2);
        this.applyDefaultRc(this);
        this.resolvePaths();

        this.logger.write("   trim & validate build options", 2);
        validateBuildOptions(this.options, buildConfig.options);
        this.mergeDefaultBuildOptions();

        this.logger.write("   validate final build configuration", 2);
        validateSchema(this, this.logger, "build");

        this.logger.write(`final configuration for build '${this.name}' complete`, 2);
    };


    /**
     * @private
     */
    getTarget = () =>
    {
        let target = this.target;
        if (!isWebpackTarget(target))
        {
            target = "node";
            if (isWebpackTarget(this.rc.args.target)) { target = this.rc.args.target; }
            else if ((/web(?:worker|app|view)/).test(this.name) || this.type === "webapp") { target = "webworker"; }
            else if ((/web|browser/).test(this.name)) { target = "web"; }
            else if ((/module|node/).test(this.name) || this.type === "module") { target = "node"; }
        }
        return target;
    };


    /**
     * @private
     */
    getType = () =>
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
    };


    /**
     * @private
     */
    mergeDefaultBuildOptions = () =>
    {
        this.readSchema();
        Object.keys(this.options).forEach(/** @type {typedefs.WpwBuildOptionsKey} */(optionsKey) =>
        {
            const config = this.options[optionsKey],
                  definitions = WpwBuild.schema.definitions;
            if (config && definitions)
            {
                const buildOptionSchema = definitions.WpwBuildOptions;
                if (buildOptionSchema && !isBoolean(buildOptionSchema) && buildOptionSchema.properties)
                {
                    const buildConfig = getDefinitionSchemaProperties(
                        buildOptionSchema.properties[/** @type {string} */(optionsKey)], definitions
                    );
                    if (buildConfig && isObject(buildConfig)) {
                        this.mergeOptions(config, buildConfig, definitions);
                    }
                }
            }
        });
    };


    /**
     * @private
     * @template T
     * @param {T} optionsCfg
     * @param {typedefs.JsonSchema} schemaObject
     * @param {any} definitions
     * @param {string} [baseKey]
     * @returns {T}
     * @throws {WpBuildError}
     */
    mergeOptions = (optionsCfg, schemaObject, definitions, baseKey) =>
    {
        for (const [ k, def ] of Object.entries(schemaObject))
        {
            const key = baseKey || k;
            if (def && (typeof optionsCfg[key] === "undefined" || optionsCfg[key] === undefined))
            {
                if (def.$ref)
                {
                    const schema = getDefinitionSchema(def, definitions);
                    if (schema.properties) {
                        this.mergeOptions(optionsCfg, schema.properties || schema, definitions, key);
                    }
                    else if (schema.default || isPrimitive(schema.default)) {
                        optionsCfg[key] = schema.default;
                    }
                }
                // else if (isBoolean(def)) {
                //     throw WpBuildError.getErrorProperty("schema.definition." + key);
                // }
                else if (isPrimitive(def) || isArray(def)) {
                    throw WpBuildError.getErrorProperty("schema.definition." + key);
                }
                else if (def.default) {
                    // if (isPrimitive(def.default)) {
                        optionsCfg[key] = def.default;
                    // }
                    // else {
                    //     optionsCfg[key] = undefined; // ?
                    // }
                }
                // else if (def.type === "string") {
                //     optionsCfg[key] = undefined;
                // }
                // else if (def.type === "boolean") {
                //     optionsCfg[key] = undefined;
                // }
                // else if (isArray(def.enum)) {
                //     optionsCfg[key] = undefined;
                // }
                // else if (isArray(def.oneOf)) {
                //     optionsCfg[key] = undefined;
                // }
                // else if (def.type === "array") {
                //     optionsCfg[key] = undefined; // [];
                // }
                else {
                    optionsCfg[key] = undefined; // {};
                }
            }
        }
        return optionsCfg;
    };


    /**
     * @private
     */
    readSchema = () =>
    {
        WpwBuild.schema = WpwBuild.schema ||
            JSON.parse(readFileSync(resolve(__dirname, "../../schema/.wpbuildrc.schema.json"), "utf8"));
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
            if (isArray(value))
            {
                if (!value.includes(path)) {
                    value.push(path);
                }
            }
            else { alias[key] = [ path ]; }
        };

        if (jstsDir && jstsPaths)
        {
            Object.entries(jstsPaths).filter(p => isArray(p)).forEach(([ key, paths ]) =>
            {
                if (paths) asArray(paths).forEach((p) => _pushAlias(key, resolvePath(jstsDir, p)), this);
            });
        }

        if (!alias[":env"])
        {
            const basePath = this.paths.base,
                  srcPath = relativePath(basePath, this.paths.src),
                  envGlob = `**/${srcPath}/**/{env,environment,target}/${this.target}/`,
                  envDirs = findFilesSync(envGlob, { cwd: basePath, absolute: true, dotRelative: false });
            envDirs.forEach((path) => _pushAlias(":env", path), this);
        }
    };


	/**
	 * @private
	 */
	resolvePaths = () =>
	{
        const paths = this.paths,
              base = dirname(this.rc.pkgJsonPath),
              // @ts-ignore
              ostemp = os.tmpdir ? os.tmpdir() : os.tmpDir(),
			  temp = resolve(
                  ostemp ? `${ostemp}${sep}${this.rc.pkgJson.scopedName.name}` : defaultTempDir,
                  `${this.target}${sep}${this.mode}`
              );
		if (!existsSync(temp)) {
			mkdirSync(temp, { recursive: true });
		}
        paths.base = base;
        paths.temp = paths.temp && paths.temp !== defaultTempDir ? paths.temp : temp;
        paths.ctx = paths.ctx ? resolvePath(base, paths.ctx) : base;
        paths.src = resolvePath(base, paths.src || "src");
        paths.dist = resolvePath(base, paths.dist || "dist");
	};

}


module.exports = WpwBuild;
