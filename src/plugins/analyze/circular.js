/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file src/plugins/analyze/circular.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const { isObject } = require("@spmeesseman/type-utils");
const { getExcludes, WpwError } = require("../../utils");
const CircularDependencyPlugin = require("circular-dependency-plugin");


/**
 * @param {import("../../types/typedefs").WpwBuild} build
 * @returns {CircularDependencyPlugin | undefined}
 */
const circular = (build) =>
{
    let plugin;
    const buildOptions = build.options.analyze;
    if (build.cmdLine.analyze || (buildOptions && buildOptions.circular !== false))
    {
        const buildOptionsCircular = buildOptions?.circular;
        const excludes = getExcludes(build).map(e => e.toString()).map(e => e.slice(1, e.length - 1));
        plugin = new CircularDependencyPlugin(
        {
            cwd: build.getBasePath(),
            exclude: new RegExp(excludes.join("|")),
            failOnError: isObject(buildOptionsCircular) ? !!buildOptionsCircular.fail : false,
            onDetected: ({ module: _webpackModuleRecord, paths, compilation }) =>
            {
                build.addMessage({ code: WpwError.Code.WARNING_CIRCULAR, compilation, message: paths.join(" -> ") });
            }
        });
    }
    return plugin;
};


module.exports = circular;
