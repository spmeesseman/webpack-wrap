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
const { isString, isError } = require("@spmeesseman/type-utils");
const WpwRegex = require("./regex");


/**
 * @type {typedefs.IWpwMessage}
 */
const WpwMessage =
{
    WPW025: "build skipped (non-fatal)",
    WPW075: "typescript build should enable the 'tscheck' build option, or set ts-loader 'transpileOnly' to false",
    WPW450: "did not modify sourcemaps - global data 'runtimeVars' not set, ensure appropriate build options are enabled",
    WPW500: "invalid configuration",
    WPW501: "invalid exports configuration",
    WPW502: "invalid plugins configuration",
    WPW605: "build failed - output directory does not exist",
    WPW630: "type definitions build failed",
    WPW660: "type definitions build failed",
    WPW661: "type definitions build failed - output directory does not exist",
    WPW662: "type definitions build failed - invalid build method",
    WPW700: "an error has occurred",
    WPW899: "an unknown error has occurred"
};

/**
 * @enum {typedefs.WpwMessageCode}
 */
const WpwMessageEnum =
{
    ERROR_ABSTRACT_FUNCTION: /** @type {typedefs.WpwErrorCode} */("WPW630"),
    ERROR_GENERAL: /** @type {typedefs.WpwErrorCode} */("WPW700"),
    ERROR_NO_OUTPUT_DIR: /** @type {typedefs.WpwErrorCode} */("WPW605"),
    ERROR_TYPES_FAILED: /** @type {typedefs.WpwErrorCode} */("WPW660"),
    ERROR_TYPES_FAILED_NO_OUTPUT_DIR: /** @type {typedefs.WpwErrorCode} */("WPW661"),
    ERROR_TYPES_FAILED_INVALID_METHOD: /** @type {typedefs.WpwErrorCode} */("WPW662"),
    ERROR_UNKNOWN: /** @type {typedefs.WpwErrorCode} */("WPW899"),
    INFO_BUILD_SKIPPED_NON_FATAL: /** @type {typedefs.WpwInfoCode} */("WPW025"),
    INFO_SHOULD_ENABLE_TSCHECK: /** @type {typedefs.WpwInfoCode} */("WPW075"),
    WARNING_CONFIG_INVALID: /** @type {typedefs.WpwWarningCode} */("WPW500"),
    WARNING_CONFIG_INVALID_EXPORTS: /** @type {typedefs.WpwWarningCode} */("WPW501"),
    WARNING_CONFIG_INVALID_PLUGINS: /** @type {typedefs.WpwWarningCode} */("WPW502"),
    WARNING_SOURCEMAPS_RUNTIMEVARS_NOT_SET: /** @type {typedefs.WpwWarningCode} */("WPW450")
};


class WpBuildError extends WebpackError
{
    /**
     * @param {string} message
     * @param {string | Error} [details]
     */
    constructor(message, details)
    {
        super(message);
        const isErrorDetail = isError(details);
		this.name = "WpBuildError";
        // Object.setPrototypeOf(this, new.target.prototype);
        if (isErrorDetail) {
            this.details = details.message;
        }
        else if (isString(details)) {
            this.details = details;
        }
        WpBuildError.captureStackTrace(this, this.constructor);
        if (this.stack)
        {
            const lines = this.stack?.split("\n") || [],
                  line = parseInt((lines[3].match(WpwRegex.StackTraceCurrentLine) || [])[1]),
                  column = (lines[3].match(WpwRegex.StackTraceCurrentColumn) || [])[1],
                  method = (lines[3].match(WpwRegex.StackTraceCurrentMethod) || [])[1],
                  fileAbs = (lines[3].match(WpwRegex.StackTraceCurrentFileAbs) || [])[1];
            this.file = this.file || (lines[3].match(WpwRegex.StackTraceCurrentFile) || [])[1];
            this.details = (this.details ? this.details + "\n" : "") + cleanUp(this.stack, this.message);
            this.loc = {
                end: { line: line + 1, column },
                start: {line, column: 0 },
                name: `${method} (${fileAbs}:${line}:${column})`
            };
        }
        if (isErrorDetail && details.stack) {
            this.details = (this.details ? this.details + "\n" : "") + details.stack.trim();
        }
    }


    /**
     * @param {string} message
     * @param {Partial<typedefs.WpwWebpackConfig> | undefined | null} [wpc]
     * @param {Error | string | undefined | null} [detail]
     * @returns {WpBuildError}
     */
    static get(message, wpc, detail)
    {
        if (wpc) {
            if (wpc.mode) {
                message += ` | mode:[${wpc.mode}]`;
            }
            if (wpc.target) {
                message += ` | target:[${wpc.target}]`;
            }
        }
        if (isString(detail)) {
            message += ` | ${detail}`;
        }
        else if (isError(detail)) {
            message += `\nEXCEPTION: ${detail.message.trim()}`;
        }
        const e = new WpBuildError(message, detail ?? undefined);
        return e;
    }


    /**
     * @param {string} property
     * @param {Partial<typedefs.WpwWebpackConfig> | undefined | null} [wpc]
     * @param {string | undefined | null} [detail]
     * @returns {WpBuildError}
     */
    static getErrorMissing = (property, wpc, detail) =>
        this.get(`Could not locate wpw resource '${property}'`, wpc, detail);


    /**
     * @param {string} property
     * @param {Partial<typedefs.WpwWebpackConfig> | undefined | null} [wpc]
     * @param {string | undefined | null} [detail]
     * @returns {WpBuildError}
     */
    static getErrorProperty = (property, wpc, detail) =>
        this.get(`Invalid wpw configuration @ property '${property}'`, wpc, detail);


    /**
     * @param {string} fnName
     * @param {Partial<typedefs.WpwWebpackConfig> | undefined | null} [wpc]
     * @param {string | undefined | null} [detail]
     * @returns {WpBuildError}
     */
    static getAbstractFunction = (fnName, wpc, detail) =>
        this.get(`abstract method '${fnName}' must be overridden`, wpc, detail);

}


module.exports = {
     WpwMessage, WpwMessageEnum, WpBuildError
};
