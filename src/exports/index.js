// @ts-check

/**
 * @file exports/index.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */


const cache = require("./cache");
const entry = require("./entry");
const rules = require("./rules");
const stats = require("./stats");
const watch = require("./watch");
const output = require("./output");
const devtool = require("./devtool");
const plugins = require("./plugins");
const resolve = require("./resolve");
const externals = require("./externals");
const experiments = require("./experiments");
const typedefs = require("../types/typedefs");
const minification = require("./minification");
const optimization = require("./optimization");
const ignorewarnings = require("./ignorewarnings");
const { isEmpty } = require("@spmeesseman/type-utils");


/**
 * @param {typedefs.WpwBuild} build
 * @returns {typedefs.WpwWebpackConfig}
 */
const webpackDefaultExports = (build) =>
{
    return {
        cache: { type: "memory" },
        snapshot: {},
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
    Object.keys(build.wpc).forEach((k) => { if (isEmpty(build.wpc[k])) { delete build.wpc[k]; }});
    return build.wpc;
};


module.exports = webpackExports;
