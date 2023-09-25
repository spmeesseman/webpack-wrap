// @ts-check

/**
 * @file utils/global.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const { resolve, join } = require("path");
const typedefs = require("../types/typedefs");
const { existsSync, readFileSync, mkdirSync, writeFileSync } = require("fs");


const cacheDir = resolve(__dirname, "..", "..", "node_modules", ".cache", "wpwrap");
if (!existsSync(cacheDir)) { mkdirSync(cacheDir, { recursive: true }); }

const globalCacheFilePath = join(cacheDir, "global.json");
if (!existsSync(globalCacheFilePath)) { writeFileSync(globalCacheFilePath, "{}"); }


/**
 * @type {typedefs.IWpwGlobalEnvironment}
 */
const globalEnv = {
    buildCount: 0,
    cache: JSON.parse(readFileSync(globalCacheFilePath, "utf8")),
    cacheDir,
    verbose: false
};


module.exports = globalEnv;
