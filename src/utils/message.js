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
const { WebpackError } = require("webpack");
const typedefs = require("../types/typedefs");
const inspect = require("util").inspect.custom;
const { cleanUp } = require("webpack/lib/ErrorHelpers");
const makeSerializable = require("webpack/lib//util/makeSerializable");
const { isString, isError, isObject, asArray, pick, applyIf } = require("@spmeesseman/type-utils");


/**
 * @private
 * @param {string} msg
 * @param {number} color
 * @returns {string}
 */
const colorOutput = (msg, color) => "\x1B[" + color + "m" + msg + "\x1B[90m";


/**
 * @protected
 * @param {typedefs.WpwMessageInfo} info
 * @returns {string}
 */
const getMessage = (info) =>
{
    if (info.code.length === 6 && WpwMessageMap[info.code])
    {
        let code = `[${info.code}]`;
        if (isErrorCode(info.code))
        {
            code = colorOutput("[", 31) + info.code + colorOutput("]", 31);
        }
        else if (isWarningCode(info.code))
        {
            code = colorOutput("[", 33) + info.code + colorOutput("]", 33);
        }
        else if (isInfoCode(info.code))
        {
            code = colorOutput("[", 37) + info.code + colorOutput("]", 37);
        }
        return `${code}: ${getMessageTag(info.code)}\n${WpwMessageMap[info.code]}\n${info.message}`;
    }
    return info.message;
};


/**
 * @private
 * @param {typedefs.WpwMessageCode} code
 * @returns {string}
 */
const getMessageTag = (code) =>
{
    for (const [ k, v ] of Object.entries(WpwMessageCode)) { if (v === code) { return k; } }
    return "ERROR_UNKNOWN";
};


/**
 * @param {typedefs.WpwMessageCode} code
 * @returns {boolean}
 */
const isErrorCode = (code) => (/WPW[6-8][0-9][0-9]/).test(code);


/**
 * @param {typedefs.WpwMessageCode} code
 * @returns {boolean}
 */
const isInfoCode = (code) => (/WPW[0-2][0-9][0-9]/).test(code);


/**
 * @param {typedefs.WpwMessageCode} code
 * @returns {boolean}
 */
const isWarningCode = (code) => (/WPW[3-5][0-9][0-9]/).test(code);


/**
 * @type {typedefs.IWpwMessageMap}
 */
const WpwMessageMap =
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
    WPW350: "circular dependency detected",
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
    // GENERAL ERRORS (600 - 609)
    //
    WPW600: "an error has occurred",
    WPW605: "output directory does not exist",
    //
    // SCHEMA ERRORS (610 - 619)
    //
    WPW610: "general schema error",
    WPW611: "schema validation error",
    WPW615: "typescript module error",
    //
    // CLASS ERRORS (620 - 629)
    //
    WPW620: "abstract function must be overridden",
    //
    // EXPORTS ERRORS (630 - 649)
    //
    WPW630: "exports error",
    WPW649: "loader error",
    //
    // PLUGINS ERRORS (650 - 679)
    //
    WPW650: "plugin error",
    WPW660: "jsdoc plugin error",
    WPW670: "types plugin error",
    //
    // RESERVED ERRORS (680 - 699)
    //
    // ERROR_ ..........................................
    //
    // CONFIGURATION ERRORS (700 - 719)
    //
    WPW700: "could not locate resource",
    WPW710: "invalid configuration",
    WPW711: "invalid configuration property",
    WPW712: "invalid exports configuration",
    WPW713: "invalid plugins configuration",
    //
    // RESERVED ERRORS (720 - 799)
    //
    // ERROR_ ..........................................
    //
    // IMPLEMENTATION ERRORS (890 - 894)
    //
    WPW890: "error due to unknown programmer writing crap code",
    WPW891: "the current process flow has not yet been implemented",
    //
    // UNKNOWN ERRORS (895 - 899)
    //
    WPW895: "an unknown error has occurred"
};


/**
 * @enum {typedefs.WpwMessageCode}
 */
