/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file utils/message.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const WpwRegex = require("./regex");
const typedefs = require("../types/typedefs");
const inspect = require("util").inspect.custom;
const { cleanUp } = require("webpack/lib/ErrorHelpers");
const makeSerializable = require("webpack/lib//util/makeSerializable");
const { isString, isError, isObject } = require("@spmeesseman/type-utils");


/**
 * @type {typedefs.IWpwMessage}
 */
const WpwMessage =
{   //
    // INFO (000 - 099)
    //
    WPW000: "general info issued",
    WPW025: "build skipped (non-fatal)",
    WPW075: "auto-enabled build option",
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
    WPW610: "general schema error",
    WPW611: "schema validation error",
    WPW615: "typescript module error",
    WPW605: "build failed - output directory does not exist",
    WPW630: "abstract function must be overridden",
    WPW660: "types build: general failure",
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
    WPW895: "error due to unknown programmer writing crap code",
    WPW898: "the current process flow has not yet been implemented",
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
    INFO_AUTO_ENABLED_OPTION: /** @type {typedefs.WpwInfoCode} */("WPW075"),
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
    WARNING_OPTIONS_INVALID: /** @type {typedefs.WpwWarningCode} */("WPW450"),
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
    ERROR_SCHEMA: /** @type {typedefs.WpwErrorCode} */("WPW610"),
    ERROR_SCHEMA_VALIDATION: /** @type {typedefs.WpwErrorCode} */("WPW611"),
    ERROR_TYPESCRIPT: /** @type {typedefs.WpwErrorCode} */("WPW615"),
    ERROR_ABSTRACT_FUNCTION: /** @type {typedefs.WpwErrorCode} */("WPW630"),
    ERROR_NO_OUTPUT_DIR: /** @type {typedefs.WpwErrorCode} */("WPW605"),
    ERROR_TYPES_FAILED: /** @type {typedefs.WpwErrorCode} */("WPW660"),
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
    ERROR_NOT_IMPLEMENTED: /** @type {typedefs.WpwErrorCode} */("WPW898"),
    ERROR_UNKNOWN: /** @type {typedefs.WpwErrorCode} */("WPW899")
};


/**
 * @extends {Error}
 */
class WpwError extends Error
{
    static Msg = WpwMessageEnum;

    /** @type {string | undefined} */
    details;
    /** @type {typedefs.WebpackModule | undefined | null} */
    module;
    /** @type {typedefs.WebpackDependencyLocation | undefined} */
    loc;
    /** @type {boolean | undefined} */
    hideStack;
    /** @type {typedefs.WebpackChunk | undefined} */
    chunk;
    /** @type {string | undefined} */
    file;

    /**
     * @param {typedefs.WpwMessageInfo} info
     */
    constructor(info)
    {
        super(info.message);
        const err = info.error,
              hasErrorDetail = isError(err);
		this.name = "WpwError";
        // Object.setPrototypeOf(this, new.target.prototype);
        if (hasErrorDetail) {
            this.details = err.message;
        }
        if (isString(info.detail)) {
            this.details = info.detail;
        }
        else if (isObject(info.detail)) {
            this.details = JSON.stringify(info.detail);
        }
        if (info.code.length === 6 && WpwMessage[info.code])
        {
            this.details = `[${this.details}]: ${WpwMessage[info.code]}`;
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
        if (hasErrorDetail && err.stack) {
            this.details = (this.details ? this.details + "\n" : "") + err.stack.trim();
        }
    }

	[inspect]() {
		return this.stack + (this.details ? `\n${this.details}` : "");
	}

	/**
	 * @param {typedefs.WebpackObjectSerializerContext} context
	 */
	serialize({ write }) {
		write(this.name);
		write(this.message);
		write(this.stack);
		write(this.details);
		write(this.loc);
		write(this.hideStack);
	}

	/**
	 * @param {typedefs.WebpackObjectDeserializerContext} context
	 */
	deserialize({ read }) {
		this.name = read();
		this.message = read();
		this.stack = read();
		this.details = read();
		this.loc = read();
		this.hideStack = read();
	}

    /**
     * @param {typedefs.WpwMessageInfo} info
     * @returns {WpwError}
     */
    static get(info) {return new WpwError(info); }


    /**
     * @param {string} property
     * @param {Partial<typedefs.WpwWebpackConfig> | undefined | null} [wpc]
     * @param {string | Record<string, any> | undefined | null} [detail]
     * @returns {WpwError}
     */
    static getErrorMissing = (property, wpc, detail) =>
        this.get({ code: this.Msg.ERROR_RESOURCE_MISSING, wpc, message: `[${property}] ` + (detail || "") });


    /**
     * @param {string} property
     * @param {Partial<typedefs.WpwWebpackConfig> | Record<string, any> | undefined | null} [wpc]
     * @param {string | undefined | null} [detail]
     * @returns {WpwError}
     */
    static getErrorProperty = (property, wpc, detail) =>
        this.get({ code: this.Msg.ERROR_CONFIG_PROPERTY, wpc, message: `[${property}] ` + (detail || "") });


    /**
     * @param {string} fnName
     * @param {Partial<typedefs.WpwWebpackConfig> | Record<string, any> | undefined | null} [wpc]
     * @param {string | Record<string, any> | undefined | null} [detail]
     * @returns {WpwError}
     */
    static getAbstractFunction = (fnName, wpc, detail) =>
        this.get({ code: this.Msg.ERROR_ABSTRACT_FUNCTION, wpc, message: `[${fnName}] ` + (detail || "") });

}


makeSerializable(WpwError, "src/utils/WpwError");

module.exports = WpwError;
