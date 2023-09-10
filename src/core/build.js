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
const WpwBase = require("./base");
const WpwSourceCode = require("./sourcecode");
const { mkdirSync, existsSync, readFileSync } = require("fs");
const { resolve, dirname, sep } = require("path");
const { isWpwBuildType, isWebpackTarget } = require("../types/constants");
const {
    apply, merge, mergeIf, resolvePath, asArray, WpwLogger, typedefs, applyIf, isArray, relativePath,
    findFilesSync, validateSchema, validateBuildOptions, isBoolean, isNulled, getDefinitionSchemaProperties,
    isObject, getDefinitionSchema, isPrimitive, WpwError, isObjectEmpty, isEmpty
} = require("../utils");


/**
 * @extends {WpwBase}
 * @implements {typedefs.IWpwBuildConfig}
 * @implements {typedefs.IDisposable}
 */
class WpwBuild extends WpwBase
{
    /** @type {typedefs.JsonSchema} @private */
    static schema;

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
     * @param {typedefs.IWpwBuildConfig} config
     * @param {typedefs.WpwRc} rc
     */
    constructor(config, rc)
    {
        if (!config.name) {
            throw WpwError.getErrorMissing("build.name");
        }
        super(config);
        this.rc = rc;
        this.logger = rc.logger;
        this.configure(config);
    }


    /**
     * @param {typedefs.WpwBuildOptions} options
     * @param {typedefs.WpwBuildOptions} initialOptions
     * @throws {WpwError}
     */
    cleanOptions(options, initialOptions)
    {
        this.disposables.push(this.source, this.logger);
        Object.keys(options || {}).forEach((k) =>
        {
            if (options[k] === true) {
                options[k] = { enabled: true };
            }
            else if (options[k] === false) {
                delete options[k];
            }
            else if (isObject(options[k]))
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
                else if (isObjectEmpty(options[k]) || isEmpty(options[k].enabled)) {
                    options[k].enabled = true;
                }
            }
            else {
                throw WpwError.get("invalid build options schema");
            }
        });
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
        merge(this, buildConfig);
        //
        // A build config could specify a different mode and/or target than the main build, e.g. a
        // build that is configured with only a dev and prod config could specify 'development' for
        // the 'test' envirnoment.
        //
        apply(this, {
            mode: this.mode || this.rc.mode,
            target: this.getTarget(),
            type: this.getType(),
            log: { envTag1: this.name , envTag2: this.target }
        });
        merge(this.log, { envTag1: this.name , envTag2: this.target });
        this.validate();
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
            if (isWebpackTarget(this.rc.args.target)) { target = this.rc.args.target; }
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
     * @private
     */
    mergeDefaultBuildOptions()
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
    }


    /**
     * @private
     * @template T
     * @param {T} optionsCfg
     * @param {typedefs.JsonSchema} schemaObject
     * @param {any} definitions
     * @param {string} [baseKey]
     * @returns {T}
     * @throws {WpwError}
     */
    mergeOptions(optionsCfg, schemaObject, definitions, baseKey)
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
                //     throw WpwError.getErrorProperty("schema.definition." + key);
                // }
                else if (isPrimitive(def) || isArray(def)) {
                    throw WpwError.getErrorProperty("schema.definition." + key);
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
    }


    /**
     * @private
     */
    readSchema()
    {
        WpwBuild.schema = WpwBuild.schema ||
            JSON.parse(readFileSync(resolve(__dirname, "../../schema/.wpbuildrc.schema.json"), "utf8"));
    }


    /**
     * @private
     */
    validate()
    {
        this.logger.write(`validate ${this.name} build configuration`, 1);
        this.mergeDefaultBuildOptions();
        this.cleanOptions(this.options, this.initialConfig.options);
        validateSchema(this, this.logger, "build");
        this.logger.write(`final configuration for build '${this.name}' validated`, 2);
    }

}


module.exports = WpwBuild;
