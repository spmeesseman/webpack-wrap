#!/usr/bin/env node
// @ts-check

/**
 * @file utils/environment.js
 * @version 0.0.1
 * @author Scott Meesseman @spmeesseman
 */


const { resolve } = require("path");
const WpwLogger = require("../src/utils/log");
const { readFile, writeFile, mkdir } = require("fs/promises");


//
// Run from script directtory so we work regardless of where cwd is set
//

/** @type {WpwLogger | undefined} */
let logger;

//
// Command line runtime wrapper
//
const cliWrap = (/** @type {(arg0: string[]) => Promise<any> } */ exe) =>
                (/** @type {string[]} */ argv) => {
                    exe(argv).catch(e => { try { (logger || console).error(e); } catch {} process.exit(1); });
                };


cliWrap(async(argv) =>
{
    if (!(argv.includes("--quiet") || argv.includes("-q"))) {
        const name = "script: generate examples";
        logger = new WpwLogger({ name, envTag1: "wpwrap", envTag2: "examples" });
    }

    let exampleRootDir = resolve(__dirname, "../examples");
    const outputDirIdx = argv.findIndex(a => a === "--output");
    if (outputDirIdx !== -1) {
        exampleRootDir = resolve(__dirname, `../${argv[outputDirIdx + 1]}`);
    }
    else {
        exampleRootDir = resolve(__dirname, "../examples");
    }

    const exampleDirs = [
        resolve(exampleRootDir, "jsdoc"),
        resolve(exampleRootDir, "plugin"),
        resolve(exampleRootDir, "webpack"),
        resolve(exampleRootDir, "wpwrc")
    ];

    //
    // CREATE ALL OUTPUT DIRS IF NOT ALREADY EXIST
    //
    try { await mkdir(exampleRootDir, { recursive: true }); } catch {}
    for (const d of exampleDirs) {
        try { await mkdir(d, { recursive: true }); } catch {}
    }

    //
    // WEBPACK.CONFIG.JS
    //
    const webpackConfigInput = resolve(__dirname, "../webpack.config.js");
    const webpackConfigOutput = resolve(exampleRootDir, "webpack/webpack.config.js");
    logger?.log("Create webpack.config file");
    let content = await readFile(webpackConfigInput, "utf8");
    content = content.replace("./src/core/wrapper", "node_modules/@spmeesseman/webpack-wrap/dist/webpack-wrap/core/wrapper")
                     .replace("./src/types/typedefs", "node_modules/@spmeesseman/webpack-wrap/dist/types")
                     .replace(/\* NOTE:[^]*?\*\//, "*/");
    await writeFile(webpackConfigOutput, content);

    //
    // WPWRC
    //
    const wpwrcWpwInput = resolve(__dirname, "../.wpwrc.json");
    const wpwrcWpwOutput = resolve(exampleRootDir, "wpwrc/.wpwrc.basic.json");
    logger?.log("Create wpwrc basic config file");
    content = await readFile(wpwrcWpwInput, "utf8");
    content = content.replace(/wpwrap|wp-wrap/g, "exapp")
                     .replace(/Webpack(-| )Wrap/g, (_, m) => `Example${m}App`)
                     .replace(/Webpack Wrap/g, "Example App");
    await writeFile(wpwrcWpwOutput, content);

    //
    // VSCODE WPWRC
    //
    const vscodeTeInput = resolve(__dirname, "../../../vscode-taskexplorer/.wpwrc.json");
    const vscodeTeOutput = resolve(exampleRootDir, "wpwrc/.wpwrc.vscode.json");
    logger?.log("Create vscode wpwrc config file");
    content = await readFile(vscodeTeInput, "utf8");
    content = content.replace(/taskexplorer/g, "examplevsc")
                     .replace(/Task Explorer/g, "Example VsCode Extension");
    await writeFile(vscodeTeOutput, content);

    //
    // JSDOC
    //
    const jsdocWpwInput = resolve(__dirname, "../.jsdoc.json");
    const jsdocWpwOutput = resolve(exampleRootDir, "jsdoc/.jsdoc.wpwrc.json");
    logger?.log("Create jsdoc basic config file");
    content = await readFile(jsdocWpwInput, "utf8");
    content = content.replace(/",\s+docdash": [^]*?\n {4}\},?\r?\n/g, "")
                     .replace(/",\s+theme_opts": [^]*?\n {8}\},?\r?\n/g, "");
    await writeFile(jsdocWpwOutput, content);

    //
    // JSDOC w/ CLEAN_THEME
    //
    logger?.log("Create jsdoc config file w/ clean-theme config");
    content = await readFile(jsdocWpwInput, "utf8");
    content = content.replace(/",\s+docdash": [^]*?\n {4}\},?\r?\n/g, "");
    await writeFile(jsdocWpwOutput, content);

    //
    // JSDOC w/ DOCDASH
    //
    logger?.log("Create jsdoc config file w/ docdash config");
    content = await readFile(jsdocWpwInput, "utf8");
    content = content.replace(/",\s+theme_opts": [^]*?\n {8}\},?\r?\n/g, "");
    await writeFile(jsdocWpwOutput, content);

    //
    // PLUGIN
    //
    const wpwPluginTemplateInput = resolve(__dirname, "../schema/template/plugin.js");
    const wpwPluginTemplateOutput = resolve(exampleRootDir, "plugin/template.basic.js");
    logger?.log("Create plugin basic template file");
    content = await readFile(wpwPluginTemplateInput, "utf8");
    content = content.replace(/\/\/ @ts-check/g, "@ts-check");
    await writeFile(wpwPluginTemplateOutput, content);

    //
    // DONE
    //
    if (logger) {
        logger.blank(undefined, logger.icons.color.success);
        logger.success("successfully created all examples files", undefined, "", true);
        logger.blank(undefined, logger.icons.color.success);
        logger.dispose();
    }
})(process.argv.slice(2));
