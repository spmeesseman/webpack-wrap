/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file webpack.config.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author @spmeesseman Scott Meesseman
 *
 * @description
 *
 * The webpack build package files from the @spmeesseman/webpack-wrap package are a colleactive set
 * of organized plugins and export configurations adaptable to a variety of different project builds.
 *
 * This file is the default Webpack configuration file that returns a webpack.Configuration object,
 * or an array of webpack.Configuration objects, to the Webpack engine.
 *
 * This file calls calls into each module in exports/* to construct the build config for each
 * that'sspecified build.  The call to the export/plugins.js module will itself call into each
 * module located in plugin/*.
 *
 * Modules in the  exports directory are generally named to the export property on the webpack
 * config object, e.g. ruls.js correspnds to the `riles` property, etc.
 *
 * Modules located in the plugin directory are generally named after the action that they are
 * performing, e.g. `loghooks.js` logs each hook  when it starts.  If anything, logging each stage
 * definitely to gives a good grasp on how a webpack build proceeds.
 *
 * NOTE: {@link typedefs.WpwPlugin WpwPlugin} for steps to take when adding a new plugin,
 *
 * Handy file links:
 *
 * COMPILER  : file:///c:\Projects\@spmeesseman\webpack-wrap\node_modules\webpack\lib\Compiler.js
 * TAPABLE   : file:///c:\Projects\@spmeesseman\webpack-wrap\node_modules\tapable\tapable.d.ts
 * RC DEFAULTS : file:///c:\Projects\@spmeesseman\webpack-wrap\src\utils\app.js
 */

const WpwWrapper = require("@spmeesseman/webpack-wrap/src/core/wrapper");
const typedefs = require("@spmeesseman/webpack-wrap/src/types/typedefs");
/**
 * Exports Webpack build configs to the webpack engine... the build(s) start here. Eenvironment "flags"
 * in arge should be set on the cmd line e.g. `--env=property`, as opposed to `--env property=true`,
 * but any "boolean strings" will be converted to `true` to a booleans
 *
 * @param {typedefs.WpwRuntimeEnvArgs} arge Environment variable containing runtime options
 * passed to webpack on the command line (e.g. `webpack --env environment=test --env clean=true`) as
 * opposed to the "correct" way i.e. webpack --env environment=test --env clean`
 * @param {typedefs.WebpackRuntimeArgs} argv Webpack command line args
 * @returns {typedefs.WpwWebpackConfig | typedefs.WpwWebpackConfig[]}
 */
module.exports = (arge, argv) => WpwWrapper.create(argv, arge);
