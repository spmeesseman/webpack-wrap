/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file utils/utils.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const { glob } = require("glob");
const { existsSync } = require("fs");
const { promisify } = require("util");
const { access } = require("fs/promises");
const typedefs = require("../types/typedefs");
const exec = promisify(require("child_process").exec);
const { resolve, isAbsolute, relative, sep, join } = require("path");
const { asArray, isArray, isDirectory, merge } = require("@spmeesseman/type-utils");

const globOptions = {
    ignore: [ "**/node_modules/**", "**/.vscode*/**", "**/build/**", "**/dist/**", "**/res*/**", "**/doc*/**" ]
};


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
 * Executes node.eXec() wrapped in a promise via util.promisify()
 * @async
 * @param {typedefs.ExecAsyncOptions} options
 * @returns {Promise<typedefs.ExecAsynResult>}
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
          stdout = [], stderr = [], errors = [],
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
                            `${logPad}${hdr} ${msg}`, lvl, "   ",
                            exitCode !== 0 ? logger.icons.color.error : logger.icons.color.warning
                        );
                        if ((/TS[0-9]{4}/).test(m)) {
                            errors.push(m);
                        }
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

    return { code: exitCode, errors };
};


/**
 * @param {string} path
 * @returns {Promise<boolean>}
 */
const existsAsync = async (path) =>
{
    if (!path) {
        return false;
    }
    try {
        await access(path);
        return true;
    }
    catch {
        return false;
    }
};


/**
 * @param {string} pattern
 * @param {import("glob").GlobOptions} options
 * @returns {Promise<string[]>}
 */
const findFiles = async (pattern, options) => (await glob(pattern, merge(globOptions, options))).map((f) => f.toString());


/**
 * @param {string} pattern
 * @param {import("glob").GlobOptions} [options]
 * @returns {string[]}
 */
const findFilesSync = (pattern, options) => glob.sync(pattern, merge(globOptions, options)).map((f) => f.toString());


/**
 * @param {string} dir
 * @param {string} fileName
 * @returns {string | undefined}
 */
const findFileUp = (dir, fileName) =>
{
    dir = resolve(dir);
    if (!existsSync(dir) || !isDirectory(dir)) {
        return undefined;
    }
    const dirs = dir.split(sep);
    for (let i = 0; i < dirs.length; i++)
    {
        const baseDir = i < dirs.length - 1 ? dirs.slice(0, dirs.length - i).join(sep) : sep;
        if (existsSync(join(baseDir, fileName)))
        {
            return join(baseDir, fileName);
        }
    }
};


/**
 * @param {string[]} paths
 * @param {string | undefined} [dir]
 * @returns {Promise<string | undefined>}
 */
const findExPath = async (paths, dir) =>
{
    const values = await Promise.all(
        paths.map(p => existsAsync(!dir ? resolve(p) : resolve(dir, p)))
    );
    const existsIdx = values.findIndex(b => b === true);
    if (existsIdx !== -1) {
        return paths[existsIdx];
    }
};


/**
 * @param {string[]} paths
 * @param {string | undefined} [dir]
 * @returns {string | undefined} the founded path or false
 */
const findExPathSync = (paths, dir) =>
{
    for (const p of paths) {
        if (existsSync(!dir ? resolve(p) : resolve(dir, p))) { return p; }
    }
};


const forwardSlash = (/** @type {string} */ path) => path.replace(/\\/g, "/");


/**
 * @param {typedefs.WpwBuild} build
 * @param {boolean} [allowTest]
 * @param {boolean} [allowTypes]
 * @param {boolean} [allowDts]
 * @param {boolean} [allowNodeModules]
 * @returns {RegExp[]}
 */
const getExcludes = (build, allowTest, allowTypes, allowDts, allowNodeModules) =>
{
    const ex = [ /\\.vscode[\\\/]/ ];
    if (allowNodeModules !== true) {
        ex.push(/node_modules/);
    }
    if (allowTest !== true) {
        ex.push(/test[\\\/]/);
    }
    if (allowTypes !== true) {
        ex.push(/types[\\\/]/);
    }
    if (allowDts !== true) {
        ex.push(/\.d\.ts$/);
    }
    return ex;
};


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


module.exports = {
    asArray, capitalize, execAsync, existsAsync, findFiles, findFilesSync, findFileUp, getExcludes,
    lowerCaseFirstChar, requireResolve, relativePath, resolvePath, findExPath, findExPathSync, forwardSlash
};