const WpwMessageCode =
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
    WARNING_CIRCULAR: /** @type {typedefs.WpwWarningCode} */("WPW350"),
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
    // GENERAL ERRORS (600 - 609)
    //
    ERROR_GENERAL: /** @type {typedefs.WpwErrorCode} */("WPW600"),
    ERROR_NO_OUTPUT_DIR: /** @type {typedefs.WpwErrorCode} */("WPW605"),
    //
    // SCHEMA ERRORS (610 - 619)
    //
    ERROR_SCHEMA: /** @type {typedefs.WpwErrorCode} */("WPW610"),
    ERROR_SCHEMA_VALIDATION: /** @type {typedefs.WpwErrorCode} */("WPW611"),
    ERROR_TYPESCRIPT: /** @type {typedefs.WpwErrorCode} */("WPW615"),
    //
    // CLASS ERRORS (620 - 629)
    //
    ERROR_ABSTRACT_FUNCTION: /** @type {typedefs.WpwErrorCode} */("WPW620"),
    //
    // EXPORTS ERROR (630 - 649)
    //
    ERROR_EXPORT_FAILED: /** @type {typedefs.WpwErrorCode} */("WPW630"),
    ERROR_LOADER: /** @type {typedefs.WpwErrorCode} */("WPW649"),
    //
    // PLUGINS ERROR (650 - 679)
    //
    ERROR_PLUGIN_FAILED: /** @type {typedefs.WpwErrorCode} */("WPW650"),
    ERROR_JSDOC_FAILED: /** @type {typedefs.WpwErrorCode} */("WPW660"),
    ERROR_TYPES_FAILED: /** @type {typedefs.WpwErrorCode} */("WPW670"),
    //
    // RESERVED ERRORS (680 - 699)
    //
    // ERROR_ ..........................................
    //
    // CONFIGURATION ERRORS (700 - 719)
    //
    ERROR_RESOURCE_MISSING: /** @type {typedefs.WpwErrorCode} */("WPW700"),
    ERROR_CONFIG_INVALID: /** @type {typedefs.WpwErrorCode} */("WPW710"),
    ERROR_CONFIG_PROPERTY: /** @type {typedefs.WpwErrorCode} */("WPW711"),
    ERROR_CONFIG_INVALID_EXPORTS: /** @type {typedefs.WpwErrorCode} */("WPW712"),
    ERROR_CONFIG_INVALID_PLUGINS: /** @type {typedefs.WpwErrorCode} */("WPW713"),
    //
    // RESERVED ERRORS (720 - 799)
    //
    // ERROR_ ..........................................
    //
    // IMPLEMENTATION ERRORS (890 - 894)
    //
    ERROR_SHITTY_PROGRAMMER: /** @type {typedefs.WpwErrorCode} */("WPW890"),
    ERROR_NOT_IMPLEMENTED: /** @type {typedefs.WpwErrorCode} */("WPW891"),
    //
    // UNKNOWN ERRORS (895 - 899)
    //
    ERROR_UNKNOWN: /** @type {typedefs.WpwErrorCode} */("WPW895")
};


/**
 * @extends {WebpackError}
 */
class WpwMessage extends WebpackError
{
    /**
     * @readonly
     */
    static Code = WpwMessageCode;

    /**
     * @type {typedefs.WpwMessageCode}
     */
    code;
    /**
     * @type {typedefs.WpwMessageType}
     */
    type;
    /**
     * @override
     * @type {typedefs.WebpackDependencyLocation | undefined}
     */
	loc;


    /**
     * @param {typedefs.WpwMessageInfo} info
     */
    constructor(info)
    {
        super(getMessage(info));
        this.code = info.code;
		this.name = "WpwMessage";
        this.type = isErrorCode(info.code) ? "error" : isWarningCode(info.code) ? "warning": "info";
        // Object.setPrototypeOf(this, new.target.prototype);
        WpwError.captureStackTrace(this, info.capture || this.constructor);
        this.setDetails(info);
    }


	[inspect]() { return this.stack + (this.details ? `\n${this.details}` : ""); }


	/**
	 * @param {typedefs.WebpackObjectDeserializerContext} context
	 */
	deserialize({ read })
    {
		this.name = read(); this.type = read(); this.code = read(); this.message = read();
        this.stack = read(); this.details = read(); this.loc = read(); this.hideStack = read();
	}


    /**
     * @param {typedefs.WpwMessageInfo} info
     * @returns {WpwError}
     */
    static get(info) {return new WpwMessage(applyIf(info, { capture: this.get })); }


