/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file src/plugins/jsdoc.js
 * @version 0.0.1
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const { existsSync } = require("fs");
const { readFile } = require("fs/promises");
const WpwError = require("../utils/message");
const typedefs = require("../types/typedefs");
const WpwBaseTaskPlugin = require("./basetask");
const { apply, isDirectory } = require("@spmeesseman/type-utils");
const { join, relative, resolve, extname, sep } = require("path");
const {
    relativePath, existsAsync, findFiles, findExPath, forwardSlash, resolvePath, isWpwPluginConfigJsDocTemplate
} = require("../utils");


/**
 * @extends WpwBaseTaskPlugin
 */
class WpwJsDocPlugin extends WpwBaseTaskPlugin
{
    /**
     * @param {typedefs.WpwPluginOptions} options
     */
	constructor(options)
	{
		super(apply({ taskHandler: "buildJsDocs" }, options));
        this.buildOptions = /** @type {typedefs.WpwBuildOptionsConfig<"jsdoc">} */(this.buildOptions); // reset for typings
	}


	/**
     * @override
     */
	static create = WpwJsDocPlugin.wrap.bind(this);


    /**
     * @override
     * @param {typedefs.WpwBuildOptionsConfig<"jsdoc">} _config
     * @param {typedefs.WpwBuild} build
     */
    static validate = (_config, build) => existsSync(resolve(build.getBasePath(), "node_modules/jsdoc"));


	/**
	 * @param {typedefs.WebpackCompilationAssets} assets
	 * @returns {Promise<void>}
	 */
	async buildJsDocs(assets)
	{
        const build = this.build,
              logger = build.logger,
              buildOptions = this.buildOptions,
              outDir = this.virtualBuildPath,
              baseDir = build.getBasePath(),
              ctxDir =  build.getContextPath(),
              srcDir =  build.getSrcPath(),
              pathOptions = { psx: true, stat: true };

        // * @type {typedefs.WpwPluginConfigJsDoc} */
        /** @type {Record<string, any>} */
        const config = { destination: outDir };

		logger.write("create jsdoc documentation", 1);
		logger.value("   base directory", baseDir, 1);
		logger.value("   context directory", ctxDir, 1);
		logger.value("   input directory", srcDir, 1);
		logger.value("   output directory", outDir, 1);

        if (buildOptions.mode === "config")
        {   //
            // User has specified a config file in wpwrc
            //
            const rPath = resolvePath(baseDir, buildOptions.configFile, { psx: true, stat: true }) ;
            if (rPath)
            {
                config.configure = relativePath(baseDir, rPath);
            }
            else
            {   return build.addMessage({
                    code: WpwError.Code.ERROR_RESOURCE_MISSING,
                    message: "specified jsdoc configuration file path does not exist",
                    detail: "configured file location: " + buildOptions.configFile,
                    compilation: this.compilation
                });
            }
        }
        else
        {
            apply(config, {
                verbose: build.logger.level >= 4 || buildOptions.verbose,
                debug: build.logger.level >= 5 || buildOptions.debug,
                package: relativePath(baseDir, build.pkgJsonFilePath, pathOptions)
            });

            //
            // jsdoc.json config file (use the template config file @ schema/template if not found)
            //
            let path = await findExPath([
                join(ctxDir, ".jsdoc.json"),
                join(ctxDir, "jsdoc.json"),
                join(baseDir, ".jsdoc.json"),
                join(baseDir, "jsdoc.json"),
                join(srcDir, ".jsdoc.json"),
                join(srcDir, "jsdoc.json")
            ]);
            if (path) {
                config.configure = relativePath(baseDir, path, pathOptions);
            }
            else {
                config.configure = "schema/template/.jsdoc.json";
            }

            //
            // Examples directory
            //
            path = buildOptions.examplesDir;
            if (!path)
            {
                path = await findFiles("**/examples/", { cwd: baseDir, maxDepth: 2 }, true)[0];
            }
            else if (!(await existsAsync(resolve(baseDir, path))))
            {
                build.addMessage({
                    code: WpwError.Code.WARNING_RESOURCE_MISSING,
                    message: "specified jsdoc 'examples' directory path does not exist",
                    detail: "configured file location: " + buildOptions.configFile,
                    compilation: this.compilation
                });
            }
            if (path) {
                config.examples = relativePath(baseDir, path, pathOptions);
            }

            //
            // Tutorials directory
            //
            path = buildOptions.tutorialsDir;
            if (!path)
            {
                path = await findFiles("**/tutorials/", { cwd: baseDir, maxDepth: 2 }, true)[0];
            }
            else if (!(await existsAsync(resolve(baseDir, path))))
            {
                build.addMessage({
                    code: WpwError.Code.WARNING_RESOURCE_MISSING,
                    message: "specified jsdoc 'tutorials' directory path does not exist",
                    detail: "configured file location: " + buildOptions.configFile,
                    compilation: this.compilation
                });
            }
            if (path) {
                config.tutorials = relativePath(baseDir, path, pathOptions);
            }

            //
            // README file
            //
            path = buildOptions.readmeFile || await findExPath([
                join(ctxDir, "README.txt"),
                join(ctxDir, "README.md"),
                join(ctxDir, "README"),
                join(baseDir, "README.txt"),
                join(baseDir, ".README.md"),
                join(baseDir, "README"),
                join(baseDir, ".README")
            ]);
            if (path) {
                config.readme = relativePath(baseDir, path, pathOptions);
            }
        }


        //
        // Read config file and store as jso
        //
        const jsdocArgs = this.configToArgs(config, true),
              /** @type {Record<string, any>} */
              fileConfig = JSON.parse(await readFile(resolve(baseDir, config.configure), "utf8"));
        //
        // Recurse flag
        //
        if (fileConfig.source.include)
        {
            for (const include of fileConfig.source.include)
            {
                if (isDirectory(resolvePath(baseDir, include))) {
                    jsdocArgs.push("--recurse");
                    break;
                }
            }
        }
        else if (!fileConfig.source.include || fileConfig.source.include.length === 0)
        {
            const srcDir = build.getSrcPath({ rel: true, psx: true, dot: true, fallback: true });
            jsdocArgs.push("--recurse", srcDir.includes(" ") && srcDir[0] !== "\"" ? `"${srcDir}"` : srcDir);
        }
        //
        // Template
        //
        if (buildOptions.template)
        {
            config.template = "node_modules/" + isWpwPluginConfigJsDocTemplate(buildOptions.template) ? buildOptions.template  : "clean-jsdoc-theme";
            jsdocArgs.push("--template", config.template);
        }
        else if (!fileConfig.opts.template)
        {
            config.template = "node_modules/clean-jsdoc-theme";
            jsdocArgs.push("--template", config.template);
        }
        // //
        // // Theme
        // //
        // if (config.template === "node_modules/clean-jsdoc-theme" && isWpwPluginConfigJsDocTheme(buildOptions.theme)) {
        //     fileConfig.opts.theme_opts.default_theme = buildOptions.theme;
        // }

        await this.executeJsDoc(jsdocArgs, assets);
    }


