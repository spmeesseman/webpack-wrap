// @ts-check

/**
 * @file plugin/index.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const analyzer = require("./analyze/analyzer");
const banner = require("./banner");
const circular = require("./analyze/circular");
const clean = require("./clean");
const copy = require("./copy");
const dispose = require("./dispose");
const runtimevars = require("./runtimevars");
const environment = require("./environment");
const istanbul = require("./istanbul");
const licensefiles = require("./licensefiles");
const ignore = require("./ignore");
const jsdoc = require("./jsdoc");
const optimization = require("./optimization");
const loghooks = require("./loghooks");
const progress = require("./progress");
const scm = require("./scm");
const sourcemaps = require("./sourcemaps");
const testsuite = require("./testsuite");
const types = require("./types");
const tscheck = require("./tscheck");
const upload = require("./upload");
const vendormod = require("./vendormod");
const visualizer = require("./analyze/visualizer");
const wait = require("./wait");
const web = require("./html");

const analyze = { analyzer, circular, visualizer };


module.exports = {
    analyze, banner, clean, copy, dispose, environment, ignore, istanbul,
    jsdoc, licensefiles, loghooks, optimization, progress, runtimevars, scm,
    sourcemaps, testsuite, tscheck, types, upload, vendormod, wait, web
};
