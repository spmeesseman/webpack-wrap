/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file utils/utils.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 */

const { glob } = require("glob");
const { promisify } = require("util");
const { WebpackError } = require("webpack");
const typedefs = require("../types/typedefs");
const { existsSync, lstatSync } = require("fs");
const exec = promisify(require("child_process").exec);
const { resolve, isAbsolute, relative } = require("path");
const { access } = require("fs/promises");

const globOptions = {
    ignore: [ "**/node_modules/**", "**/.vscode*/**", "**/build/**", "**/dist/**", "**/res*/**", "**/doc*/**" ]
};


/**
 * @function
 * @template {{}} T
 * @template {{}} U extends T
 * @param {T | Partial<T> | undefined} object
 * @param {U | T | Partial<T> | undefined} config
 * @param {U | T | Partial<T> | undefined} [defaults]
 * @returns {T}
 */
const apply = (object, config, defaults) =>
{
    if (object === undefined) {
        object = {};
    }
    if (isObject(object))
    {
        if (isObject(defaults)) {
            apply(object, defaults);
        }
        if (isObject(config)) {
            Object.keys(config).forEach(i => { /** @type {{}} */(object)[i] = config[i]; });
        }
    }
    return /** @type {T} */(object);
};


/**
 * Copies all the properties of config to object if they don't already exist.
 *
 * @param {object} object The receiver of the properties
 * @param {object} config The source of the properties
 * @returns {object} returns obj
 */
 const applyIf = (object, config) =>
 {
    let property;
    if (object && config && typeof config === "object")
    {
        for (property in config) {
            if (object[property] === undefined) {
                object[property] = config[property];
            }
        }
    }
    return object;
};


/**
 * @function
 * @template T
 * @param {T | Set<T> | Array<T>} v Variable to check to see if it's an array
 * @param {boolean} [shallow] If `true`, and  `arr` is an array, return a shallow copy
 * @param {boolean} [allowEmpStr] If `false`, return empty array if isString(v) and isEmpty(v)
 * @returns {Array<NonNullable<T>>}
 */
const asArray = (v, shallow, allowEmpStr) => /** @type {Array} */(
    (v instanceof Set ? Array.from(v): (isArray(v) ? (shallow !== true ? v : v.slice()) : (!isEmpty(v, allowEmpStr) ? [ v ] : [])))
);


/**
 * @param {string} value
 * @returns {string}
 */
const capitalize = (value) =>
{
    if (value) {
        value = value.charAt(0).toUpperCase() + value.substring(1);
    }
    if (value === "Webapp") { value = "WebApp"; }
    else if (value === "Webmodule") { value = "WebModule"; }
    return value || "";
};


// /**
//  * @param {string} value
//  * @returns {string}
//  */
// const uncapitalize = (value) =>
// {
//     if (value) {
//         value = value.charAt(0).toLowerCase() + value.substr(1);
//     }
//     return value || '';
// };


// /**
//  * @param {string} value
//  * @param {number} length
//  * @param {string} word
//  * @returns {string}
//  */
// const ellipsis = (value, length, word) =>
// {
//     if (value && value.length > length)
//     {
//         if (word) {
//             const vs = value.substring(0, length - 2),
//                 index = Math.max(vs.lastIndexOf(' '), vs.lastIndexOf('.'), vs.lastIndexOf('!'), vs.lastIndexOf('?'));
//             if (index !== -1 && index >= (length - 15)) {
//                 return vs.substring(0, index) + "...";
//             }
//         }
//         return value.substring(0, length - 3) + "...";
//     }
//     return value;
// };


/**
 * @function
 * @template T
 * @param {any} item
 * @returns {T}
 */
const clone = (item) =>
{
    if (!item) {
        return item;
    }
    if (isDate(item)) {
        return /** @type {T} */(new Date(item.getTime()));
    }
    if (isArray(item))
    {
        let i = item.length;
        const c = [];
        while (i--) { c[i] = clone(item[i]); }
        return /** @type {T} */(c);
    }
    if (isObject(item))
    {
        const c = {};
        Object.keys((item)).forEach((key) =>
        {
            c[key] = clone(item[key]);
        });
        return /** @type {T} */(c);
    }
    return item;
};


/**
 * Executes node.eXec() wrapped in a promise via util.promisify()
 * @function
 * @async
 * @param {typedefs.ExecAsyncOptions} options
 * @returns {Promise<number | null>}
 */
