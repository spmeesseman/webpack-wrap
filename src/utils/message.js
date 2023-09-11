/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file utils/message.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const { WebpackError } = require("webpack");
const typedefs = require("../types/typedefs");
const { cleanUp } = require("webpack/lib/ErrorHelpers");
const { isString, isError, isObject } = require("@spmeesseman/type-utils");
const WpwRegex = require("./regex");


/**
 * @type {typedefs.IWpwMessage}
 */
const WpwMessage =
{   //
    // INFO (000 - 099)
    //
    WPW000: "general info issued",
    WPW025: "build skipped (non-fatal)",
    WPW075: "typescript build should enable the 'tscheck' build option, or set ts-loader 'transpileOnly' to false",
    WPW085: "enable the 'vendormod.all' or other vendormod options if issues occur",
    WPW086: "enable the 'vendormod.all' or 'vendormod.nyc' option if using nyc",
    //
    // INFO (100- 199)
    //
    WPW100: "unknown state",
    //
    // WARNINGS (300-499)
    //
    WPW300: "general warning issued",
    //
    // WARNINGS (400-499)
    //
    WPW450: "did not modify sourcemaps - global data 'runtimeVars' not set, ensure appropriate build options are enabled",
    //
    // WARNINGS (500-599)
    //
    WPW530: "invalid configuration",
    WPW531: "invalid exports configuration",
    WPW532: "invalid plugins configuration",
    //
    // ERRORS (600 - 699)
    //
    WPW600: "an error has occurred",
    WPW605: "build failed - output directory does not exist",
    WPW630: "abstract function must be overridden",
    WPW660: "types build: general failure",
    WPW661: "types build: output directory does not exist",
    WPW662: "types build: invalid build method",
    WPW670: "types build: failed to create bundle",
    //
    // ERRORS (700 - 799)
    //
    WPW700: "could not locate resource",
    WPW710: "invalid configuration",
    WPW711: "invalid configuration property",
    WPW712: "invalid exports configuration",
    WPW713: "invalid plugins configuration",
    //
    // ERRORS (800 - 899)
    //
    WPW895: "an error has occurred due to the programmer writing bad code",
    WPW899: "an unknown error has occurred"
};

/**
 * @enum {typedefs.WpwMessageCode}
 */
const WpwMessageEnum =
{   //
    // INFO (000 - 099)
    //
    INFO_BUILD_SKIPPED_NON_FATAL: /** @type {typedefs.WpwInfoCode} */("WPW025"),
    INFO_SHOULD_ENABLE_TSCHECK: /** @type {typedefs.WpwInfoCode} */("WPW075"),
    INFO_SHOULD_ENABLE_VENDORMOD: /** @type {typedefs.WpwInfoCode} */("WPW085"),
    INFO_SHOULD_ENABLE_VENDORMOD_NYC: /** @type {typedefs.WpwInfoCode} */("WPW086"),
    //
    // INFO (100 - 199)
    //
    INFO_UNKNOWN_PROPERTY: /** @type {typedefs.WpwInfoCode} */("WPW100"),
    //
    // WARNINGS (300 - 399)
    //
    WARNING_GENERAL: /** @type {typedefs.WpwWarningCode} */("WPW300"),
    //
    // WARNINGS (400 - 499)
    //
    WARNING_SOURCEMAPS_RUNTIMEVARS_NOT_SET: /** @type {typedefs.WpwWarningCode} */("WPW450"),
    //
    // WARNING (500 - 599)
    //
    WARNING_CONFIG_INVALID: /** @type {typedefs.WpwWarningCode} */("WPW530"),
    WARNING_CONFIG_INVALID_EXPORTS: /** @type {typedefs.WpwWarningCode} */("WPW531"),
    WARNING_CONFIG_INVALID_PLUGINS: /** @type {typedefs.WpwWarningCode} */("WPW532"),
    //
    // ERROR (600 - 699)
    //
    ERROR_GENERAL: /** @type {typedefs.WpwErrorCode} */("WPW600"),
    ERROR_ABSTRACT_FUNCTION: /** @type {typedefs.WpwErrorCode} */("WPW630"),
    ERROR_NO_OUTPUT_DIR: /** @type {typedefs.WpwErrorCode} */("WPW605"),
    ERROR_TYPES_FAILED: /** @type {typedefs.WpwErrorCode} */("WPW660"),
    ERROR_TYPES_FAILED_NO_OUTPUT_DIR: /** @type {typedefs.WpwErrorCode} */("WPW661"),
    ERROR_TYPES_FAILED_INVALID_METHOD: /** @type {typedefs.WpwErrorCode} */("WPW662"),
    ERROR_TYPES_FAILED_BUNDLE: /** @type {typedefs.WpwErrorCode} */("WPW670"),
    //
    // ERROR (700 - 799)
    //
    ERROR_RESOURCE_MISSING: /** @type {typedefs.WpwErrorCode} */("WPW700"),
    ERROR_CONFIG_INVALID: /** @type {typedefs.WpwErrorCode} */("WPW710"),
    ERROR_CONFIG_PROPERTY: /** @type {typedefs.WpwErrorCode} */("WPW711"),
    ERROR_CONFIG_INVALID_EXPORTS: /** @type {typedefs.WpwErrorCode} */("WPW712"),
    ERROR_CONFIG_INVALID_PLUGINS: /** @type {typedefs.WpwErrorCode} */("WPW713"),
    //
    // ERROR (800 - 899)
    //
    ERROR_SHITTY_PROGRAMMER: /** @type {typedefs.WpwErrorCode} */("WPW895"),
    ERROR_UNKNOWN: /** @type {typedefs.WpwErrorCode} */("WPW899")
};


