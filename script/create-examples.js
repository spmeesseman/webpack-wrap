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

const exampleRootDir = resolve(__dirname, "../example");
const exampleDirs = [
    resolve(exampleRootDir, "jsdoc"),
    resolve(exampleRootDir, "wpwrc")
];

const wpwrcWpwInput = resolve(__dirname, "../.wpwrc.json");
const wpwrcWpwOutput = resolve(__dirname, "../examples/wpwrc/.wpwrc.basic.json");

const vscodeTeInput = resolve(__dirname, "../../../vscode-taskexplorer/.wpwrc.json");
const vscodeTeOutput = resolve(__dirname, "../examples/wpwrc/vscode/.wpwrc.json");

const jsdocWpwInput = resolve(__dirname, "../.jsdoc.json");
const jsdocWpwOutput = resolve(__dirname, "../examples/jsdoc/.jsdoc.wpwrc.json");

//
// Command line runtime wrapper
//
const cliWrap = (/** @type {(arg0: string[]) => Promise<any> } */ exe) =>
                (/** @type {string[]} */ argv) => {
                    exe(argv).catch(e => { try { (logger || console).error(e); } catch {} process.exit(1); });
                };


cliWrap(async () =>
{
    logger = new WpwLogger({ envTag1: "wpwrap", envTag2: "examples" });
    logger.printBanner("create-examples.js", "0.0.1", "generating webpack-wrap example files");

    //
    // CREATE DIRS FOR NEW PROJECT CHECK-OUTS / CLONES
    //
    try { await mkdir(exampleRootDir, { recursive: true }); } catch {}
    for (const d of exampleDirs) {
        try { await mkdir(d, { recursive: true }); } catch {}
    }

    //
    // WPWRC
    //
    logger.log("Create basic wpwrc config file");
    let content = await readFile(wpwrcWpwInput, "utf8");
    content = content.replace(/wpwrap|wp-wrap/g, "exapp")
                     .replace(/Webpack(-| )Wrap/g, (_, m) => `Example${m}App`)
                     .replace(/Webpack Wrap/g, "Example App");
    await writeFile(wpwrcWpwOutput, content);

    //
    // VSCODE WPWRC
    //
    logger.log("Create vscode wpwrc config file");
    content = await readFile(vscodeTeInput, "utf8");
    content = content.replace(/taskexplorer/g, "examplevsc")
                     .replace(/Task Explorer/g, "Example VsCode Extension");
    await writeFile(vscodeTeOutput, content);

    //
    // JSDOC
    //
    logger.log("Create basic jsdoc config file");
    content = await readFile(jsdocWpwInput, "utf8");
    content = content.replace(/",\s+docdash": [^]*?\n {4}\},?\r?\n/g, "")
                     .replace(/",\s+theme_opts": [^]*?\n {8}\},?\r?\n/g, "");
    await writeFile(jsdocWpwOutput, content);

    //
    // JSDOC w/ CLEAN_THEME
    //
    logger.log("Create jsdoc config file w/ clean-theme config");
    content = await readFile(jsdocWpwInput, "utf8");
    content = content.replace(/",\s+docdash": [^]*?\n {4}\},?\r?\n/g, "");
    await writeFile(jsdocWpwOutput, content);

    //
    // JSDOC w/ DOCDASH
    //
    logger.log("Create jsdoc config file w/ docdash config");
    content = await readFile(jsdocWpwInput, "utf8");
    content = content.replace(/",\s+theme_opts": [^]*?\n {8}\},?\r?\n/g, "");
    await writeFile(jsdocWpwOutput, content);

    //
    // DONE
    //
    logger.blank(undefined, logger.icons.color.success);
    logger.success("successfully uploaded rc schema", undefined, "", true);
    logger.blank(undefined, logger.icons.color.success);
    logger.dispose();
})();