const execAsync = async (options) =>
{
    let exitCode = null;
    const procPromise = exec(options.command, { encoding: "utf8", ...options.execOptions }),
          child = procPromise.child,
          ignores = asArray(options.ignoreOut),
          logPad = options.logPad || "",
          logger = options.logger,
          colors = logger?.colors,
          stdout = [], stderr = [],
          program = options.program || options.command.split(" ")[0];

    const _handleOutput = (out, stdarr) =>
    {
        if (options.stdout || !logger)
        {
            console.log(out);
        }
        else
        {
            const outs = out.split("\n");
            outs.filter(o => !!o).map(o => o.toString().trim()).forEach((o) =>
            {
                if (ignores.every(i => !o.toLowerCase().includes(i.toLowerCase())))
                {
                    if (o.startsWith(":") && stdarr.length > 0) {
                        stdarr[stdarr.length - 1] = stdarr[stdarr.length -1] + o;
                    }
                    else if (stdarr.length > 0 && stdarr[stdarr.length - 1].endsWith(":")) {
                        stdarr[stdarr.length - 1] = stdarr[stdarr.length -1] + " " + o;
                    }
                    else {
                        stdarr.push(o);
                    }
                }
            });
        }
    };

    child.stdout?.on("data", (data) => _handleOutput(data, stdout));
    child.stderr?.on("data", (data) => _handleOutput(data, stderr));

    child.on("close", (code) =>
    {
        exitCode = code;
        if (logger && colors)
        {
            const clrCode = logger.withColor(code?.toString(), code === 0 ? colors.green : colors.red);
            const _out = (/** @type {string} */ name, /** @type {any[]} */ out) =>
            {
                if (out.length > 0)
                {
                    const hdr = logger.withColor(`${program} ${name}:`, exitCode !== 0 ? colors.red : colors.yellow);
                    out.forEach((m) =>
                    {
                        const msg = logger.withColor(m, colors.grey),
                            lvl = m.length <= 256 ? 1 : (m.length <= 512 ? 2 : (m.length <= 1024 ? 3 : 5));
                        logger.log(
                            `${logPad}${hdr} ${msg}`, lvl, "",
                            exitCode !== 0 ? logger.icons.color.error : logger.icons.color.warning
                        );
                    });
                }
            };
            _out("stdout", stdout);
            _out("stderr", stderr);
            logger.log(`${logPad}${program} completed with exit code bold(${clrCode})`);
        }
    });

    try {
        await procPromise;
    } catch{}

    return exitCode;
};


/**
 * @param {string} path
 * @returns {Promise<boolean>}
 */
const existsAsync = async(path) =>
{
    try {
        await access(path);
        return true;
    }
    catch {
        return false;
    }
};


/**
 * @function
 * @param {string} pattern
 * @param {import("glob").GlobOptions} options
 * @returns {Promise<string[]>}
 */
const findFiles = async (pattern, options) => (await glob(pattern, merge(globOptions, options))).map((f) => f.toString());


/**
 * @function
 * @param {string} pattern
 * @param {import("glob").GlobOptions} [options]
 * @returns {string[]}
 */
const findFilesSync = (pattern, options) => glob.sync(pattern, merge(globOptions, options)).map((f) => f.toString());


/**
 * @param {typedefs.WpBuildApp} app
 * @param {typedefs.WpBuildAppJsTsConfig} [srcConfig]
 * @param {boolean} [allowTest]
 * @param {boolean} [allowTypes]
 * @param {boolean} [allowDts]
 * @returns {RegExp[]}
 */
const getExcludes = (app, srcConfig, allowTest, allowTypes, allowDts) =>
{
    const ex = [ /node_modules/, /\\.vscode[\\\/]/ ];
    if (allowTest !== true) {
        ex.push(/test[\\\/]/);
    }
    if (allowTypes !== true) {
        ex.push(/types[\\\/]/);
    }
    if (allowDts !== true) {
        ex.push(/\.d\.ts$/);
    }
    // ex.push(...rulesConfig.excludeAbs);
    return ex;
};


/**
 * @template T
 * @param {T} v Variable to check to see if it's an array
 * @param {boolean} [allowEmp] If `true`, return true if v is an empty array
 * @returns {v is T[]}
 */
const isArray = (v, allowEmp) => !!v && Array.isArray(v) && (allowEmp !== false || v.length > 0);


/**
 * @param {any} v Variable to check to see if it's a primitive boolean type
 * @returns {v is boolean}
 */
const isBoolean = (v) => (v === false || v === true) && typeof v === "boolean";


/**
 * @param {any} v Variable to check to see if it's a Date instance
 * @returns {v is Date}
 */
const isDate = (v) => !!v && Object.prototype.toString.call(v) === "[object Date]";


/**
 * @param {string} path
 * @returns {boolean}
 */
const isDirectory = (path) => existsSync(path) && lstatSync(path).isDirectory();


/**
 * @param {any} v Variable to check to see if it's an array
 * @param {boolean} [allowEmpStr] If `true`, return non-empty if isString(v) and v === ""
 * @returns {v is null | undefined | "" | []}
 */
const isEmpty = (v, allowEmpStr) => v === null || v === undefined || (!allowEmpStr ? v === "" : false) || (isArray(v) && v.length === 0) || (isObject(v) && isObjectEmpty(v));


