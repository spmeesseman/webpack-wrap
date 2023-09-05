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
const { isString } = require("@spmeesseman/type-utils");


/**
 * @type {(keyof typedefs.WpwMessageType)[]}
 */
const WpwMessageProps = [ "WPW650", "WPW899", "WPW050" ];

/**
 * @param {any} v Variable to check type on
 * @returns {v is (keyof typedefs.WpwMessageType)}
 */
const isWpwMessageProp = (v) => !!v && WpwMessageProps.includes(v);

// /**
//  * @type {{ [ key in typedefs.WpwMessageKey ]: typedefs.WpwMessage }}
//  */
let WpwMessage2;
((WpwMessage2) => {
    WpwMessage2.WPW650 = "failed to modify sourcemaps - global data 'runtimeVars' not set, ensure appropriate build options are enabled";
    WpwMessage2.WPW899 = "an unknown error has occurred";
    WpwMessage2.WPW050 = "typescript build should enable the 'tscheck' build option, or set ts-loader 'transpileOnly' to false";
// @ts-ignore
})(WpwMessage2 = module.exports.WpwMessage2 || (module.exports.WpwMessage2 = {}));

/**
 * @type {typedefs.IWpwMessage}
 */
const WpwMessage =
{
    WPW450: "did not modify sourcemaps - global data 'runtimeVars' not set, ensure appropriate build options are enabled",
    WPW605: "build failed - output directory does not exist",
    WPW660: "type definitions build failed",
    WPW661: "type definitions build failed - output directory does not exist",
    WPW899: "an unknown error has occurred",
    WPW050: "typescript build should enable the 'tscheck' build option, or set ts-loader 'transpileOnly' to false"
};

/**
 * @enum {typedefs.WpwMessageCode}
 */
const WpwMessageEnum =
{
    FAILED_NO_OUTPUT_DIR: /** @type {typedefs.WpwErrorCode} */("WPW605"),
    SHOULD_ENABLE_TSCHECK: /** @type {typedefs.WpwInfoCode} */("WPW050"),
    SOURCEMAPS_RUNTIMEVARS_NOT_SET: /** @type {typedefs.WpwWarningCode} */("WPW450"),
    TYPES_FAILED: /** @type {typedefs.WpwErrorCode} */("WPW660"),
    TYPES_FAILED_NO_OUTPUT_DIR: /** @type {typedefs.WpwErrorCode} */("WPW661"),
    UNKNOWN_ERROR: /** @type {typedefs.WpwErrorCode} */("WPW899")
};


class WpBuildError extends WebpackError
{
    /**
     * @param {string} message
     * @param {string} file
     * @param {string} [details]
     * @param {boolean} [capture]
     */
    constructor(message, file, details, capture)
    {
        super(message);
        this.file = file;
        this.details = details;
        // this.loc = file;
		this.name = "WpBuildError";
        // Object.setPrototypeOf(this, new.target.prototype);
        if (capture !== false) {
            WpBuildError.captureStackTrace(this, this.constructor);
        }
        if (!this.details && this.stack) {
		    this.details = cleanUp(this.stack, this.message);
        }
    }


    /**
     * @param {string} message
     * @param {string} file
     * @param {Partial<typedefs.WpwWebpackConfig> | undefined | null} [wpc]
     * @param {string | undefined | null} [detail]
     * @returns {WpBuildError}
     */
    static get(message, file, wpc, detail)
    {
        if (wpc) {
            if (wpc.mode) {
                message += ` | mode:[${wpc.mode}]`;
            }
            if (wpc.target) {
                message += ` | target:[${wpc.target}]`;
            }
        }
        message += ` | [${file}]`;
        if (isString(detail)) {
            message += ` | ${detail}`;
        }
        const e =new WpBuildError(message, file, detail ?? undefined, false);
        WpBuildError.captureStackTrace(e, this.get);
        return e;
    }


    /**
     * @param {string} property
     * @param {string} file
     * @param {Partial<typedefs.WpwWebpackConfig> | undefined | null} [wpc]
     * @param {string | undefined | null} [detail]
     * @returns {WpBuildError}
     */
    static getErrorMissing = (property, file, wpc, detail) =>
        this.get(`Could not locate wpw resource '${property}'`, file, wpc, detail);


    /**
     * @param {string} property
     * @param {string} file
     * @param {Partial<typedefs.WpwWebpackConfig> | undefined | null} [wpc]
     * @param {string | undefined | null} [detail]
     * @returns {WpBuildError}
     */
    static getErrorProperty = (property, file, wpc, detail) =>
        this.get(`Invalid wpw configuration @ property '${property}'`, file, wpc, detail);


    /**
     * @param {string} fnName
     * @param {string} file
     * @param {Partial<typedefs.WpwWebpackConfig> | undefined | null} [wpc]
     * @param {string | undefined | null} [detail]
     * @returns {WpBuildError}
     */
    static getAbstractFunction = (fnName, file, wpc, detail) =>
        this.get(`abstract method '${fnName}' must be overridden`, file, wpc, detail);

}


module.exports = {
     WpwMessage, WpwMessageEnum, WpwMessageProps, isWpwMessageProp, WpBuildError
};
