/* eslint-disable jsdoc/valid-types */
// @ts-check

/**
 * @file utils/schema.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const JSON5 = require("json5");
const WpwRegex = require("./regex");
const WpwError = require("./message");
const { readFileSync } = require("fs");
const { resolve, join } = require("path");
const { validate } = require("schema-utils");
const typedefs = require("../types/typedefs");
const { WpwKeysEnum } = require("../types/constants");
const { isBoolean, isString, isObject, isArray, isPrimitive, pick, isNulled } = require("@spmeesseman/type-utils");

const schemas = {};
const SchemaDirectory = resolve(__dirname, "..", "..", "schema");


// /**
//  * @template T
//  * @template {keyof typedefs} K
//  * @template {typedefs[K]} R
//  * @param {T | Partial<T>} config
//  * @param {K} schemaKey
//  * @param {...string} propertyKeys
//  * @returns {R}
//  * @throws {WpwError}
//  */

/**
 * @template T
 * @param {T | Partial<T>} config
 * @param {typedefs.WpwJsonSchemaKey} schemaKey
 * @param {NonNullable<typedefs.JsonSchema>} schemaObj
 * @throws {WpwError}
 */
const _applySchemaDefaults = (config, schemaKey, schemaObj) =>
{
    for (const [ k, d ] of Object.entries(schemaObj))
    {
        let def = d;
        const key = k;
        if (def && isNulled(config[key]))
        {
            if (def.$ref) {
                def = getDefinitionSchema(def);
            }
            if (isPrimitive(def) || isArray(def)) {
                throw WpwError.getErrorProperty("schema.definition." + key, null, `[schemakey: ${schemaKey}] [def:${def.toString()}]`);
            }
            if (def.default) {
                config[key] = def.default;
            }
            // else if (isArray(def)) {
            //     config[key] = [];
            // }
            else if (def.properties) {
                config[key] = {};
                _applySchemaDefaults(config[k], schemaKey, def.properties);
            }
            // else {
            //     config[key] = undefined; // {};
            // }
        }
    }
};


/**
 * @template T
 * @param {T | Partial<T>} config
 * @param {typedefs.WpwJsonSchemaKey} schemaKey
 * @param {...string} propertyKeys
 * @returns {T}
 * @throws {WpwError}
 */
const applySchemaDefaults = (config, schemaKey, ...propertyKeys) =>
{
    const definitions = /** @type {Exclude<typedefs.JsonSchemaDefinition, undefined>} */(getSchema("WpwSchema").definitions);
    let schemaObj = getDefinitionSchema(definitions[/** @type {string} */(schemaKey)]);
    propertyKeys.forEach((key) =>
    {
        if (schemaObj) {
            schemaObj = getDefinitionSchemaProperties(schemaObj);
            schemaObj = getDefinitionSchema(schemaObj[key]);
        }
        else {
            throw WpwError.getErrorProperty("schema error - could not locate specified schema key");
        }
    });
    schemaObj = getDefinitionSchemaProperties(schemaObj);
    _applySchemaDefaults(config, schemaKey, schemaObj);
    return /** @type {T} */(config);
};


/**
 * @template {"WpwSchema" | string | undefined} T
 * @template {T extends "WpwSchema" | undefined ? typedefs.JsonSchema : typedefs.JsonSchema | undefined} R
 * @param {T} [key]
 * @returns {R}
 */
const getSchema = (key) =>
{
    const sKey = `${key || "WpwSchema"}`;
    if (!schemas[sKey])
    {
        try {
            schemas[sKey] = JSON5.parse(readFileSync(getSchemaFile(sKey), "utf8"));
        }
        catch (e) {
            WpwError.get("failed to read schema file", null, e);
        }
    }
    return /** @type {R} */(schemas[sKey]);
};


/**
 * @param {string} key
 * @returns {string}
 */
const getSchemaFile = (key) =>
    join(SchemaDirectory, `.wpbuildrc.schema.${key && key !== "WpwSchema" ? `${key.replace(/^Wpw/, "").toLowerCase()}.` : ""}json`);


/**
 * @param {boolean | typedefs.JsonSchema} schemaObj
 * @returns {NonNullable<typedefs.JsonSchema>}
 */
const getDefinitionSchema = (schemaObj) =>
{
    /** @type {NonNullable<typedefs.JsonSchema>} */
    let property = { type: "object", properties: { enabled: { const: true }}};
    if (!isBoolean(schemaObj) && isObject(schemaObj))
    {
        const definitions = getSchema("WpwSchema").definitions;
        if (definitions)
        {
            property = schemaObj;
            while (isString(property.$ref))
            {
                const refProperty = definitions[refName(property.$ref)];
                if (!isBoolean(refProperty) && isObject(refProperty, true)) {
                    property = refProperty;
                }
            }
        }
    }
    return property;
};


/**
 * @param {boolean | typedefs.JsonSchema} schemaObj
 * @returns {Exclude<typedefs.JsonSchemaProperties, undefined>}
 */
const getDefinitionSchemaProperties = (schemaObj) =>
{
    const schema = getDefinitionSchema(schemaObj);
    if (schema.properties) {
        return schema.properties;
    }
    return { enabled: { const: false }};
};


const getSchemaVersion = (/** @type {string | undefined} */ key) =>
    schemas[`Wpw${key || "Schema"}`].$id.match(WpwRegex.PathVersion)?.[1] || "0.0.1";


const refName = (/** @type {string} */ ref) => ref.replace("#/definitions/", "");


/**
 * @param {any} config
 * @param {string} key
 * @param {typedefs.WpwLogger} [logger]
 * @throws {WpwError}
 */
const validateSchema = (config, key, logger) =>
{
    const log = logger || { write: () => {}, withColor: () => "", colors: { italic: [ 0, 0 ] } },
          schemaFile = getSchemaFile(key);
    log.write("validate schema `" + log.withColor(schemaFile, log.colors.italic) + "`", 1);
    try
    {
        const schema = getSchema(key);
        if (schema)
        {
            const enumKeys = WpwKeysEnum[key || "WpwSchema"],
                  baseConfig = enumKeys ? pick(config, ...enumKeys) : config;
            validate(schema, baseConfig, { name: key, baseDataPath: key });
            log.write("   schema validation successful", 1);
        }
        else {
            throw new Error("schema definitions does not exist");
        }
    }
    catch (e) {
        throw WpwError.get(`schema validation failed for ${schemaFile}: ${e.message}`);
    }
};


module.exports = { applySchemaDefaults, getSchemaVersion, validateSchema, SchemaDirectory };