/**
 * @param {any} v Variable to check to see if it's and empty object
 * @returns {boolean}
 */
const isFunction = (v) => !!v && typeof v === "function";


/**
 * @function
 * @param {string | undefined} path
 * @returns {boolean}
 */
const isJsTsConfigPath = (path) => !!path && isString(path, true) && /[\\\/](?:j|t)sconfig\.(?:[\w\-]+?\.)?json/.test(path);


/**
 * @template {{}} [T=Record<string, any>]
 * @param {T | undefined} v Variable to check to see if it's an array
 * @param {boolean} [allowArray] If `true`, return true if v is an array
 * @returns {v is T}
 */
const isObject = (v, allowArray) => !!v && Object.prototype.toString.call(v) === "[object Object]" && (v instanceof Object || typeof v === "object") && (allowArray || !isArray(v));


/**
 * @param {any} v Variable to check to see if it's and empty object
 * @returns {boolean}
 */
const isObjectEmpty = (v) => { if (isObject(v)) { return Object.keys(v).filter(k => ({}.hasOwnProperty.call(v, k))).length === 0; } return true; };


/**
 * @param {any} v Variable to check to see if it's a primitive type (i.e. boolean / number / string)
 * @returns {v is boolean | number | string}
 */
const isPrimitive = (v) => [ "boolean", "number", "string" ].includes(typeof v);


/**
 * @template T
 * @param {PromiseLike<T> | any} v Variable to check to see if it's a promise or thenable-type
 * @returns {v is PromiseLike<T>}
 */
const isPromise = (v) => !!v && (v instanceof Promise || (isObject(v) && isFunction(v.then)));


/**
 * @param {any} v Variable to check to see if it's an array
 * @param {boolean} [notEmpty] If `false`, return false if v is a string of 0-length
 * @returns {v is string}
 */
const isString = (v, notEmpty) => (!!v || (v === "" && !notEmpty)) && (v instanceof String || typeof v === "string");


/**
 * @param {string} s
 * @param {boolean} [removeSpaces]
 * @returns {string}
 */
const lowerCaseFirstChar = (s, removeSpaces) =>
{
    let fs = "";
    if (s)
    {
        fs = s[0].toString().toLowerCase();
        if (s.length > 1) {
            fs += s.substring(1);
        }
        if (removeSpaces) {
            fs = fs.replace(/ /g, "");
        }
    }
    return fs;
};


/**
 * @function
 * @template {{}} T
 * @template {{}} U extends T
 * @param {[ (T | Partial<T> | undefined), ...(U | T | Partial<T> | undefined)[]]} destination
 * @returns {T}
 */
const merge = (...destination) =>
{
    const ln = destination.length,
          base = destination[0] || {};
    for (let i = 1; i < ln; i++)
    {
        const object = destination[i] || {};
        Object.keys(object).filter(key => ({}.hasOwnProperty.call(object, key))).forEach((key) =>
        {
            const value = object[key];
            if (isObject(value))
            {
                const sourceKey = base[key];
                if (isObject(sourceKey))
                {
                    merge(sourceKey, value);
                }
                // else if (isArray(sourceKey) && isArray(value)) {
                //     base[key] = [ ...sourceKey, ...clone(value) ];
                // }
                else {
                    base[key] = clone(value);
                }
            }
            else {
                base[key] = value;
            }
        });
    }
    return /** @type {T} */(base);
};


/**
 * @function
 * @template {{}} [T=Record<string, any>]
 * @param {...(T | Partial<T> | undefined)} destination
 * @returns {T}
 */
const mergeIf = (...destination) =>
{
    const ln = destination.length,
          base = destination[0] || {};
    for (let i = 1; i < ln; i++)
    {
        const object = destination[i] || {};
        for (const key in object)
        {
            if (!(key in base))
            {
                const value = /** @type {Partial<T>} */(object[key]);
                if (isObject(value))
                {
                    base[key] = clone(value);
                }
                else {
                    base[key] = value;
                }
            }
        }
    }
    return /** @type {T} */(base);
};


/**
 * @function
 * @template {{}} [T=Record<string, any>]
 * @param {T} obj
 * @param {...string} keys
 * @returns {T}
 */
const pick = (obj, ...keys) =>
{
    const ret = {};
    keys.forEach(key => { if (obj[key]) ret[key] = obj[key]; });
    return /** @type {T} */(ret);
};


/**
 * @function
 * @template {Record<string, T>} T
 * @param {T} obj
 * @param {(arg: string) => boolean} pickFn
 * @returns {Partial<T>}
 */
const pickBy = (obj, pickFn) =>
{
    const ret = {};
    Object.keys(obj).filter(k => pickFn(k)).forEach(key => { if (obj[key])  ret[key] = obj[key]; });
    return ret;
};


