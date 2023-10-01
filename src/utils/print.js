/* eslint-disable jsdoc/valid-types */
// @ts-check

/**
 * @file src/utils/print.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const typedefs = require("../types/typedefs");
const { WpwBuildOptionsKeys } = require("../types/constants");
const { pickNot } = require("@spmeesseman/type-utils");

let buildCount = 0;


/**
 * @param {typedefs.WpwBuild} build
 * @param {typedefs.WpwWrapper} wrapper
 * @param {any} logIcon
 */
const printBuildProperties = (build, wrapper, logIcon) =>
{
    const l = build.logger;
    l.sep(1, logIcon);
    l.write("Global Configuration:", 1, "", logIcon, l.colors.white);
    Object.keys(build.global).filter(k => typeof build.global[k] !== "object").forEach(
        (k) => l.value(`   ${k}`, build.global[k], 1, "", logIcon)
    );
    l.sep(1, logIcon);
    l.write("Base Configuration:", 1, "", logIcon, l.colors.white);
    l.value("   name", build.pkgJson.scopedName.name, 1, "", logIcon);
    if (build.pkgJson.scopedName.scope) {
        l.value("   npm scope", build.pkgJson.scopedName.scope, 1, "", logIcon);
    }
    l.value("   mode", wrapper.mode, 1, "", logIcon);
    l.value("   logging level", wrapper.log.level, 1, "", logIcon);
    l.value("   app version", build.pkgJson.version, 1, "", logIcon);
    l.value("   wpw version", wrapper.wpwVersion, 2, "", logIcon);
    l.value("   wpw schema version", wrapper.schemaVersion, 2, "", logIcon);
    l.value("   # of active builds", build.buildCount, 2, "", logIcon);
    l.value("   active build names", wrapper.builds.map(a => a.name).join(", "), 2, "", logIcon);
    l.value("   # of defined builds", wrapper.buildConfigs.length, 2, "", logIcon);
    l.value("   defined build names", wrapper.buildConfigs.map(b => b.name).join(", "), 2, "", logIcon);
    l.sep(1, logIcon);
    l.write("Build Configuration:", 1, "", logIcon, l.colors.white);
    l.value("   name", build.name, 1, "", logIcon);
    l.value("   type", build.type, 1, "", logIcon);
    l.value("   target", build.target, 1, "", logIcon);
    l.value("   mode", build.mode, 1, "", logIcon);
    l.value("   source code type", build.source.type, 2, "", logIcon);
    l.value("   is vscode extension", !!build.vscode && !!build.vscode.type, 2, "", logIcon);
    l.value("   logging level", build.log.level, 2, "", logIcon);
    l.value("   log configuration", JSON.stringify(build.log), 3, "", logIcon);
    l.sep(1, logIcon);
    if (l.level >= 2)
    {
        l.write("Build Options:", 2, "", logIcon, l.colors.white);
        WpwBuildOptionsKeys.forEach((key) => { l.value(`   ${key} enabled`, !!build.options[key], 2, "", logIcon); });
        l.value("   options configuration", JSON.stringify(build.options), 3, "", logIcon);
        l.sep(2, logIcon);
        l.write("Build Paths:", 2, "", logIcon, l.colors.white);
        l.value("   base/project directory", build.getBasePath(), 2, "", logIcon);
        l.value("   context directory", build.getContextPath(), 2, "", logIcon);
        l.value("   distribution directory", build.getDistPath(), 2, "", logIcon);
        l.value("   source directory", build.getSrcPath(), 2, "", logIcon);
        l.value("   temp directory", build.getTempPath(), 2, "", logIcon);
        l.sep(2, logIcon);
        l.write(`Build Paths Relative to [${build.getBasePath()}]:`, 2, "", logIcon, l.colors.white);
        l.value("   context directory", build.getContextPath({ rel: true }), 2, "", logIcon);
        l.value("   distribution directory", build.getDistPath({ rel: true }), 2, "", logIcon);
        l.value("   source directory", build.getSrcPath({ rel: true }), 2, "", logIcon);
        l.sep(2, logIcon);
    }
    l.write("Source Code Configuration:", 1, "", logIcon, l.colors.white);
    l.value("   source code ext", build.source.ext, 1, "", logIcon);
    l.value("   source code type", build.source.type, 1, "", logIcon);
    l.value("   config file", build.source.configFile.file, 2, "", logIcon);
    l.value("   config directory", build.source.configFile.dir, 2, "", logIcon);
    l.value("   config path", build.source.configFile.path, 2, "", logIcon);
    l.value("   config file info", JSON.stringify(pickNot(build.source.configFile, "raw")), 3, "", logIcon);
    l.value("   tsc options", JSON.stringify(pickNot(build.source.config, "compilerOptions", "files")), 3, "", logIcon);
    l.value("   tsc compiler options", JSON.stringify(build.source.config.compilerOptions), 3, "", logIcon);
    l.value("   tsc auto-generated files list", JSON.stringify(build.source.config.files), 3, "", logIcon);
    l.sep(1, logIcon);
};


/**
 * @param {typedefs.WpwBuild} build
 */
const printBuildStart = (build) =>
{
    build.logger.value(
        `Start Webpack build ${++buildCount}`,
        build.logger.tag(build.name) + " " + build.logger.tag(build.target),
        undefined, undefined, build.logger.icons.color.start, build.logger.colors.white
    );
};


/**
 * @param {typedefs.WpwBuild} build
 * @param {any} logIcon
 */
const printWpcProperties = (build, logIcon) =>
{
    const l = build.logger;
    l.write("Webpack Configuration:", 1, "", logIcon, l.colors.white);
    l.value("   build name", build.wpc.name, 1, "", logIcon);
    l.value("   mode", build.wpc.mode, 1, "", logIcon);
    l.value("   target",build.wpc.target, 1, "", logIcon);
    l.value("   infrastructure logging level", build.wpc.infrastructureLogging?.level || "none", 2, "", logIcon);
    l.value("   context directory", build.wpc.context, 1, "", logIcon);
    l.value("   output directory", build.wpc.output.path, 1, "", logIcon);
    l.value("   cache", JSON.stringify(build.wpc.cache), 3, "", logIcon);
    l.value("   devtool", JSON.stringify(build.wpc.devtool), 3, "", logIcon);
    l.value("   entry", JSON.stringify(build.wpc.entry), 3, "", logIcon);
    l.value("   experiments", JSON.stringify(build.wpc.experiments), 3, "", logIcon);
    l.value("   externals", JSON.stringify(build.wpc.externals), 3, "", logIcon);
    l.value("   optimization", JSON.stringify(build.wpc.optimization), 3, "", logIcon);
    l.value("   output", JSON.stringify(build.wpc.output), 3, "", logIcon);
    l.value("   resolve", JSON.stringify(build.wpc.resolve), 3, "", logIcon);
    l.value("   rules", JSON.stringify(build.wpc.module.rules), 3, "", logIcon);
    l.value("   stats", JSON.stringify(build.wpc.stats), 3, "", logIcon);
    l.sep(1, logIcon);
};


module.exports = {
    printBuildProperties, printBuildStart, printWpcProperties
};
