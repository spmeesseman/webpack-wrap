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

const { getExcludes, WpwError } = require("../../utils");
const CircularDependencyPlugin = require("circular-dependency-plugin");


/**
 * @param {import("../../types/typedefs").WpwBuild} build
 * @returns {CircularDependencyPlugin | undefined}
 */
const circular = (build) =>
{
    let plugin;
    if (build.cmdLine.analyze)
    {
        plugin = new CircularDependencyPlugin(
        {
            cwd: build.getBasePath(),
            exclude: new RegExp(getExcludes(build).join("|"), "gi"),
            failOnError: false,
            onDetected: ({ module: _webpackModuleRecord, paths, compilation }) =>
            {
                build.addMessage({ code: WpwError.Msg.WARNING_GENERAL, compilation, message: paths.join(" -> ") });
            }
        });
    }
    return plugin;
};


module.exports = circular;
