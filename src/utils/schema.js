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
const { resolve, join } = require("path");
const { readFileSync } = require("fs");
const { validate } = require("schema-utils");
const { WpBuildError } = require("./utils");

/** @typedef {Parameters<validate>[0]} Schema*/

const schemas = {};
const SchemaDirectory = resolve(__dirname, "..", "..", "schema");


/**
 * @param {*} options
 * @param {any} logger
 * @param {string} [subschema]
 * @throws {WpBuildError}
 */
const validateSchema = (options, logger, subschema) =>
{
    const l = logger,
              schemaFile = `.wpbuildrc.schema.${subschema ? `${subschema}.` : ""}json`;
    l.write("validate schema `" + l.withColor(schemaFile, l.colors.italic) + "`", 1);
    try {
        const schemaKey = "Wpw" + (subschema ? `.${subschema}` : ""),
              /** @type {Schema} */
              schema = schemas[schemaKey] || JSON5.parse(readFileSync(join(SchemaDirectory, schemaFile), "utf8"));
        validate(schema, options, { name: schemaKey, baseDataPath: subschema });
        schemas[schemaKey] = schema;
        l.success("   schema validation successful", 1);
    }
    catch (e) {
        const err = WpBuildError.get(`schema validation failed for ${schemaFile}: ${e.message}`, "core/rc.js");
        l.error(err);
        throw err;
    }
};


const getSchema = (/** @type {string | undefined} */ schemaKey) => schemas[`Wpw${schemaKey || ""}`] || {};


const getSchemaVersion = (/** @type {string | undefined} */ schemaKey) =>
    schemas[`Wpw${schemaKey || ""}`].$id.match(WpwRegex.PathVersion)?.[1] || "0.0.1";


module.exports = {
    getSchema, getSchemaVersion, validateSchema, SchemaDirectory
};
