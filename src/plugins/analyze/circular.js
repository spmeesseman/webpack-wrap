/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/analyze.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const { getExcludes, WpBuildError } = require("../../utils");
const CircularDependencyPlugin = require("circular-dependency-plugin");


/**
 * @param {import("../../types/typedefs").WpBuildApp} app
 * @returns {CircularDependencyPlugin | undefined}
 */
const circular = (app) =>
{
    let plugin;
    if (app.cmdLine.analyze)
    {
        plugin = new CircularDependencyPlugin(
        {
            cwd: app.getBasePath(),
            exclude: new RegExp(getExcludes(app, app.source.config).join("|"), "gi"),
            failOnError: false,
            onDetected: ({ module: _webpackModuleRecord, paths, compilation }) =>
            {
                compilation.warnings.push(new WpBuildError(paths.join(" -> ")));
            }
        });
    }
    return plugin;
};


module.exports = circular;
