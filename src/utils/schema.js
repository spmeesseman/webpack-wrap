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
const { WpwKeysEnum, requiredProperties } = require("../types/constants");
const { isDefined, isString, isObject, isArray, pick, isNulled, isObjectEmpty, clone } = require("@spmeesseman/type-utils");

const schemas = {};
const SchemaDirectory = resolve(__dirname, "..", "..", "schema");

const runtimeExclude = [
    "WpwSourceJavascriptOptions", "WpwSourceTypescriptOptions", "WpwVsCode"
];



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
 * @template {{}} T
 * @param {T | Partial<T>} config
 * @param {NonNullable<typedefs.JsonSchema>} schemaObj
 * @param {typedefs.JsonSchemaDefinition} definitions
 * @returns {T | Partial<T>}
 * @throws {WpwError}
 */
const _applySchemaDefaults = (config, schemaObj, definitions) =>
{
    const propertiesObject = getDefinitionSchemaProperties(schemaObj, definitions);
    for (const [ key, definition ] of Object.entries(propertiesObject))
    {
        let def = definition;
        if (isObject(propertiesObject.enabled) && !propertiesObject.enabled.default)
        {
            continue;
        }
        if (isObject(def) && isNulled(config[key]))
        {
            const baseRef = def;
            if (def.$ref)
            {
                def = getDefinitionSchema(def, definitions);
            }
            if (def.readOnly || (key === "enabled" && !def.default))
            {
                continue;
            }
            if (isDefined(def.default))
            {
                config[key] = clone(def.default); // apply(config, { [key]: def.default });
            }
            else
            {
                if (def.type === "array")
                {
                    if ((isArray(schemaObj.required) && schemaObj.required.includes(key))) {
                        config[key] = [];
                    }
                }
                else if ((!def.type || def.type === "object") && def.properties && def.maxProperties !== 0)
                {
                    const req = requiredProperties,
                          sId = schemaObj.title || getDefinitionName(schemaObj),
                          sCfg = _applySchemaDefaults({}, def, definitions),
                          oName = getDefinitionName(schemaObj);
                    if (sId === "WpwSchema" || !isObjectEmpty(sCfg) || req.find(([ p, c ]) => p === key && c === oName))
                    {
                        if (!runtimeExclude.includes(getDefinitionName(baseRef))) {
                            config[key] = sCfg;
                        }
                    }
                }
            }
        }
    }
    return config;
};


/**
 * @template {Record<string, any>} T
 * @param {T | Partial<T>} config
 * @param {typedefs.WpwJsonSchemaKey} schemaKey
 * @param {...string} propertyKeys
 * @returns {Required<T>}
 * @throws {WpwError}
 */
const applySchemaDefaults = (config, schemaKey, ...propertyKeys) =>
{
    const schema = getSchema("WpwSchema"),
          definitions = /** @type {Exclude<typedefs.JsonSchemaDefinition, undefined>} */(schema.definitions),
          baseDefinition = definitions[/** @type {string} */(schemaKey)];
    let schemaObj = schemaKey !== "WpwSchema" ? getDefinitionSchema(baseDefinition, definitions) : schema;
    propertyKeys.forEach((key) =>
    {
        if (schemaObj) {
            schemaObj = getDefinitionSchemaProperties(schemaObj, definitions);
            schemaObj = getDefinitionSchema(schemaObj[key], definitions);
        }
        else {
            throw new WpwError({
                code: WpwError.Code.ERROR_CONFIG_PROPERTY,
                message: "schema error - could not locate specified schema key"
            });
        }
    });
    _applySchemaDefaults(config, schemaObj, definitions);
    return /** @type {Required<T>} */(config);
};


