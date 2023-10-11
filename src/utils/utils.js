/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file utils/utils.js
 * @version 0.0.1
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const { glob } = require("glob");
const WpwRegex = require("./regex");
const { existsSync, readFileSync } = require("fs");
const { promisify } = require("util");
const { access } = require("fs/promises");
const typedefs = require("../types/typedefs");
const exec = promisify(require("child_process").exec);
const { resolve, isAbsolute, relative, sep, join } = require("path");
const { asArray, capitalize, isDirectory, apply, lowerCaseFirstChar, pushUniq, pickNot } = require("@spmeesseman/type-utils");

const globOptions = {
    dot: true,
    ignore: [ "**/node_modules/**", "**/.vscode*/**", "**/build/**", "**/dist/**", "**/res*/**", "**/doc*/**" ]
};


/**
 * Executes node.eXec() wrapped in a promise via util.promisify()
 * @async
 * @param {typedefs.ExecAsyncOptions} options
 * @returns {Promise<typedefs.ExecAsyncResult>}
 */
const execAsync = async (options) =>
{
    let exitCode = null;
    const logPad = options.logPad || "",
          logger = options.logger,
          /** @type {string[]} */stdout = [],
          /** @type {string[]} */stderr = [],
          /** @type {string[]} */errors = [],
          ignores = asArray(options.ignoreOut),
          program = options.program || options.command.split(" ")[0],
          execIo = options.stdin ? { stdio: [ "pipe", "pipe", "pipe" ] } : {},
          execOptions = { encoding: "utf8", ...options.execOptions, ...execIo, timeout: 30000 };

    const _handleOutput = (out, stdarr) =>
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
                if (options.stdin && (/prompt|enter|input/).test(stdarr[stdarr.length - 1]))
                {
                    if (logger) {
                        logger.write(stdarr.pop());
                    } 
                    else { console.log(stdarr.pop()); }
                }
            }
        });
    };

    const _writeOutput = (/** @type {string} */ name, /** @type {any[]} */ out) =>
    {
        if (out.length > 0)
        {
            const hdr = logger?.withColor(`${program} ${name}:`, exitCode !== 0 ? logger.colors.red : logger.colors.yellow) || "";
            out.forEach((m) =>
            {
                const msgHasError = WpwRegex.MessageContainsError.test(m);
                if (logger && (options.stdout || msgHasError)) {
                    if (msgHasError || !options.raw) {
                        logger.write(`${hdr} ${logger.withColor(m, logger.colors.grey)}`, 1, logPad);
                    }
                    else {
                        logger.write(m, 1, logPad);
                    }
                }
                if (msgHasError) {
                    pushUniq(errors, m);
                }
            });
        }
    };

    if (logger)
    {
        logger.write("execute asynchronous shell command", 1, logPad);
        logger.value("   command", options.command, 2, logPad);
        logger.object("   wpw options", pickNot(options, "command"), 2, logPad);
        logger.object("   exec options", execOptions, 3, logPad);
    }

    let isOptsStdIn = options.stdin;
    const procPromise = exec(options.command, execOptions),
          child = procPromise.child,
          childStdIn = child.stdin;

    child.stdout?.on("data", (data) => _handleOutput(data, stdout));
    child.stderr?.on("data", (data) => _handleOutput(data, stderr));

    if (isOptsStdIn && childStdIn)
    {
        process.stdin.once("data", (data) =>
        {
            childStdIn.cork();
            childStdIn.write(data + "\n", () =>{ process.stdin.unref(); isOptsStdIn = false; });
            childStdIn.uncork();
            childStdIn.end();
        });
    }

    child.on("close", (code) =>
    {
        exitCode = code;
        if (isOptsStdIn) {
            process.stdin.unref();
            isOptsStdIn = false;
        }
        if (logger)
        {
            const clrCode = logger.withColor(code || code === 0 ? code.toString() : "null", code === 0 ? logger.colors.green :
                            (code === null ? logger.colors.yellow : logger.colors.red));
            logger.write(`${program} returned exit code bold(${clrCode})`, 1, logPad);
            if (options.stdin) {
                logger.write(`${program} returned stdout bold(${stdout.join("")})`, 1, logPad);
            }
        }
        _writeOutput("stdout", stdout);
        _writeOutput("stderr", stderr);
    });

    try {
        await procPromise;
    } catch{}

    return { code: exitCode, errors, stdout: stdout.join("") };
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
 * @param {typedefs.GlobOptions} [options]
 * @param {boolean} [allowDirs]
 * @returns {Promise<string[]>}
 */
