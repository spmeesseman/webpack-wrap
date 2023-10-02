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
const { relativePath, existsAsync, findFiles, findExPath, forwardSlash, resolvePath, isWpwPluginConfigJsDocTheme, isWpwPluginConfigJsDocTemplate } = require("../utils");


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
     * @param {typedefs.WpwBuild} build
	 * @returns {WpwJsDocPlugin | undefined}
     */
	static create = (build) => WpwJsDocPlugin.wrap(this, build, "jsdoc", this.validateJsDocInstalled);


	/**
	 * @param {typedefs.WebpackCompilationAssets} assets
	 * @returns {Promise<void>}
	 */
	async buildJsDocs(assets)
	{
        const build = this.build,
              logger = build.logger,
              buildOptions = this.buildOptions,
              outDir = this.buildPathTemp,
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
        let numFilesProcessed = 0;
        const build = this.build,
              logger = build.logger,
              outDir = this.buildPathTemp;
              // persistedCache = this.cache.get();

        const cmdLineArgs = args.join(" ");

        logger.write("   execute jsdoc module", 1);
        logger.value("      cmd line args", cmdLineArgs, 2);

        //
        // Execute jsdoc command
        //
        const code = await this.exec(`npx jsdoc ${cmdLineArgs}`, "jsdoc");
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

            const info = /** @type {typedefs.WebpackAssetInfo} */({
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
            ++numFilesProcessed;
		}
        logger.write(`   processed bold(${numFilesProcessed}) of ${files.length} output files`, 3);
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


    /**
     * @private
     * @param {typedefs.WpwBuild} build
     * @returns {boolean}
     */
    static validateJsDocInstalled = (build) => existsSync(resolve(build.getBasePath(), "node_modules/jsdoc"));

}


module.exports = WpwJsDocPlugin.create;
