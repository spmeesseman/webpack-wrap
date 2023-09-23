/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/types.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const { readFile } = require("fs/promises");
const WpwError = require("../utils/message");
const typedefs = require("../types/typedefs");
const WpwBaseTaskPlugin = require("./basetask");
const { join, posix, relative } = require("path");
const { relativePath, existsAsync, findFiles } = require("../utils");
const { isBoolean, pick, isObject, apply, asArray, isPrimitive } = require("@spmeesseman/type-utils");


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
		super(apply({ taskHandler: "generateJsDocs" }, options));
        this.buildOptions = /** @type {typedefs.WpwBuildOptionsConfig<"jsdoc">} */(this.buildOptions); // reset for typings
	}


	/**
	 * @param {typedefs.WebpackCompilationAssets} compilationAssets
	 * @returns {Promise<void>}
	 */
	async generateJsDocs(compilationAssets)
	{
        const // webpack = this.compiler.webpack,
              compilation = this.compilation,
              assets = [],
              entryNames = asArray(compilation.entrypoints.keys()),
              // filteredEntryNames = filterChunks(entryNames, options.chunks, options.excludeChunks),
              // sortedEntryNames = sortEntryChunks(filteredEntryNames, options.chunksSortMode, compilation),
              logger = this.build.logger,
              options = this.buildOptions,
              currentAssets = Object.entries(assets).filter(([ file ]) => this.isEntryAsset(file)),
              outDir = isBoolean(options) ? join(this.build.paths.dist, "doc") :
                                            this.buildOptions.destination ||
                                            join(this.build.paths.dist, "doc") ;

		logger.write("create jsdoc documentation", 1);
		logger.value("   output directory", outDir, 1);
        logger.value("   # of current entry assets processed", currentAssets.length, 2);
		this.printCompilationDependencies();

        if (!compilation.entrypoints) {
            return;
        }

        const jsdocOptions = [ "--destination", `"${outDir}"` ];

        if (isObject(options) && !isBoolean(options))
        {
            if (options.readme) {
                jsdocOptions.push("--readme", `"${posix.normalize(relativePath(outDir, options.readme))}"`);
            }
            if (options.package) {
                jsdocOptions.push("--package", `"${posix.normalize(relativePath(outDir, options.package))}"`);
            }
            if (options.configure) {
                jsdocOptions.push("--configure", `"${posix.normalize(relativePath(outDir, options.configure))}"`);
            }
            if (options.template) {
                jsdocOptions.push("--template", `"${posix.normalize(relativePath(outDir, options.template))}"`);
            }
            if (options.tutorials) {
                jsdocOptions.push("--tutorials", `"${posix.normalize(relativePath(outDir, options.tutorials))}"`);
            }
            if (options.tutorials) {
                jsdocOptions.push("--tutorials", `"${posix.normalize(relativePath(outDir, options.tutorials))}"`);
            }
            const nonPathOpts = pick(options, "debug", "encoding", "private", "verbose");
            Object.entries(nonPathOpts).filter(([ _, v ]) => isPrimitive(v) && v !== false).forEach(([ k, v ]) =>
            {
                jsdocOptions.push(`--${k}` + (v !== true ? ` ${v}` : ""));
            });
        }

        if (!(await existsAsync(outDir)))
        {
            await this.buildJsDoc(jsdocOptions, compilationAssets);
            return;
        }
    }
