// @ts-check

/**
 * @file plugin/index.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 */

const banner = require("./banner");
const clean = require("./clean");
const copy = require("./copy");
const dispose = require("./dispose");
const runtimevars = require("./runtimevars");
const environment = require("./environment");
const istanbul = require("./istanbul");
const licensefiles = require("./licensefiles");
const ignore = require("./ignore");
const optimization = require("./optimization");
const loghooks = require("./loghooks");
const progress = require("./progress");
const scm = require("./scm");
const sourcemaps = require("./sourcemaps");
const testsuite = require("./testsuite");
const tsbundle = require("./tsbundle");
const types = require("./types");
// /**
//  * @param {typedefs.WpBuildApp} app
//  * @param {boolean} [force]
//  * @returns {WpBuildTsBundlePlugin | undefined}
//  */
// const tsbundle = (app, force) => force || app.build.plugins.tsbundle ? new WpBuildTsBundlePlugin({ app }) : undefined;
const tscheck = require("./tscheck");
const upload = require("./upload");
const vendormod = require("./vendormod");
const wait = require("./wait");
const { cssextract, htmlcsp, imageminimizer, htmlinlinechunks, webviewapps } = require("./html");

const analyzer = require("./analyze/analyzer");
const circular = require("./analyze/circular");
const visualizer = require("./analyze/visualizer");
const analyze = { analyzer, circular, visualizer };

module.exports = {
    analyze, banner, clean, copy, cssextract, dispose, environment, htmlcsp, htmlinlinechunks,
    ignore, imageminimizer, istanbul, licensefiles, loghooks, optimization, progress, runtimevars,
    scm, sourcemaps, testsuite, tsbundle, tscheck, types, upload, vendormod, webviewapps, wait
};
