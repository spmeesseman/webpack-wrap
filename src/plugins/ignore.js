/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file src/plugins/ignore.js
 * @version 0.0.1
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const typedefs = require("../types/typedefs");
const { requireResolve } = require("../utils");
const webpack = /** @type {typedefs.WebpackType} */(requireResolve("webpack"));


/**
 * @param {typedefs.WpwBuild} build
 * @returns {typedefs.WebpackIgnorePlugin | undefined}
 */
const ignore = (build) =>
{
    /** @type {typedefs.WebpackIgnorePlugin | undefined} */
    let plugin;
    if (build.options.ignore?.momentLocales) //  && build.mode === "production")
    {
        plugin = new webpack.IgnorePlugin(
        {
            resourceRegExp: /^\.\/locale$/,
            contextRegExp: /moment$/
        });
    }
    return plugin;
};


module.exports = ignore;
