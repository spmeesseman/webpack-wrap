#!/usr/bin/env node
// @ts-check

/**
 * @file utils/environment.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */


const { resolve } = require("path");
const { execAsync, existsAsync } = require("../src/utils/utils");
const WpwLogger = require("../src/utils/console");
const { readFile, writeFile, mkdir } = require("fs/promises");


//
// Run from script directtory so we work regardless of where cwd is set
//

/** @type {WpwLogger} */
let logger;

const remotePath = resolve(__dirname, "..", "schema");

const exampleRootDir = resolve(__dirname, "../example");
const basicExampleDir = resolve(exampleRootDir, "rc/basic");
const vscodeExampleDir = resolve(exampleRootDir, "rc/vscode");

const basicExampleFile1 = resolve(__dirname, "../.wpwrc.json");
const vscodeExampleFile1 = resolve(__dirname, "../../../vscode-taskexplorer/.wpwrc.json");

//
// Command line runtime wrapper
//
const cliWrap = (/** @type {(arg0: string[]) => Promise<any> } */ exe) =>
                (/** @type {string[]} */ argv) => {
                    exe(argv).catch(e => { try { (logger || console).error(e); } catch {} process.exit(1); });
                };


cliWrap(async () =>
{
    if (!(await existsAsync(basicExampleFile1)) || !(await existsAsync(vscodeExampleFile1)))
    {
        throw new Error("One or more required template files do not exist");
    }

    logger = new WpwLogger({
        envTag1: "wpwrap", envTag2: "rctypes", colors: { default: "grey" }, level: 5, pad: { value: 100 }
    });
    logger.printBanner("generate-rc-types.js", "0.0.1", "generating rc configuration file type definitions");

    logger.log("Create standard example rc file");
    try {
        await mkdir(basicExampleDir, { recursive: true });
    } catch {}
    const basicExample1Content = await readFile(basicExampleFile1, "utf8");
    let content = basicExample1Content.replace(/webpack-wrap/g, "exampleapp")
                                      .replace(/Webpack-Wrap/g, "Example-App")
                                      .replace(/Webpack Wrap/g, "Example App");
    await writeFile(resolve(__dirname, "../example/rc/basic/.wpwrc.json"), content);

    logger.log("Create vscode example rc file");
    try {
        await mkdir(vscodeExampleDir, { recursive: true });
    } catch {}
    const vscodeExample1Content = await readFile(vscodeExampleFile1, "utf8");
    content = vscodeExample1Content.replace(/taskexplorer/g, "examplevscodeext")
                                   .replace(/Task Explorer/g, "Example VSCode Extension");
    await writeFile(resolve(__dirname, "../example/rc/vscode/.wpwrc.json"), content);

    logger.blank(undefined, logger.icons.color.success);
    logger.success("successfully uploaded rc schema", undefined, "", true);
    logger.blank(undefined, logger.icons.color.success);
})();
