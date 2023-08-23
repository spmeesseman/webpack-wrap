/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file types/app.d.ts
 * @version 0.0.1
 * @license MIT
 * @author @spmeesseman Scott Meesseman
 */

const WpBuildRc = require("./src/core/rc");
const typedefs = require("./src/types/typedefs");

/**
 * Exports Webpack build configs to the webpack engine... the build(s) start here. Eenvironment "flags"
 * in arge should be set on the cmd line e.g. `--env=property`, as opposed to `--env property=true`,
 * but any "boolean strings" will be converted to `true` to a booleans
 *
 * @function
 * @exports
 * @module
 * @param {typedefs.WpBuildRuntimeEnvArgs} arge Environment variable containing runtime options
 * passed to webpack on the command line (e.g. `webpack --env environment=test --env clean=true`) as
 * opposed to the "correct" way i.e. webpack --env environment=test --env clean`
 * @param {typedefs.WebpackRuntimeArgs} argv Webpack command line args
 * @returns {typedefs.WpBuildWebpackConfig | typedefs.WpBuildWebpackConfig[]}
 */
module.exports = (arge, argv) => WpBuildRc.create(argv, arge);
