// @ts-check

/**
 * @file utils/global.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 */

const { resolve, join } = require("path");
const { existsSync, readFileSync, mkdirSync, writeFileSync } = require("fs");


/** @typedef {import("../types").WpBuildGlobalEnvironment} WpBuildGlobalEnvironment */


const cacheDir = resolve(__dirname, "..", "..", "node_modules", ".cache", "wpbuild");
if (!existsSync(cacheDir)) { mkdirSync(cacheDir, { recursive: true }); }

const globalCacheFilePath = join(cacheDir, "global.json");
if (!existsSync(globalCacheFilePath)) { writeFileSync(globalCacheFilePath, "{}"); }


/** @type {WpBuildGlobalEnvironment} */
const globalEnv = {
    buildCount: 0,
    cache: JSON.parse(readFileSync(globalCacheFilePath, "utf8")),
    cacheDir,
    verbose: false
};


module.exports = globalEnv;
