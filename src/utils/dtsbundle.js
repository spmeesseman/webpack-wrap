// @ts-check

/**
 * @file src/utils/dtsbundle.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const { join } = require("path");
const dts = require("dts-bundle");
const { existsSync } = require("fs");
const WpwError = require("./message");
const typedefs = require("../types/typedefs");
const { unlink, readFile } = require("fs/promises");
const { findFiles, relativePath, resolvePath, existsAsync } = require("./utils");
const { isString, isDirectory, apply, applyIf, isObject } = require("@spmeesseman/type-utils");


/**
 * @param {typedefs.WpwBuild} build
 * @param {typedefs.WebpackCompilation} compilation
 * @param {string} statsProperty
 */
const dtsBundle = async (build, compilation, statsProperty) =>
{
    const l = build.logger,
          baseBuildDir = build.getBasePath(),
          declarationDir = build.source.config.compilerOptions.declarationDir,
          dtsFilesOutputDir = resolvePath(baseBuildDir, declarationDir ?? build.getDistPath({ fallback: true }));

    if (!(await existsAsync(dtsFilesOutputDir)))
    {
        build.addMessage({ code: WpwError.Msg.ERROR_NO_OUTPUT_DIR, compilation, message: "dts bundling failed" });
        return;
    }

    l.start("bundle types .d.ts files", 1);

    const typeOptions = build.options.types?.bundle,
          bundleOptions = isObject(typeOptions) ? typeOptions : /** @type {typedefs.IWpwPluginConfigTypesBundle} */({}),
          bundleCfg = apply({}, bundleOptions, { verbose: build.log.level >= 4 || !!bundleOptions.verbose }),
          dtsBundleOutputDir = bundleOptions.baseDir ? resolvePath(baseBuildDir, bundleOptions.baseDir) : dtsFilesOutputDir,
          dtsBundleBaseDir = relativePath(baseBuildDir, dtsBundleOutputDir).replace(/\\/g, "/").replace(/\/$/, "");

    applyIf(bundleCfg,
    {
        baseDir: dtsBundleBaseDir,
        name: `${build.pkgJson.name}-${build.name}`.replace(/\//g, "-").replace(/@/g, ""),
        out: build.name + ".d.ts"
    });

    let main = dtsFilesOutputDir + "/**/*.d.ts";
    if (isString(bundleCfg.main))
    {
        let cfgMain = bundleCfg.main;
        if (cfgMain === "entry")
        {
            cfgMain = getDtsEntryFile(build, compilation, dtsFilesOutputDir);
        }
        if (await existsAsync(resolvePath(baseBuildDir, cfgMain)))
        {
            main = cfgMain;
            if (bundleCfg.main !== "entry" && isDirectory(main)) {
                main = join(main, "**/*.d.ts");
            }
        }
    }
    bundleCfg.main = main;

    const dtsFilePathAbs = join(dtsBundleOutputDir, /** @type {string} */(bundleCfg.out)),
          dtsFilePathRel = relativePath(baseBuildDir, dtsFilePathAbs);
    if (existsSync(dtsFilePathAbs))
    {
        l.write("   clean/remove prior bundle output @ " + dtsFilePathRel, 2);
        await unlink(dtsFilePathAbs);
    }

    if (build.logger.level >= 2)
    {
        l.value("   types output directory", dtsFilesOutputDir, 2);
        l.write("   output bundle path info:");
        l.value("      relative path (->dist)", dtsBundleBaseDir);
        l.value("      relative path (->base)", dtsFilePathRel);
        l.value("      absolute path", dtsFilePathAbs);
        l.value("      base output path", dtsBundleOutputDir);
        l.write("   output bundle options:");
        l.value("      name", bundleCfg.name);
        l.value("      output file", bundleCfg.out);
        l.value("      main", bundleCfg.main);
        l.value("      base dir", bundleCfg.baseDir);
        l.value("      header text", bundleCfg.headerText);
        l.value("      header path", bundleCfg.headerPath);
        l.value("      output as module folder", bundleCfg.outputAsModuleFolder);
    }

    try
    {   const outputFiles = await findFiles("**/*.d.ts", { cwd: dtsFilesOutputDir, absolute: true });
        dts.bundle(bundleCfg);
        const data = await readFile(dtsFilePathAbs);
        const info = /** @type {typedefs.WebpackAssetInfo} */({
            // contenthash: newHash,
            immutable: false, // newHash === persistedCache[filePathRel],
            javascriptModule: false,
            [statsProperty]: true
        });
        outputFiles.forEach((f) => { compilation.fileDependencies.add(f); });
        compilation.emitAsset(dtsFilePathRel, new compilation.compiler.webpack.sources.RawSource(data), info);
        l.write("   dts bundle created successfully @ " + dtsFilePathRel, 1);
    }
    catch (e) {
        build.addMessage({
            code: WpwError.Msg.ERROR_TYPES_FAILED,
            compilation,
            error: e,
            message: "types build: failed to create bundle"
        });
    }
};


/**
 * @protected
 * @param {typedefs.WpwBuild} build
 * @param {typedefs.WebpackCompilation} compilation
 * @param {string} outputDir full path
 * @returns {string}
 */
const getDtsEntryFile = (build, compilation, outputDir) =>
{
    const baseDir = build.getBasePath();
    const entryOptions = /** @type {typedefs.WebpackEntryOptions} */(compilation.entries.get(build.name)?.options);
    // 		// entryOptions2 = /** @type {typedefs.WebpackEntryOptions} */(compilation.entrypoints.get(build.name)?.options);
    const entryName = /** @type {string} */(entryOptions.name);
    let entryFile = /** @type {string} */(compilation.getAsset(entryName)?.name); // ,
        // entryFileAbs; // , entryFileRel, entryFileRelBase, entryFileRelContext;// entryName + "." + build.source.ext,
    if (entryFile)
    {
        // entryFileAbs = resolvePath(outputDir, entryFile).replace(/\\/g, "/");
        // entryFileRel = relativePath(outputDir, entryFileAbs).replace(/\\/g, "/");
        // entryFileRelBase = relativePath(baseDir, entryFileAbs).replace(/\\/g, "/");
        // entryFileRelContext = relativePath(this.compiler.context, entryFileAbs).replace(/\\/g, "/");
        entryFile = resolvePath(outputDir, entryFile).replace(/\\/g, "/");
    }
    let dtsEntryFile = entryFile.replace(build.source.ext, "d.ts");
    const rootDir = build.source.config.compilerOptions.rootDir;
    if (rootDir && rootDir !== ".") {
        dtsEntryFile = dtsEntryFile.replace(rootDir.replace(/\\/g, "/"), "").replace("//", "/").replace(/^\//, "");
    }
    const dtsEntryFileAbs = resolvePath(outputDir, dtsEntryFile),
          // dtsEntryFileRel = relativePath(outputDir, dtsEntryFileAbs),
          // dtsEntryFileRelContext = relativePath(this.compiler.context, dtsEntryFileAbs),
          dtsEntryFileRelBase = relativePath(baseDir, dtsEntryFileAbs);
    return dtsEntryFileRelBase;
};


module.exports = dtsBundle;