const findFiles = async (pattern, options, allowDirs) =>
    (await glob(pattern, apply({}, options, globOptions))).map(f => f.toString()).filter(f => allowDirs || !isDirectory(f));


/**
 * @param {string} pattern
 * @param {typedefs.GlobOptions} [options]
 * @param {boolean} [allowDirs]
 * @returns {string[]}
 */
const findFilesSync = (pattern, options, allowDirs) =>
    glob.sync(pattern, apply({}, options, globOptions)).map(f => f.toString()).filter(f => allowDirs || !isDirectory(f));


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
 * Get a random integer betwen min and max, inclusive
 *
 * @param {number} [max] The maximum number to return
 * @param {number} [min] The minimum number to return
 * @returns {number}
 */
const randomNumber = (max, min) =>
{
    const rnd = Math.random();
    if (!max && max !== 0) {
        max = 100000;
    }
    if (!min) {
        min = 0;
    }
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(rnd * (max - min + 1) + min);
};


/**
 * @template {typedefs.WpwGetRelPathOptions | undefined} O
 * @template {O extends { stat: true } ? string | undefined : string} R
 * @param {string} baseDir base directory
 * @param {string} p configured path (relative or absolute)
 * @param {O} [o]
 * @returns {R} a relative path
 */
const relativePath = (baseDir, p, o) =>
{
    let /** @type {string | undefined } */path = p;
    const opts = apply({}, o);
    if (path)
    {
        if (baseDir)
        {
            if (isAbsolute(path))
            {
                if (opts.stat && !existsSync(path)) {
                    path = undefined;
                }
                path = relative(baseDir, p);
            }
            else {
                if (opts.stat && !existsSync(resolve(baseDir, path))) {
                    path = undefined;
                }
            }
        }
        if (path)
        {
            if (opts.psx) {
                path = path.replace(/\\/g, "/");
            }
            if (opts.dot) {
                path = `.${opts.psx ? "/" : sep}${path.replace(/^\.[\\\/]/, "")}`;
            }
        }
    }
    return /** @type {R} */(path);
};


// * @returns {import("../../package.json").dependencies[T]}
/**
 * @param {string} id
 * @returns {any}
 */
const requireResolve = (id) => require(require.resolve(id, { paths: [ require.main?.path || process.cwd() ] }));
// const requireResolve = (id) => __non_webpack_require__(require.resolve(id, { paths: [ require.main?.path || process.cwd() ] }));


/**
 * @template {typedefs.WpwGetAbsPathOptions | undefined} O
 * @template {O extends { stat: true } ? string | undefined : string} R
 * @param {string} baseDir base directory
 * @param {string | undefined} p configured path (relative or absolute)
 * @param {O} [o]
 * @returns {R} an absolute path
 */
const resolvePath = (baseDir, p, o) =>
{
    let /** @type {string | undefined } */path = p;
    const opts = apply({}, o);
    if (path)
    {
        if (baseDir && !isAbsolute(path)) {
            path = resolve(baseDir, path);
        }
        if (opts.stat && !existsSync(path)) {
            path = undefined;
        }
        if (path && opts.psx) {
            path = path.replace(/\\/g, "/");
        }
    }
    return /** @type {R} */(path);
};

/**
 * @param {number} ms
 * @returns {Promise<void>} Promise<void>
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));


const wpwVersion = () => JSON.parse(readFileSync(resolve(__dirname, "../../package.json"), "utf8")).version;


module.exports = {
    asArray, capitalize, execAsync, existsAsync, findFiles, findFilesSync, findFileUp,
    getExcludes, lowerCaseFirstChar, randomNumber, requireResolve, relativePath, resolvePath,
    findExPath, findExPathSync, forwardSlash, sleep, wpwVersion
};
