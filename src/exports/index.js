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
const typedefs = require("../types/typedefs");


/**
 * @param {typedefs.WpwBuild} build
 * @returns {typedefs.WpwWebpackConfig}
 */
const webpackDefaultExports = (build) =>
{
    return {
        cache: { type: "memory" },
        context: build.paths.ctx || build.paths.base,
        entry: {},
        externals: [],
        infrastructureLogging: {},
        mode: build.mode === "test" ? "none" : build.mode,
        module: { rules: [] },
        name: `${build.pkgJson.scopedName.scope}|${build.pkgJson.version}|${build.name}|${build.mode}|${build.target}`,
        output: { path: build.getDistPath() }, // { path: build.getDistPath({ rel: true }) }
        plugins: [],
        resolve: {},
        stats: {},
        target: build.target
    };
};


/**
 * @param {typedefs.WpwBuild} build
 * @returns {typedefs.WpwWebpackConfig}
 * @throws
 */
const webpackExports = (build) =>
{
    build.wpc = webpackDefaultExports(build);
    cache(build);          // Asset cache
    experiments(build);    // Set any experimental flags that will be used
    entry(build);          // Entry points for built output
    externals(build);      // External modules
    ignorewarnings(build); // Warnings from the compiler to ignore
    optimization(build);   // Build optimization
    minification(build);   // Minification / Terser plugin options
    output(build);         // Output specifications
    devtool(build);        // Dev tool / sourcemap control
    resolve(build);        // Resolve config
    rules(build);          // Loaders & build rules
    stats(build);          // Stats i.e. console output & webpack verbosity
    watch(build);          // Watch-mode options
    plugins(build);        // Plugins - exports.plugins() inits all plugin.plugins
    return build.wpc;
};


module.exports = webpackExports;
