// @ts-check

/**
 * @file exports/index.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */


const cache = require("./cache");
const devtool = require("./devtool");
const entry = require("./entry");
const experiments = require("./experiments");
const externals = require("./externals");
const ignorewarnings = require("./ignorewarnings");
const minification = require("./minification");
const optimization = require("./optimization");
const plugins = require("./plugins");
const output = require("./output");
const resolve = require("./resolve");
const rules = require("./rules");
const stats = require("./stats");
const watch = require("./watch");

module.exports = {
    cache,
    devtool,
	entry,
    experiments,
    externals,
    ignorewarnings,
    minification,
    optimization,
    plugins,
    output,
    resolve,
    rules,
    stats,
    watch
};
