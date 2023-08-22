/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/analyze.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const webpack = require("webpack");
const { getExcludes } = require("../utils");
const CircularDependencyPlugin = require("circular-dependency-plugin");

/** @typedef {import("../../../types/typedefs").WpBuildApp} WpBuildApp */
/** @typedef {import("../../../types/typedefs").WebpackPluginInstance} WebpackPluginInstance */


/**
 * @param {WpBuildApp} app
 * @returns {CircularDependencyPlugin | undefined}
 */
const circular = (app) =>
{
    let plugin;
    if (app.rc.args.analyze)
    {
        plugin = new CircularDependencyPlugin(
        {
            cwd: app.getBasePath(),
            exclude: new RegExp(getExcludes(app, app.tsConfig).join("|"), "gi"),
            failOnError: false,
            onDetected: ({ module: _webpackModuleRecord, paths, compilation }) =>
            {
                compilation.warnings.push(new webpack.WebpackError(paths.join(" -> ")));
            }
        });
    }
    return plugin;
};


module.exports = circular;