/**
 * @function
 * @template {{}} T
 * @template {keyof T} K
 * @param {T} obj
 * @param {...K} keys
 * @returns {Omit<T, K>}
 */
const pickNot = (obj, ...keys) =>
{
    const ret = { ...obj };
    keys.forEach(key => { delete ret[key]; });
    return ret;
};


// /**
//  *
//  * @param {any} value
//  * @param {(value?: any) => void} resolve
//  * @returns
//  */
// const passthrough = (value, resolve) => resolve(value);

// /**
//  * Return a promise that resolves with the next emitted event, or with some future
//  * event as decided by an adapter.
//  *
//  * If specified, the adapter is a function that will be called with
//  * `(event, resolve, reject)`. It will be called once per event until it resolves or
//  * rejects.
//  *
//  * The default adapter is the passthrough function `(value, resolve) => resolve(value)`.
//  *
//  * @param {EventEmitter} e
//  * @param {any} adapter controls resolution of the returned promise
//  * @returns {{ promise: Promise<any>; cancel: EventEmitter}} a promise that resolves or rejects as specified by the adapter
//  */
// const promiseFromEvent = (e, adapter = passthrough) =>
// {
//     /** @type {EventEmitter} */
//     let subscription;
//     const cancel = new EventEmitter();
//     const _onEvent = (resolve, reject, value) =>
//     {
//         try {
//             Promise.resolve(adapter(value, resolve, reject)).catch(reject);
//         }
//         catch (error) { reject(error); }
//     };
//     const _reject = (reject, reason) => reject(reason);
//     return {
//         promise: new Promise((resolve, reject) =>
//         {
//             cancel.once("cancel", _ => reject("cancelled"));
//             subscription = e.once("done", (arg) => _onEvent(resolve, reject, arg));
//         })
//         .then((result) =>
//         {
//             subscription.off("done", _onEvent);
//             cancel.off("cancel", _reject);
//             return result;
//         },
//         error =>
//         {
//             subscription.off("done", _onEvent);
//             cancel.off("cancel", _reject);
//             throw error;
//         }),
//         cancel
//     };
// };


/**
 * @template T
 * @param {T[]} arr
 * @param {T} item
 * @returns {T[]}
 */
const pushIfNotExists = (arr, item) => { if (!arr.includes(item)) arr.push(item); return arr; };


/**
 * @param {string} b base directory
 * @param {string} p configured path (relative or absolute)
 * @returns {string} a relative path
 */
const relativePath = (b, p) => { if (isAbsolute(p)) { p = relative(b, p); } return p; };


// * @returns {import("../../package.json").dependencies[T]}
/**
 * @template {string} T
 * @param {T} id
 * @returns {any}
 */
const requireResolve = (id) => require(require.resolve(id, { paths: [ require.main?.path || process.cwd() ] }));


/**
 * @param {string} b base directory
 * @param {string | undefined} p configured path (relative or absolute)
 * @returns {string} an absolute path
 */
const resolvePath = (b, p) => { if (p && !isAbsolute(p)) { p = resolve(b, p); } return p || b; };


/**
 * @function
 * @template T
 * @param {T[]} a
 * @returns {T[]}
 */
const uniq = (a) => a.sort().filter((item, pos, arr) => !pos || item !== arr[pos - 1]);


class WpBuildError extends WebpackError
{
    /**
     * @class WpBuildError
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
        // Object.setPrototypeOf(this, new.target.prototype);
        if (capture !== false) {
            WpBuildError.captureStackTrace(this, this.constructor);
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
     * @param {Partial<typedefs.WpwWebpackConfig>  | undefined | null} [wpc]
     * @param {string | undefined | null} [detail]
     * @returns {WpBuildError}
     */
    static getErrorMissing = (property, file, wpc, detail) =>
        this.get(`Could not locate wp-wrap resource '${property}'`, file, wpc, detail);


    /**
     * @param {string} property
     * @param {string} file
     * @param {Partial<typedefs.WpwWebpackConfig>  | undefined | null} [wpc]
     * @param {string | undefined | null} [detail]
     * @returns {WpBuildError}
     */
    static getErrorProperty = (property, file, wpc, detail) =>
        this.get(`Invalid build configuration - property '${property}', file, wpc, shortDesc`, file, wpc, detail);

}


module.exports = {
    apply, applyIf, asArray, capitalize, clone, execAsync, existsAsync, findFiles, findFilesSync, getExcludes,
    isArray, isBoolean, isDirectory, isDate, isEmpty, isFunction, isJsTsConfigPath, isObject,
    isObjectEmpty, isPrimitive, isPromise, isString, lowerCaseFirstChar, merge, mergeIf, pick,
    pickBy, pickNot, pushIfNotExists, requireResolve, uniq, WpBuildError, relativePath, resolvePath
};