    /**
     * @param {string[]} args
	 * @param {typedefs.WebpackCompilationAssets} _assets
	 * @returns {Promise<void>}
	 */
    async executeJsDoc(args, _assets)
    {
        const build = this.build,
              logger = build.logger,
              outDir = this.virtualBuildPath;
              // persistedCache = this.cache.get();

        const cmdLineArgs = args.join(" ");
        logger.write("   execute jsdoc module", 1);
        logger.value("      cmd line args", cmdLineArgs, 2);

        //
        // Execute jsdoc command
        //
        const code = await this.exec2(`npx jsdoc ${cmdLineArgs}`, "jsdoc");
        if (code !== 0)
        {
            return build.addMessage({
                code: WpwError.Code.ERROR_JSDOC_FAILED,
                compilation: this.compilation ,
                message: "the jsdoc module execution exited with error code " + code
            });
        }

        //
        // Ensure output directory exists
        //
        if (!(await existsAsync(outDir)))
        {
            return build.addMessage({
                code: WpwError.Code.ERROR_JSDOC_FAILED,
                compilation: this.compilation,
                message: "jsdoc build failed - output directory doesn't exist",
                detail: `configured output directory: ${outDir}`
            });
        }

		//
		// Process output files
		//
        logger.write("   jsdoc command execution successful", 2);
        logger.write("   process output files", 2);
		const files = await findFiles("**/*.*", { cwd: outDir, absolute: true });
		for (const filePath of files)
		{
            // logger.value("      process asset", filePath, 3);
            const data = await readFile(filePath),
                  //
                  // the "--package" options creates 3 more dir levela deep for output path
                  // e.g. [diat]/@spmeesseman/webpack-wrap/0.0.1/....  remove from output emit path
                  //
                  // filePathRel = relative(outDir, filePath), // .replace(/^.*?[\\\/][0-9]+\.[0-9]+\.[0-9]+[\\\/]/, ""),
                  filePathRel = relative(outDir, filePath).replace(/^.*?[\\\/][0-9]+\.[0-9]+\.[0-9]+[\\\/]/, ""),
                  source = new this.compiler.webpack.sources.RawSource(data);
            //    result = await this.checkSnapshot(filePath, "__", outDir); // , data),
            //    data = result.source?.buffer() || await readFile(filePath),
            //    newHash = this.getContentHash(data);

            // if (newHash === persistedCache[filePathRel]) {
            //     logger.value("      asset unchanged", filePathRel, 4);
            // }
            // else {
            //     logger.value("      asset changed", filePathRel, 4);
            //     persistedCache[filePathRel] = newHash;
            //     this.cache.set(persistedCache);
            // }

            const info = /** @type {typedefs.WebpackAssetInfo} */(
            {
                // contenthash: newHash,
                immutable: true, // true // newHash === persistedCache[filePathRel],
                javascriptModule: false,
                jsdoc: true
            });

            // const existingAsset = this.compilation.getAsset(filePathRel);
            // if (!existingAsset)
            // {
            //     logger.write("      emit asset", 3);
            //     this.compilation.emitAsset(filePathRel, source, info);
            // }
            // else {
            //     logger.write("      asset compared for emit", 3);
            //     this.compilation.comparedForEmitAssets.add(filePath);
            //     // this.compilation.updateAsset(filePathRel, source, info);
            // }

            const ext = extname(filePath);
            if (ext === ".htm" || ext === ".html")
            {
                const sourceFileRel = filePathRel.replace(".html", "").replace("_", sep),
                      sourceFile = resolve(build.getSrcPath(), sourceFileRel);
                if (await existsAsync(sourceFile))
                {
                    // this.compilation.buildDependencies.add(sourceFile);
                    this.compilation.fileDependencies.add(sourceFile);
                    info.sourceFilename = forwardSlash(sourceFileRel);
                    logger.value("      add build dependency", info.sourceFilename, 5);
                }
            }

            logger.value("      emit asset", filePathRel, 4);
            this.compilation.emitAsset(filePathRel, source, info);
		}
        logger.write(`   processed bold(${files.length}) output files`, 3);
    }