	/**
	 * @param {typedefs.WebpackObjectSerializerContext} context
	 */
	serialize({ write })
    {
		write(this.name); write(this.type); write(this.code); write(this.message);
		write(this.stack); write(this.details); write(this.loc); write(this.hideStack);
	}


    /**
     * @private
     * @param {typedefs.WpwMessageInfo} info
     */
    setDetails(info)
    {
        let details = "";
        const err = info.error,
              hasErrorDetail = isError(err),
              isInfo = isInfoCode(info.code);

        if (isString(info.detail)) {
            details += `\n${info.detail}`;
        }
        if (isObject(info.detailObject, true)) {
            details += `\n${JSON.stringify(info.detailObject)}`;
        }
        if (hasErrorDetail && !isInfo) {
            details += `\n${err.message}`;
        }

        if (info.build)
        {
            details += "\nbuild properties:";
            Object.entries(pick(info.build, "name", "type")).forEach(([ k, v ]) =>
            {
                details += `\n   ${k} = ${v}`;
            });
        }

        if (info.suggest)
        {
            let ct = 0;
            details += "\n";
            details += colorOutput("suggesstions:", 36);
            asArray(info.suggest).forEach((s) => { details += `\n   ${colorOutput(`(${++ct})`, 37)} ${s}`; });
        }

        this.details = details ? details.trim() : undefined;

        this.setFileProperties(isInfo);

        if (hasErrorDetail && err.stack && !isInfo) { // only set stacktrace into details if this is an 'info' type WpwMessage
            this.details = (this.details ? this.details + "\n" : "") + "extended call stack:\n" + err.stack.trim();
        }
    }


    /**
     * @private
     * @param {boolean} isInfo
     */
    setFileProperties(isInfo)
    {
        if (this.stack)
        {
            const lines = this.stack.split("\n") || [],
                  line = parseInt((lines[3].match(WpwRegex.StackTraceCurrentLine) || [ "", "1" ])[1]),
                  column = parseInt((lines[3].match(WpwRegex.StackTraceCurrentColumn) || [ "", "0" ])[1]),
                  method = (lines[3].match(WpwRegex.StackTraceCurrentMethod) || [ "", "" ])[1],
                  fileAbs = (lines[3].match(WpwRegex.StackTraceCurrentFileAbs) || [ "", "" ])[1];

            let stack = this.stack.replace(`${this.name}: `, "");
            this.message.split("\n").forEach((m) => { stack = cleanUp(stack, m); });

            this.loc = { end: { line: line + 1, column: 0 }, start: {line, column }, name: method };
            this.file = (lines[3].match(WpwRegex.StackTraceCurrentFile) || [ "", "" ])[1] + ` (${fileAbs}:${line}:${column})`;

            if (!isInfo) { // only set stacktrace into details if this is an 'info' type WpwMessage
                this.details = (this.details ? this.details + "\n" : "") + "call stack:\n" + stack.trim();
            }
        }
    }

}


/**
 * @extends {WpwMessage}
 */
class WpwError extends WpwMessage
{
    /**
     * @param {typedefs.WpwMessageInfo} info
     */
    constructor(info) { super(info); this.name = "WpwError"; }
}


/**
 * @extends {WpwError}
 */
class WpwAbstractFunctionError extends WpwError
{
    /**
     * @param {string} fnName
     * @param {any} [capture]
     * @param {Partial<typedefs.WpwWebpackConfig> | Record<string, any> | undefined | null} [wpc]
     * @param {string | Record<string, any> | undefined | null} [detail]
     */
    constructor(fnName, capture, wpc, detail)
    {
        super({ code: WpwMessageCode.ERROR_ABSTRACT_FUNCTION, wpc, message: `[${fnName}] ` + (detail || ""), capture });
		this.name = "WpwAbstractFunctionError";
    }
}


makeSerializable(WpwMessage, "src/utils/WpwMessage");
makeSerializable(WpwError, "src/utils/WpwError");
makeSerializable(WpwAbstractFunctionError, "src/utils/WpwAbstractFunctionError");


// exports.default = WpwMessage;
module.exports = WpwMessage;
module.exports.WpwError = WpwError;
module.exports.WpwAbstractFunctionError = WpwAbstractFunctionError;
