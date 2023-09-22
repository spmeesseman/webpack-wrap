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
 */
const printBuildProperties = (build, wrapper) =>
{
    const l = build.logger;
    l.sep();
    l.write("Global Configuration:", 1, "", 0, l.colors.white);
    Object.keys(build.global).filter(k => typeof build.global[k] !== "object").forEach(
        (k) => l.value(`   ${k}`, build.global[k], 1)
    );
    l.sep();
    l.write("Base Configuration:", 1, "", 0, l.colors.white);
    l.value("   name", build.pkgJson.scopedName.name, 1);
    if (build.pkgJson.scopedName.scope) {
        l.value("   npm scope", build.pkgJson.scopedName.scope, 1);
    }
    l.value("   mode", wrapper.mode, 1);
    l.value("   logging level", wrapper.log.level, 1);
    l.value("   app version", build.pkgJson.version, 1);
    l.value("   wpw version", wrapper.wpwVersion, 2);
    l.value("   wpw schema version", wrapper.schemaVersion, 2);
    l.value("   # of active builds", build.buildCount, 2);
    l.value("   active build names", wrapper.builds.map(a => a.name).join(", "), 2);
    l.value("   # of defined builds", wrapper.buildConfigs.length, 2);
    l.value("   defined build names", wrapper.buildConfigs.map(b => b.name).join(", "), 2);
    l.sep();
    l.write("Build Configuration:", 1, "", 0, l.colors.white);
    l.value("   name", build.name, 1);
    l.value("   type", build.type, 1);
    l.value("   target", build.target, 1);
    l.value("   source code type", build.source.type, 2);
    l.value("   is vscode extension", !!build.vscode && !!build.vscode.type, 2);
    l.value("   logging level", build.log.level, 2);
    l.value("   log configuration", JSON.stringify(build.log), 3);
    l.value("   options configuration", JSON.stringify(build.options), 3);
    l.value("   paths configuration", JSON.stringify(build.paths), 3);
    l.sep();
    if (l.level >= 2)
    {
        l.write("Build Options:", 2, "", 0, l.colors.white);
        WpwBuildOptionsKeys.forEach((key) => { l.value(`   ${key} enabled`, !!build.options[key]); });
        l.value("   options configuration", JSON.stringify(build.options), 3);
        l.sep();
        l.write("Build Paths:", 2, "", 0, l.colors.white);
        l.value("   base/project directory", build.getBasePath());
        l.value("   context directory", build.getContextPath());
        l.value("   distribution directory", build.getDistPath());
        l.value("   source directory", build.getSrcPath());
        l.value("   temp directory", build.paths.temp);
        l.sep();
        l.write(`Build Paths Relative to [${build.getBasePath()}]:`, 2, "", 0, l.colors.white);
        l.value("   context directory", build.getContextPath({ rel: true }));
        l.value("   distribution directory", build.getDistPath({ rel: true }));
        l.value("   source directory", build.getSrcPath({ rel: true }));
        l.sep();
    }
    l.write("Source Code Configuration:", 1, "", 0, l.colors.white);
    l.value("   source code ext", build.source.ext, 1);
    l.value("   source code type", build.source.type, 1);
    l.value("   config file", build.source.configFile.file, 2);
    l.value("   config directory", build.source.configFile.dir, 2);
    l.value("   config path", build.source.configFile.path, 2);
    l.value("   config file info", JSON.stringify(pickNot(build.source.configFile, "raw")), 3);
    l.value("   tsc options", JSON.stringify(pickNot(build.source.config, "compilerOptions", "files")), 3);
    l.value("   tsc compiler options", JSON.stringify(build.source.config.compilerOptions), 3);
    l.value("   tsc auto-generated files list", JSON.stringify(build.source.config.files), 3);
    l.sep();
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
 */
const printWpcProperties = (build) =>
{
    const l = build.logger;
    l.write("Webpack Configuration:", 1, "", 0, l.colors.white);
    l.value("   build name", build.wpc.name, 1);
    l.value("   mode", build.wpc.mode, 1);
    l.value("   target",build.wpc.target, 1);
    l.value("   infrastructure logging level", build.wpc.infrastructureLogging?.level || "none", 2);
    l.value("   context directory", build.wpc.context, 1);
    l.value("   output directory", build.wpc.output.path, 1);
    l.value("   cache", JSON.stringify(build.wpc.cache), 3);
    l.value("   devtool", JSON.stringify(build.wpc.devtool), 3);
    l.value("   entry", JSON.stringify(build.wpc.entry), 3);
    l.value("   experiments", JSON.stringify(build.wpc.experiments), 3);
    l.value("   externals", JSON.stringify(build.wpc.externals), 3);
    l.value("   optimization", JSON.stringify(build.wpc.optimization), 3);
    l.value("   output", JSON.stringify(build.wpc.output), 3);
    l.value("   resolve", JSON.stringify(build.wpc.resolve), 3);
    l.value("   rules", JSON.stringify(build.wpc.module.rules), 3);
    l.value("   stats", JSON.stringify(build.wpc.stats), 3);
    l.sep();
};


module.exports = {
    printBuildProperties, printBuildStart, printWpcProperties
};