    /*
    async getSnapshot()
    {
        const newAssetJson = JSON.stringify(assets);
        if (isCompilationCached && options.cache && assetJson === newAssetJson)
        {
                previousEmittedAssets.forEach(({ name, html }) => {
                compilation.emitAsset(name, new webpack.sources.RawSource(html, false));
            });
            return;
        }
        else {
            previousEmittedAssets = [];
            assetJson = newAssetJson;
        }

        const filename = options.filename.replace(/\[templatehash([^\]]*)\]/g, require('util').deprecate(
        (match, options) => `[contenthash${options}]`,
        '[templatehash] is now [contenthash]')
        );
        const replacedFilename = replacePlaceholdersInFilename(filename, html, compilation);
        // Add the evaluated html code to the webpack assets
        compilation.emitAsset(replacedFilename.path, new webpack.sources.RawSource(html, false), replacedFilename.info);
        previousEmittedAssets.push({ name: replacedFilename.path, html });
        return replacedFilename.path;

		logger.write(`   finished execution of jsdoc build @ italic(${relative(this.build.paths.base, outDir)})`, 3);
 	}
    */
}


module.exports = WpwJsDocPlugin.create;

// const traceMethod = (obj) =>
// {
//     return new Proxy(obj,
//     {
//         get(target, methodName, receiver)
//         {
//             const originMethod = target[methodName];
//             return (...args) =>
//             {
//                 data += args[0];
//                 return originMethod.apply(this, args);
//             };
//         }
//     });
// };

// logger.value("process input file @ ", resourcePathRel, 3);
// logger.write("   full path @ " + resourcePath, 3);

// const jsdocOptions = {
//     source,
//     destination: "console",
//     ...pick(options, "debug", "private", "readme", "package", "configure", "verbose")
// };

// if (jsdocOptions.readme) {
//     jsdocOptions.readme = posix.normalize(relativePath(options.outDir, jsdocOptions.readme));
// }

// if (jsdocOptions.package) {
//     jsdocOptions.package = posix.normalize(relativePath(options.outDir, jsdocOptions.package));
// }

// if (jsdocOptions.configure) {
//     jsdocOptions.configure = posix.normalize(relativePath(options.outDir, jsdocOptions.configure));
// }

// logger.value("   jsdoc execution options", JSON.stringify(jsdocOptions), 5);

// const stderr = capcon.captureStderr(function scope() {
//
// });

// data = capcon.captureStdout(function scope() { jsdoc.renderSync(data); });

// the first parameter here is the stream to capture, and the
// second argument is the function receiving the output


// const stdio = capcon.captureStdio(function scope() {
// });