const getDefinitionName = (/** @type {typedefs.JsonSchema} */ obj) => (obj.title || obj.$id || obj.$ref)?.replace(/#\/(?:definitions\/)?/, "") || "";


/**
 * @template {"WpwSchema" | string | undefined} T
 * @template {T extends "WpwSchema" | undefined ? typedefs.JsonSchema : typedefs.JsonSchema | undefined} R
 * @param {T} [key]
 * @returns {R}
 * @throws {WpwError}
 */
const getSchema = (key) =>
{
    const sKey = `${key || "WpwSchema"}`;
    if (!schemas[sKey])
    {
        try {
            schemas[sKey] = JSON5.parse(readFileSync(getSchemaFile(sKey), "utf8"));
            // const schema = {
            //    $ref: key ? `https://app1.spmeesseman.com/res/app/webpack-wrap/v0.0.1/schema/spm.schema.wpw.json#/${key}` :
            //                "https://app1.spmeesseman.com/res/app/webpack-wrap/v0.0.1/schema/spm.schema.wpw.json"
            // };
            // const ajv = new Ajv({loadSchema: loadSchema})
            // ajv.compileAsync(schema).then(function (validate) {
            // const valid = validate(data)
            // // ...
            // })
            // const schema_user = require("./schema_user.json")
            // const validate = ajv.getSchema("https://example.com/user.json")
            // || ajv.compile(schema_user)
            // async function loadSchema(uri) {
            //     const res = await request.json(uri)
            //     if (res.statusCode >= 400) throw new Error("Loading error: " + res.statusCode)
            //     return res.body
            // }
        }
        catch (e) {
            throw WpwError.get({ code: WpwError.Code.ERROR_SCHEMA, message: "failed to read schema file", error: e });
        }
    }
    return /** @type {R} */(schemas[sKey]);
};


/**
 * @param {string} key
 * @returns {string}
 */
const getSchemaFile = (key) =>
    join(SchemaDirectory, `spm.schema.wpw.${key && key !== "WpwSchema" ? `${key.replace(/^Wpw/, "").toLowerCase()}.` : ""}json`);


/**
 * @param {boolean | typedefs.JsonSchema} schemaObj
 * @param {typedefs.JsonSchemaDefinition} definitions
 * @returns {NonNullable<typedefs.JsonSchema>}
 * @throws {WpwError}
 */
const getDefinitionSchema = (schemaObj, definitions) =>
{
    /** @type {NonNullable<typedefs.JsonSchema>} */
    let property = { type: "object", properties: { enabled: { const: true }}};
    if (isObject(schemaObj))
    {
        property = schemaObj;
        while (isObject(property) && isString(property.$ref))
        {
            const refProperty = definitions[refName(property.$ref)];
            if (isObject(refProperty)) {
                property = refProperty;
            }
            else {
                throw WpwError.get({ code: WpwError.Code.ERROR_SCHEMA, message: "failed to read schema definitions" });
            }
        }
    }
    return property;
};


/**
 * @param {boolean | typedefs.JsonSchema} schemaObj
 * @param {typedefs.JsonSchemaDefinition} definitions
 * @returns {Exclude<typedefs.JsonSchemaProperties, undefined>}
 */
const getDefinitionSchemaProperties = (schemaObj, definitions) =>
{
    const schema = getDefinitionSchema(schemaObj, definitions);
    if (schema.properties) {
        return schema.properties;
    }
    return { enabled: { const: false }};
};


/**
 * @param {string | undefined} [key]
 * @returns {string | undefined} version string
 */
const getSchemaVersion = (key) => getSchema(key)?.$id.match(WpwRegex.PathVersion)?.[1] || "0.0.1";


/**
 * @param {string} ref
 * @returns {string} reference name with stripped path, e.g. #/definitions/WpwBuildConfig => WpwBuildConfig
 */
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
          code = WpwError.Code.ERROR_SCHEMA,
          schemaFile = getSchemaFile(key);
    log.write("validate schema `" + log.withColor(schemaFile, log.colors.italic) + "`", 1);
    try
    {
        const schema = getSchema(key);
        if (schema)
        {
            const enumKeys = WpwKeysEnum[key || "WpwSchema"],
                  baseConfig = enumKeys ? pick(config, ...enumKeys) : config;
            validate(schema, baseConfig);
            log.write("   schema validation successful", 1);
        }
        else {
            throw new WpwError({ code, message: `unable to load schema file ${schemaFile} [key=${key}]` });
        }
    }
    catch (e) {
        throw new WpwError({ code, message: `schema validation failed for ${schemaFile}: ${e.message}`, error: e });
    }
};


module.exports = { applySchemaDefaults, getSchemaVersion, validateSchema };
