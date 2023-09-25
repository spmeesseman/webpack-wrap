/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file src/plugins/jsdoc.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const { readFile } = require("fs/promises");
const WpwError = require("../utils/message");
const typedefs = require("../types/typedefs");
const WpwBaseTaskPlugin = require("./basetask");
const { join, posix, relative, resolve, extname, sep } = require("path");
const { relativePath, existsAsync, findFiles, findExPath, forwardSlash } = require("../utils");
const { isBoolean, pick, isObject, apply, asArray, isPrimitive } = require("@spmeesseman/type-utils");
const { existsSync } = require("fs");


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
	static create = (build) => WpwJsDocPlugin.wrap(this, build, "jsdoc", [[ "mode", "plugin" ], this.validateJsDocInstalled ]);


	/**
	 * @param {typedefs.WebpackCompilationAssets} assets
	 * @returns {Promise<void>}
	 */
	async buildJsDocs(assets)
	{
        const build = this.build,
              logger = build.logger,
              config = this.buildOptions,
              outDir = this.buildPathTemp,
              baseDir = build.getBasePath(),
              ctxDir =  build.getContextPath(),
              srcDir =  build.getSrcPath(),
              pathOptions = { psx: true, stat: true };

        const _addPathOption = (/** @type {string} */ option) =>
        {
            if (config[option])
            {
                const rPath = relativePath(baseDir, config[option], { psx: true, stat: true }) ;
                if (rPath) {
                    jsdocOptions.push(`--${option}`, `"${rPath}"`);
                }
                else {
                    build.addMessage({
                        code: WpwError.Code.ERROR_RESOURCE_MISSING,
                        message: `could not locate the jsdoc options path '${option}'`,
                        compilation: this.compilation
                    });
                }
            }
        };

		logger.write("create jsdoc documentation", 1);
		logger.value("   base directory", baseDir, 1);
		logger.value("   context directory", ctxDir, 1);
		logger.value("   input directory", srcDir, 1);
		logger.value("   output directory", outDir, 1);
		this.printCompilationDependencies();

        const jsdocOptions = [ "--destination", `"${outDir}"` ];

        if (isObject(config))
        {
            _addPathOption("configure");
            _addPathOption("package");
            _addPathOption("readme");
            _addPathOption("template");
            _addPathOption("tutorials");
            if (build.hasError) {
                return;
            }
            jsdocOptions.push("--recurse");
            const nonPathOpts = pick(config, "debug", "encoding", "private", "verbose");
            Object.entries(nonPathOpts).filter(([ _, v ]) => isPrimitive(v) && v !== false).forEach(([ k, v ]) =>
            {
                jsdocOptions.push(`--${k}` + (v !== true ? ` ${v}` : ""));
            });
        }

        if (!jsdocOptions.includes("--verbose") && build.logger.level >= 4) {
            jsdocOptions.push("--verbose");
        }

        if (!jsdocOptions.includes("--package")) {
            jsdocOptions.push("--package", `"${relativePath(baseDir, build.pkgJsonFilePath, pathOptions)}"`);
        }

        if (!jsdocOptions.includes("--readme"))
        {
            const path = await findExPath([
                join(ctxDir, "README.txt"),
                join(ctxDir, "README.md"),
                join(ctxDir, "README"),
                join(baseDir, "README.txt"),
                join(baseDir, ".README.md"),
                join(baseDir, "README"),
                join(baseDir, ".README")
            ]);
            if (path) {
                jsdocOptions.push("--readme", `"${relativePath(baseDir, path, pathOptions)}"`);
            }
        }

        if (!jsdocOptions.includes("--configure"))
        {
            const path = await findExPath([
                join(ctxDir, ".jsdoc.json"),
                join(ctxDir, "jsdoc.json"),
                join(baseDir, ".jsdoc.json"),
                join(baseDir, "jsdoc.json"),
                join(srcDir, ".jsdoc.json"),
                join(srcDir, "jsdoc.json")
            ]);
            if (path) {
                jsdocOptions.push("--configure", `"${relativePath(baseDir, path, pathOptions)}"`);
            }
        }

        if (jsdocOptions.length <= 2) // execute only if we found more options than '--destination',
        {                             // otherwise enter error state
            build.addMessage({
                code: WpwError.Code.ERROR_JSDOC_FAILED,
                message: "unable to create jsdoc execution options (0 options found)",
                compilation: this.compilation
            });
        }
        else {
            await this.executeJsDoc(jsdocOptions, assets);
        }
    }


    /**
     * @param {string[]} jsdocParams
	 * @param {typedefs.WebpackCompilationAssets} _assets
	 * @returns {Promise<void>}
	 */
    async executeJsDoc(jsdocParams, _assets)
    {
        let numFilesProcessed = 0;
        const build = this.build,
              logger = build.logger,
              outDir = this.buildPathTemp,
              // persistedCache = this.cache.get(),
              srcDir = build.getSrcPath({ rel: true, psx: true, dot: true, fallback: true });

        logger.write("   execute jsdoc", 2);
        logger.value("      cmd line", jsdocParams, 3);

        //
        // Execute jsdoc module
        //
        const code = await this.exec(`npx jsdoc ${jsdocParams.join(" ")} "${srcDir}"`, "jsdoc");
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
        logger.write("   process jsdoc output files", 2);
		const files = await findFiles("**/*.*", { cwd: outDir, absolute: true });
		for (const filePath of files)
		{
            // logger.value("      process asset", filePath, 3);
            const data = await readFile(filePath),
                  //
                  // the "--package" options creates 3 more dir levela deep for output path
                  // e.g. [diat]/@spmeesseman/webpack-wrap/0.0.1/....  remove from output emit path
                  //
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
                immutable: false, // true // newHash === persistedCache[filePathRel],
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

            if (extname(filePath) === ".html")
            {
                const relPath = filePathRel.replace(".html", "").replace("_", sep),
                      sourceFile = resolve(build.getSrcPath(), relPath);
                if (await existsAsync(sourceFile))
                {
                    this.compilation.buildDependencies.add(sourceFile);
                    info.sourceFilename = forwardSlash(relPath);
                    logger.value("      add build dependency", info.sourceFilename, 3);
                }
            }

            //logger.value("      emit asset", filePathRel, 3);
            this.compilation.emitAsset(filePathRel, source, info);
            ++numFilesProcessed;
		}
        logger.write(`   processed ${numFilesProcessed} jsdoc output files`, 2);
    }

    /*
    async getSnapshot()
    {
        const assets = [],
              compiler = this.compiler,
              compilation = this.compilation,
              templateResult = options.templateContent ? { mainCompilationHash: compilation.hash } :
                               childCompilerPlugin.getCompilationEntryResult(options.template);

        if ('error' in templateResult) {
            compilation.errors.push(prettyError(templateResult.error, compiler.context).toString());
        }

        // If the child compilation was not executed during a previous main compile run
        // it is a cached result
        const isCompilationCached = templateResult.mainCompilationHash !== compilation.hash;

        // The public path used inside the html file
        const htmlPublicPath = getPublicPath(compilation, options.filename, options.publicPath);
        const compilationHash = compilation.hash;
        const entryPointPublicPathMap = {};
        const extensionRegexp = /\.(css|js|mjs)(\?|$)/;
        for (let i = 0; i < entryNames.length; i++)
        {
          const entryName = entryNames[i];
            // entryPointUnfilteredFiles - also includes hot module update files
            const entryPointUnfilteredFiles = compilation.entrypoints.get(entryName)?.getFiles();

            const entryPointFiles = entryPointUnfilteredFiles?.filter((chunkFile) => {
                const asset = compilation.getAsset(chunkFile);
                if (!asset) {
                    return true;
                }
                // Prevent hot-module files from being included:
                const assetMetaInformation = asset.info || {};
                return !(assetMetaInformation.hotModuleReplacement || assetMetaInformation.development);
            });

            // Prepend the publicPath and append the hash depending on the
            // webpack.output.publicPath and hashOptions
            // E.g. bundle.js -> /bundle.js?hash
            const entryPointPublicPaths = entryPointFiles?.map(chunkFile =>
            {
                const entryPointPublicPath = publicPath + urlencodePath(chunkFile);
                return options.hash
                    ? appendHash(entryPointPublicPath, compilationHash)
                    : entryPointPublicPath;
            });

            entryPointPublicPaths?.forEach((entryPointPublicPath) => {
                const extMatch = extensionRegexp.exec(entryPointPublicPath);
                // Skip if the public path is not a .css, .mjs or .js file
                if (!extMatch) {
                return;
                }
                // Skip if this file is already known
                // (e.g. because of common chunk optimizations)
                if (entryPointPublicPathMap[entryPointPublicPath]) {
                return;
                }
                entryPointPublicPathMap[entryPointPublicPath] = true;
                assets.push(entryPointPublicPath);
            });
        }

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