/**
 * @implements {typedefs.IWpwError}
 */
class WpwError extends WebpackError
{
    static Msg = WpwMessageEnum;

    /**
     * @param {string | WpwMessageEnum} message
     * @param {string | Error | Record<string, any>} [details]
     */
    constructor(message, details)
    {
        super(message);
        const isErrorDetail = isError(details);
		this.name = "WpwError";
        // Object.setPrototypeOf(this, new.target.prototype);
        if (isErrorDetail) {
            this.details = details.message;
        }
        else if (isString(details)) {
            this.details = details;
        }
        else if (isObject(details)) {
            this.details = JSON.stringify(details);
        }
        if (message.length === 6 && WpwMessage[message])
        {
            message = `[${message}]: ${WpwMessage[message]}`;
        }
        WpwError.captureStackTrace(this, this.constructor);
        if (this.stack)
        {
            const lines = this.stack?.split("\n") || [],
                  line = parseInt((lines[3].match(WpwRegex.StackTraceCurrentLine) || [ "", "" ])[1]),
                  column = (lines[3].match(WpwRegex.StackTraceCurrentColumn) || [ "", "" ])[1],
                  method = (lines[3].match(WpwRegex.StackTraceCurrentMethod) || [ "", "" ])[1],
                  fileAbs = (lines[3].match(WpwRegex.StackTraceCurrentFileAbs) || [ "", "" ])[1];
            this.file = (lines[3].match(WpwRegex.StackTraceCurrentFile) || [ "", "" ])[1] + ` (${fileAbs}:${line}:${column})`;
            this.details = (this.details ? this.details + "\n" : "") + cleanUp(this.stack, this.message);
            this.loc = {
                end: { line: line + 1, column: 0 },
                start: {line, column },
                name: method
            };
        }
        if (isErrorDetail && details.stack) {
            this.details = (this.details ? this.details + "\n" : "") + details.stack.trim();
        }
    }


    /**
     * @param {string | WpwMessageEnum} message
     * @param {Partial<typedefs.WpwWebpackConfig> | Record<string, any> | undefined | null} [wpc]
     * @param {Error | Record<string, any> | string | undefined | null} [detail]
     * @returns {WpwError}
     */
    static get(message, wpc, detail)
    {
        if (message.length === 6 && WpwMessage[message])
        {
            message = `[${message}]: ${WpwMessage[message]}`;
        }
        if (wpc)
        {
            if (wpc.mode) {
                message += ` [mode:${wpc.mode}]`;
            }
            if (wpc.target) {
                message += ` [tgt:${wpc.target}]`;
            }
        }
        if (isString(detail)) {
            message += ` | ${detail}`;
        }
        else if (isError(detail)) {
            message += `\nexception: ${detail.message.trim()}`;
        }
        return new WpwError(message, detail ?? undefined);
    }


    /**
     * @param {string} property
     * @param {Partial<typedefs.WpwWebpackConfig> | undefined | null} [wpc]
     * @param {string | Record<string, any> | undefined | null} [detail]
     * @returns {WpwError}
     */
    static getErrorMissing = (property, wpc, detail) =>
        this.get(this.Msg.ERROR_RESOURCE_MISSING, wpc, `[${property}] ` + (detail || ""));


    /**
     * @param {string} property
     * @param {Partial<typedefs.WpwWebpackConfig> | Record<string, any> | undefined | null} [wpc]
     * @param {string | undefined | null} [detail]
     * @returns {WpwError}
     */
    static getErrorProperty = (property, wpc, detail) =>
        this.get(this.Msg.ERROR_CONFIG_PROPERTY, wpc, `[${property}] ` + (detail || ""));


    /**
     * @param {string} fnName
     * @param {Partial<typedefs.WpwWebpackConfig> | Record<string, any> | undefined | null} [wpc]
     * @param {string | Record<string, any> | undefined | null} [detail]
     * @returns {WpwError}
     */
    static getAbstractFunction = (fnName, wpc, detail) =>
        this.get(this.Msg.ERROR_ABSTRACT_FUNCTION, wpc, `[${fnName}] ` + (detail || ""));

}


module.exports = WpwError;
