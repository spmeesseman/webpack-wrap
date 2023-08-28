/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/ignore.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 */

const { requireResolve } = require("../utils");
/*  // const webpack = require("webpack"); */
/** @typedef {import("../types/typedefs").WebpackType} WebpackType */
const webpack = /** @type {WebpackType} */(requireResolve("webpack"));

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */
/** @typedef {import("webpack").IgnorePlugin} IgnorePlugin */


/**
 * @param {WpBuildApp} app
 * @returns {IgnorePlugin | undefined}
 */
const ignore = (app) =>
{
    /** @type {IgnorePlugin | undefined} */
    let plugin;
    if (app.build.options.ignore) //  && app.build.mode === "production")
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
