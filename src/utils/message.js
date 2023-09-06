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
 * @type {(keyof typedefs.WpwMessageType)[]}
 */
const WpwMessageProps = [ "WPW650", "WPW899", "WPW050" ];

/**
 * @param {any} v Variable to check type on
 * @returns {v is (keyof typedefs.WpwMessageType)}
 */
const isWpwMessageProp = (v) => !!v && WpwMessageProps.includes(v);


/**
 * @type {typedefs.IWpwMessage}
 */
const WpwMessage =
{
    WPW025: "build skipped (non-fatal)",
    WPW075: "typescript build should enable the 'tscheck' build option, or set ts-loader 'transpileOnly' to false",
    WPW450: "did not modify sourcemaps - global data 'runtimeVars' not set, ensure appropriate build options are enabled",
    WPW605: "build failed - output directory does not exist",
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
    ERROR_GENERAL: /** @type {typedefs.WpwErrorCode} */("WPW700"),
    ERROR_NO_OUTPUT_DIR: /** @type {typedefs.WpwErrorCode} */("WPW605"),
    ERROR_TYPES_FAILED: /** @type {typedefs.WpwErrorCode} */("WPW660"),
    ERROR_TYPES_FAILED_NO_OUTPUT_DIR: /** @type {typedefs.WpwErrorCode} */("WPW661"),
    ERROR_TYPES_FAILED_INVALID_METHOD: /** @type {typedefs.WpwErrorCode} */("WPW662"),
    ERROR_UNKNOWN: /** @type {typedefs.WpwErrorCode} */("WPW899"),
    INFO_BUILD_SKIPPED_NON_FATAL: /** @type {typedefs.WpwInfoCode} */("WPW025"),
    INFO_SHOULD_ENABLE_TSCHECK: /** @type {typedefs.WpwInfoCode} */("WPW075"),
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
        // this.loc = file;
		this.name = "WpBuildError";
        // Object.setPrototypeOf(this, new.target.prototype);
        if (isError (details)) {
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
                  column = (lines[3].match(WpwRegex.StackTraceCurrentColumn) || [])[1];
            this.file = this.file || (lines[3].match(WpwRegex.StackTraceCurrentFile) || [])[1];
            this.loc = {
                end: { line, column },
                start: {line, column },
                name: (lines[3].match(WpwRegex.StackTraceCurrentMethod) || [])[1]
            };
            if (!this.details) {
		        this.details = cleanUp(this.stack, this.message);
            }
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
     WpwMessage, WpwMessageEnum, WpwMessageProps, isWpwMessageProp, WpBuildError
};
