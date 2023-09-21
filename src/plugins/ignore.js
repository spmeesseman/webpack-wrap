/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file src/plugins/ignore.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const typedefs = require("../types/typedefs");
const { requireResolve } = require("../utils");
/*  // const { IgnorePlugin } = require("webpack"); */
const { IgnorePlugin } = /** @type {typedefs.WebpackType} */(requireResolve("webpack"));

/** @typedef {import("webpack").IgnorePlugin} IgnorePlugin */


/**
 * @param {typedefs.WpwBuild} build
 * @returns {typedefs.WebpackIgnorePlugin | undefined}
 */
const ignore = (build) =>
{
    /** @type {IgnorePlugin | undefined} */
    let plugin;
    if (build.options.ignore) //  && build.mode === "production")
    {
        plugin = new IgnorePlugin(
        {
            resourceRegExp: /^\.\/locale$/,
            contextRegExp: /moment$/
        });
    }
    return plugin;
};


module.exports = ignore;
