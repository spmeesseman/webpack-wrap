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
const { isBoolean, isString, isObject, isObjectEmpty, isEmpty } = require("@spmeesseman/type-utils");


const schemas = {};
const SchemaDirectory = resolve(__dirname, "..", "..", "schema");


const getSchema = (/** @type {string | undefined} */ schemaKey) => schemas[`Wpw${schemaKey || ""}`] || {};


/**
 * @private
 * @param {boolean | typedefs.JsonSchema} schemaObj
 * @param {any} definitions
 * @returns {NonNullable<typedefs.JsonSchema>}
 */
const getDefinitionSchema = (schemaObj, definitions) =>
{
    /** @type {NonNullable<typedefs.JsonSchema>} */
    let property;
    const _refName = (/** @type {string} */ ref) => ref.replace("#/definitions/", ""),
          /** @type {typedefs.SchemaWithProperties} */
          emptySchemaObject = { type: "object", properties: { enabled: { const: true }}};

    if (!isBoolean(schemaObj))
    {
        property = schemaObj;
        while (isString(property.$ref))
        {
            const refProperty = definitions[_refName(property.$ref)];
            if (isBoolean(refProperty) || !isObject(refProperty, true)) {
                property = emptySchemaObject;
            }
            else {
                property = refProperty;
            }
        }
    }
    else {
        property = emptySchemaObject;
    }
    return property;
};


/**
 * @private
 * @param {boolean | typedefs.JsonSchema} schemaObj
 * @param {any} definitions
 * @returns {NonNullable<typedefs.JsonSchema>}
 */
const getDefinitionSchemaProperties = (schemaObj, definitions) =>
{
    const schema = getDefinitionSchema(schemaObj, definitions);
    if (schema.properties) {
        return schema.properties;
    }
    return { enabled: { const: false }};
};


const getSchemaVersion = (/** @type {string | undefined} */ schemaKey) =>
    schemas[`Wpw${schemaKey || ""}`].$id.match(WpwRegex.PathVersion)?.[1] || "0.0.1";


/**
 * @param {typedefs.WpwBuildOptions} options
 * @param {typedefs.WpwBuildOptions} initialOptions
 * @throws {WpwError}
 */
const validateBuildOptions = (options, initialOptions) =>
{
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
};


/**
 * @param {*} options
 * @param {any} logger
 * @param {string} [subschema]
 * @throws {WpwError}
 */
const validateSchema = (options, logger, subschema) =>
{
    const l = logger,
              schemaFile = `.wpbuildrc.schema.${subschema ? `${subschema}.` : ""}json`;
    l.write("validate schema `" + l.withColor(schemaFile, l.colors.italic) + "`", 1);
    try {
        const schemaKey = "Wpw" + (subschema ? `.${subschema}` : ""),
              /** @type {typedefs.JsonSchema} */
              schema = schemas[schemaKey] || JSON5.parse(readFileSync(join(SchemaDirectory, schemaFile), "utf8"));
        validate(schema, options, { name: schemaKey, baseDataPath: subschema });
        schemas[schemaKey] = schema;
        l.success("   schema validation successful", 1);
    }
    catch (e) {
        const err = WpwError.get(`schema validation failed for ${schemaFile}: ${e.message}`);
        l.error(err);
        throw err;
    }
};


module.exports = {
    getSchema, getDefinitionSchema, getDefinitionSchemaProperties, getSchemaVersion,
    validateBuildOptions, validateSchema, SchemaDirectory
};