// const origConsole = console;
// try {
//     // logger.write("   tracing console for jsdoc output", 5);
//     // console = traceMethod(console);
//     logger.write("   execute jsdoc", 4);
//     data = "";
//     capcon.startCapture(process.stdout, (stdout) => { data += stdout; });
//     jsdoc.renderSync(jsdocOptions);
// }
// catch (e) {
//     throw new WpwError({ code: WpwError.Code.ERROR_LOADER, message: "jsdoc loader renderSync failed", error: e });
// }
// finally {
//     // console = origConsole;
//     capcon.stopCapture(process.stdout);
//
// }
// logger.write("   check compilation cache for snapshot", 4);
// try {
//     persistedCache = this.cache.get();
//     cacheEntry = await this.wpCacheCompilation.getPromise(`${resourcePath}|${identifier}`, null);
// }
// catch (e) {
//     throw new WpwError("jsdoc loader failed: " + e.message, "loaders/jsdoc.js");
// }

// if (cacheEntry)
// {
//     let isValidSnapshot;
//     logger.write("      check snapshot valid", 4);
//     try {
//         isValidSnapshot = await this.checkSnapshotValid(cacheEntry.snapshot);
//     }
//     catch (e) {
//         throw new WpwError("jsdoc loader failed" + e.message, "loaders/jsdoc.js", "checking snapshot");
//     }
//     if (isValidSnapshot)
//     {
//         logger.write("      snapshot is valid", 4);
//         ({ hash, source } = cacheEntry);
//         newHash = newHash || this.getContentHash(source);
//         if (newHash === hash)
//         {
//             logger.write("      asset is unchanged since last snapshot", 4);
//         }
//         else {
//             logger.write("      asset has changed since last snapshot", 4);
//         }
//     }
//     else {
//         logger.write("      snapshot is invalid", 4);
//     }
// }

// if (!source)
// {
//     let snapshot;
//     const startTime = Date.now();
//     data = data || await readFile(resourcePath);
//     source = new this.compiler.webpack.sources.RawSource(data);
//     logger.write("      create snapshot", 4);
//     try {
//         snapshot = await this.createSnapshot(startTime, resourcePath);
//     }
//     catch (e) {
//         throw new WpwError("jsdoc loader failed" + e.message, "loaders/jsdoc.js", "creating snapshot " + resourcePathRel);
//     }
//     if (snapshot)
//     {
//         logger.write("      cache snapshot", 4);
//         try {
//             newHash = newHash || this.getContentHash(source.buffer());
//             snapshot.setFileHashes(hash);
//             await this.wpCacheCompilation.storePromise(`${resourcePath}|${identifier}`, null, { source, snapshot, hash });
//             cacheEntry = await this.wpCacheCompilation.getPromise(`${resourcePath}|${identifier}`, null);
//         }
//         catch (e) {
//             throw new WpwError("jsdoc loader failed" + e.message, "loaders/jsdoc.js", "caching snapshot " + resourcePathRel);
//         }
//     }
// }

// newHash = newHash || this.getContentHash(data);
// if (newHash === persistedCache[resourcePathRel])
// {
//     logger.write("   asset is unchanged", 4);
// }
// else {
//     logger.write("   asset has changed, update hash in persistent cache", 4);
//     persistedCache[resourcePathRel] = newHash;
//     this.cache.set(persistedCache);
// }

// const info = {
//     // contenthash: newHash,
//     immutable: true, // newHash === persistedCache[filePathRel],
//     javascriptModule: false,
//     jsdoc: true
// };
// this.compilation.buildDependencies.add(filePathRel);
// this.compilation.buildDependencies.add(resourcePath);
// this.compilation.compilationDependencies.add();
// this.compilation.contextDependencies.add();

// const cache = this.compiler.getCache(`${this.build.name}_${this.build.type}_${this.build.wpc.target}`.toLowerCase());

// this.compilation.emitAsset(resourcePathRel, source, info);

// this.compilation.additionalChunkAssets.push(filePathRel);

// const existingAsset = this.compilation.getAsset(resourcePathRel);
// if (existingAsset)
// {
//     logger.write("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
//     logger.write("!!!!!!!!!!!*********TEST********** upfate jsdoc asset !!!!!!!!!!!!!!!!!!!!!!!!!");
//     logger.write("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
// }
// if (!existingAsset)
// {
    // logger.write("   emit jsdoc asset", 3);
    // this.compilation.emitAsset(resourcePathRel, source, info);

    // const fileName = loaderUtils.interpolateName(this, "[name]-[contenthash].[ext]", {content: source});
    // this.emitFile(fileName, resourcePath);
    // this.addDependency(resourcePath);
// }
// else if (this.options.force)
// {
//     logger.write("   update asset", 3);
//     this.compilation.updateAsset(resourcePathRel, source, info);
// }
// else {
//     logger.write("      asset compared for emit", 3);
//     this.compilation.buildDependencies.add(resourcePathRel);
//     this.compilation.comparedForEmitAssets.add(resourcePathRel);
//     this.compilation.compilationDependencies.add(resourcePathRel);
// }