//
//         const templateResult = options.templateContent ? { mainCompilationHash: compilation.hash } :
//                                childCompilerPlugin.getCompilationEntryResult(options.template);
//
//         if ('error' in templateResult) {
//             compilation.errors.push(prettyError(templateResult.error, compiler.context).toString());
//         }
//
//         // If the child compilation was not executed during a previous main compile run
//         // it is a cached result
//         const isCompilationCached = templateResult.mainCompilationHash !== compilation.hash;
//
//         /** The public path used inside the html file */
//         const htmlPublicPath = getPublicPath(compilation, options.filename, options.publicPath);
//         const compilationHash = compilation.hash;
//         const entryPointPublicPathMap = {};
//         const extensionRegexp = /\.(css|js|mjs)(\?|$)/;
//         for (let i = 0; i < entryNames.length; i++)
//         {
//           const entryName = entryNames[i];
//             /** entryPointUnfilteredFiles - also includes hot module update files */
//             const entryPointUnfilteredFiles = compilation.entrypoints.get(entryName)?.getFiles();
//
//             const entryPointFiles = entryPointUnfilteredFiles?.filter((chunkFile) => {
//                 const asset = compilation.getAsset(chunkFile);
//                 if (!asset) {
//                     return true;
//                 }
//                 // Prevent hot-module files from being included:
//                 const assetMetaInformation = asset.info || {};
//                 return !(assetMetaInformation.hotModuleReplacement || assetMetaInformation.development);
//             });
//
//             // Prepend the publicPath and append the hash depending on the
//             // webpack.output.publicPath and hashOptions
//             // E.g. bundle.js -> /bundle.js?hash
//             const entryPointPublicPaths = entryPointFiles?.map(chunkFile =>
//             {
//                 const entryPointPublicPath = publicPath + urlencodePath(chunkFile);
//                 return options.hash
//                     ? appendHash(entryPointPublicPath, compilationHash)
//                     : entryPointPublicPath;
//             });
//
//             entryPointPublicPaths?.forEach((entryPointPublicPath) => {
//                 const extMatch = extensionRegexp.exec(entryPointPublicPath);
//                 // Skip if the public path is not a .css, .mjs or .js file
//                 if (!extMatch) {
//                 return;
//                 }
//                 // Skip if this file is already known
//                 // (e.g. because of common chunk optimizations)
//                 if (entryPointPublicPathMap[entryPointPublicPath]) {
//                 return;
//                 }
//                 entryPointPublicPathMap[entryPointPublicPath] = true;
//                 assets.push(entryPointPublicPath);
//             });
//         }
//
//         const newAssetJson = JSON.stringify(assets);
//         if (isCompilationCached && options.cache && assetJson === newAssetJson)
//         {
//                 previousEmittedAssets.forEach(({ name, html }) => {
//                 compilation.emitAsset(name, new webpack.sources.RawSource(html, false));
//             });
//             return;
//         }
//         else {
//             previousEmittedAssets = [];
//             assetJson = newAssetJson;
//         }
//
//         const filename = options.filename.replace(/\[templatehash([^\]]*)\]/g, require('util').deprecate(
//         (match, options) => `[contenthash${options}]`,
//         '[templatehash] is now [contenthash]')
//         );
//         const replacedFilename = replacePlaceholdersInFilename(filename, html, compilation);
//         // Add the evaluated html code to the webpack assets
//         compilation.emitAsset(replacedFilename.path, new webpack.sources.RawSource(html, false), replacedFilename.info);
//         previousEmittedAssets.push({ name: replacedFilename.path, html });
//         return replacedFilename.path;
//
// 		logger.write(`   finished execution of jsdoc build @ italic(${relative(this.build.paths.base, outDir)})`, 3);
// 	};
//
//
    /**
     * @param {string[]} jsdocParams
	 * @param {typedefs.WebpackCompilationAssets} compilationAssets
	 * @returns {Promise<void>}
	 */
    async buildJsDoc(jsdocParams, compilationAssets)
    {
        const build = this.build,
              // webpack = this.compiler.webpack,
              // compilation = this.compilation,
              // assets = [],
              // entryNames = Array.from(compilation.entrypoints.keys()),
              // filteredEntryNames = filterChunks(entryNames, options.chunks, options.excludeChunks),
              // sortedEntryNames = sortEntryChunks(filteredEntryNames, options.chunksSortMode, compilation),
              // identifier = this.name,
              logger = build.logger,
              srcDir = build.getSrcPath({ rel: true, psx: true, dot: true, fallback: true }),
              // distDir = this.buildOptions.destination || join(build.getDistPath()),
              outDir = this.buildPathTemp;

        const code = await this.exec(`npx jsdoc ${jsdocParams.join(" ")} --recurse "${srcDir}"`, "jsdoc");
        if (code !== 0)
        {
            build.addMessage({
                code: WpwError.Code.ERROR_JSDOC_FAILED,
                compilation: this.compilation ,
                message: "jsdoc command exited with error code " + code
            });
            return;
        }

        //
        // Ensure output directory exists
        //
        if (!(await existsAsync(outDir)))
        {
            build.addMessage({
                code: WpwError.Code.ERROR_NO_OUTPUT_DIR,
                compilation: this.compilation ,
                message: "jsdoc build failed - output directory doesn't exist"
            });
            return;
        }

		//
		// Process output files
		//
        // const persistedCache = this.cache.get();
		const files = await findFiles("**/*.{html,css,js}", { cwd: outDir, absolute: true });
		for (const filePath of files)
		{
            const data = await readFile(filePath),
                  filePathRel = relative(outDir, filePath),
                  source = new this.compiler.webpack.sources.RawSource(data);

            const info = /** @type {typedefs.WebpackAssetInfo} */({
                // contenthash: this.getContentHash(data),
                immutable: false, // newHash === persistedCache[filePathRel],
                javascriptModule: false,
                jsdoc: true
            });
            logger.value("      emit asset", filePathRel, 3);
            this.compilation.emitAsset(filePathRel, source, info);

			// let /** @type {typedefs.WebpackSource | undefined} */source, hash, cacheEntry;
			// const filePathRel = relative(outDir, filePath);

            // logger.value("   process jsdoc output files", filePathRel, 3);
            // logger.write("      check compilation cache for snapshot", 4);
            // try {
            //     cacheEntry = await this.wpCacheCompilation.getPromise(`${filePath}|${identifier}`, null);
            // }
            // catch (e)
            // {   this.build.addMessage({
            //         error: e,
            //         compilation: this.compilation ,
            //         code: WpwError.Code.ERROR_JSDOC_FAILED,
            //         message: "jsdoc build failed - failed while checking cache"
            //     });
            //     return;
            // }
            // const result = await this.checkSnapshot(filePath, "__", outDir); // , data);
            // const data = result.source?.buffer() || await readFile(filePath);
            // const newHash = this.getContentHash(data);
            // if (newHash === persistedCache[filePathRel])
            // {
            //     logger.write("      asset is unchanged", 4);
            // }
            // else {
            //     logger.write("      asset has changed, update hash in persistent cache", 4);
            //     persistedCache[filePathRel] = newHash;
            //     this.cache.set(persistedCache);
            // }
            // const info = /** @type {typedefs.WebpackAssetInfo} */({
            //     // contenthash: newHash,
            //     immutable: true, // newHash === persistedCache[filePathRel],
            //     javascriptModule: false,
            //     jsdoc: true
            // });
            // this.compilation.buildDependencies.add(filePathRel);
            // this.compilation.buildDependencies.add(filePath);
		    // this.compilation.compilationDependencies.add();
		    // this.compilation.contextDependencies.add();

            // this.compilation.fileDependencies.add(filePath);

            // assets[filePathRel] = source;

            // const cache = this.compiler.getCache(`${this.build.name}_${this.build.type}_${this.build.wpc.target}`.toLowerCase());

            // this.compilation.emitAsset(filePathRel, source, info);

            // this.compilation.additionalChunkAssets.push(filePathRel);

            // const existingAsset = this.compilation.getAsset(filePathRel);
            // if (!existingAsset)
            // {
            //     logger.write("      emit asset", 3);
            //     this.compilation.emitAsset(filePathRel, source, info);
            // }
            // else {
            //     logger.write("      asset compared for emit", 3);
            //     // this.compilation.buildDependencies.add(filePath);
            //     // this.compilation.comparedForEmitAssets.add(filePath);
            //     // this.compilation.compilationDependencies.add(filePath);
            //     this.compilation.comparedForEmitAssets.add(filePath);
            //     // this.compilation.updateAsset(filePathRel, source, info);
            // }
		}
    };


    validateJsDocInstalled = () =>
    {
        return true;
    };

}


/**
 * @param { typedefs.WpwBuild} build The current build's rc wrapper @see {@link typedefs.WpwBuild WpwBuild}
 * @returns {WpwJsDocPlugin | undefined}
 */
const jsdoc = (build) =>
    build.options.jsdoc &&
    build.options.jsdoc.enabled !== false &&
    build.options.jsdoc.mode === "plugin" ? new WpwJsDocPlugin({ build }) : undefined;


module.exports = jsdoc;
