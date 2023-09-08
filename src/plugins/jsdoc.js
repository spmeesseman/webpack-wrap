/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/types.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const WpBuilPlugin = require("./base");
const { join, posix } = require("path");
const typedefs = require("../types/typedefs");
const { isBoolean, pick, isObject, relativePath, apply, asArray } = require("../utils");


/**
 * @extends WpBuilPlugin
 */
class WpwJsDocPlugin extends WpBuilPlugin
{
    /** @type {typedefs.WpwBuildOptionsConfig<"jsdoc">} @private */
    buildOptions;


    /**
     * @param {typedefs.WpwPluginOptions} options Plugin options to be applied
     */
	constructor(options)
	{
		super(options);
        this.buildOptions = /** @type {typedefs.WpwBuildOptionsConfig<"jsdoc">} */(this.app.build.options.jsdoc);
	}


    /**
     * Called by webpack runtime to initialize this plugin
     * @override
     * @param {typedefs.WebpackCompiler} compiler the compiler instance
     */
    apply(compiler)
    {
        this.onApply(compiler,
        {
            generateJsDocs: {
                async: true,
                hook: "compilation",
                stage: "REPORT",
                hookCompilation: "processAssets",
                statsProperty: "jsdoc",
                callback: this.generateJsDocs.bind(this)
            }
        });
    }

	/**
	 * @param {typedefs.WebpackCompilationAssets} compilationAssets
	 * @returns {Promise<void>}
	 */
	generateJsDocs = async (compilationAssets) =>
	{
        const webpack = this.compiler.webpack,
              compilation = this.compilation,
              assets = [],
              entryNames = asArray(compilation.entrypoints.keys()),
              // filteredEntryNames = filterChunks(entryNames, options.chunks, options.excludeChunks),
              // sortedEntryNames = sortEntryChunks(filteredEntryNames, options.chunksSortMode, compilation),
              logger = this.app.logger,
              options = this.app.build.options.jsdoc,
              currentAssets = Object.entries(assets).filter(([ file ]) => this.isEntryAsset(file)),
              outDir = isBoolean(options) ? join(this.app.build.paths.dist, "doc") :
                            this.buildOptions.destination ||
                            join(this.app.build.paths.dist, "doc") ;

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
            apply(jsdocOptions, {
                ...pick(options, "debug", "encoding", "private", "readme", "package", "configure", "template", "tutorials", "verbose")
            });
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
        }

//         if (!(await existsAsync(outDir)))
//         {
//             await this.rebuildJsDoc(jsdocOptions, compilationAssets);
//             return;
//         }
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
// 		logger.write(`   finished execution of jsdoc build @ italic(${relative(this.app.build.paths.base, outDir)})`, 3);
// 	};
//
//
//     /**
//      * @param {string[]} jsdocParams
// 	 * @param {typedefs.WebpackCompilationAssets} compilationAssets
// 	 * @returns {Promise<void>}
// 	 */
//     rebuildJsDoc = async (jsdocParams, compilationAssets) =>
//     {
//         const webpack = this.compiler.webpack,
//               compilation = this.compilation,
//               assets = [],
//               entryNames = Array.from(compilation.entrypoints.keys()),
//               // filteredEntryNames = filterChunks(entryNames, options.chunks, options.excludeChunks),
//               // sortedEntryNames = sortEntryChunks(filteredEntryNames, options.chunksSortMode, compilation),
//               identifier = this.name,
//               logger = this.app.logger,
//               options = this.app.build.options.jsdoc,
//               srcDir = this.app.getSrcPath({ build: "module", rel: true, psx: true, dot: true}),
//               outDir = isBoolean(options) ? join(this.app.build.paths.dist, "doc") :
//                             /** @type {typedefs.WpwBuildOptionsJsDocItem} */(options).destination ||
//                             join(this.app.build.paths.dist, "doc") ;
//
//         const code = await this.exec(`npx jsdoc ${jsdocParams.join(" ")} --recurse "${srcDir}"`, "jsdoc");
//         if (code !== 0)
//         {
//             this.compilation.errors.push(new WpwError("jsdoc build failed with exit code " + code, "plugins/jsdoc.js"));
//             return;
//         }
//
// 		//
// 		// Ensure output directory exists
// 		//
// 		if (!(await existsAsync(outDir))) {
// 			this.handleError("jsdoc build failed - output directory doesn't exist", e);
// 			return;
// 		}
//
//         const isCacheValidPromise = this.isCacheValid(previousFileSystemSnapshot, mainCompilation);
//
//         let cachedResult = childCompilationResultPromise;
//         childCompilationResultPromise = isCacheValidPromise.then((isCacheValid) => {
//             // Reuse cache
//             if (isCacheValid) {
//             return cachedResult;
//             }
//             // Start the compilation
//             const compiledEntriesPromise = this.compileEntries(
//             mainCompilation,
//             this.compilationState.entries
//             );
//             // Update snapshot as soon as we know the filedependencies
//             // this might possibly cause bugs if files were changed inbetween
//             // compilation start and snapshot creation
//             compiledEntriesPromise.then((childCompilationResult) => {
//             return fileWatcherApi.createSnapshot(childCompilationResult.dependencies, mainCompilation, compilationStartTime);
//             }).then((snapshot) => {
//             previousFileSystemSnapshot = snapshot;
//             });
//             return compiledEntriesPromise;
//         });
//
//         //
//         // Remove dummy entry points
//         //
//         // this.compilation.entrypoints.forEach(e => { if (e.name) this.compilation.deleteAsset(e.name); });
// 		//
// 		// Process output files
// 		//
// 		const files = await findFiles("**/*.{html,css,js}", { cwd: outDir, absolute: true });
// 		for (const filePath of files)
// 		{
// 			let data, /** @type {typedefs.WebpackSource | undefined} */source, hash, newHash, cacheEntry, persistedCache;
// 			const filePathRel = relative(outDir, filePath);
//
//             logger.value("   process jsdoc output files", filePathRel, 3);
//             logger.write("      check compilation cache for snapshot", 4);
//             try {
//                 persistedCache = this.cache.get();
//                 cacheEntry = await this.wpCacheCompilation.getPromise(`${filePath}|${identifier}`, null);
//             }
//             catch (e) {
//                 this.handleError("failed while checking cache", e);
//                 return;
//             }
//
//             if (cacheEntry)
//             {
//                 let isValidSnapshot;
//                 logger.write("      check snapshot valid", 4);
//                 try {
//                     isValidSnapshot = await this.checkSnapshotValid(cacheEntry.snapshot);
//                 }
//                 catch (e) {
//                     this.handleError("failed while checking snapshot", e);
//                     return;
//                 }
//                 if (isValidSnapshot)
//                 {
//                     logger.write("      snapshot is valid", 4);
//                     ({ hash, source } = cacheEntry);
//                     data = data || await readFile(filePath);
//                     newHash = newHash || this.getContentHash(data);
//                     if (newHash === hash)
//                     {
//                         logger.write("      asset is unchanged since last snapshot", 4);
//                     }
//                     else {
//                         logger.write("      asset has changed since last snapshot", 4);
//                     }
//                 }
//                 else {
//                     logger.write("      snapshot is invalid", 4);
//                 }
//             }
//
//             if (!source)
//             {
//                 let snapshot;
//                 const startTime = Date.now();
//                 data = data || await readFile(filePath);
//                 source = new this.compiler.webpack.sources.RawSource(data);
//                 logger.write("      create snapshot", 4);
//                 try {
//                     snapshot = await this.createSnapshot(startTime, filePath);
//                 }
//                 catch (e) {
//                     this.handleError("failed while creating snapshot for " + filePathRel, e);
//                     return;
//                 }
//                 if (snapshot)
//                 {
//                     logger.write("      cache snapshot", 4);
//                     try {
//                         newHash = newHash || this.getContentHash(source.buffer());
//                         snapshot.setFileHashes(hash);
//                         await this.wpCacheCompilation.storePromise(`${filePath}|${identifier}`, null, { source, snapshot, hash });
//                         cacheEntry = await this.wpCacheCompilation.getPromise(`${filePath}|${identifier}`, null);
//                     }
//                     catch (e) {
//                         this.handleError("failed while caching snapshot " + filePathRel, e);
//                         return;
//                     }
//                 }
//             }
//
//             data = data || await readFile(filePath);
//             newHash = newHash || this.getContentHash(data);
//             if (newHash === persistedCache[filePathRel])
//             {
//                 logger.write("      asset is unchanged", 4);
//             }
//             else {
//                 logger.write("      asset has changed, update hash in persistent cache", 4);
//                 persistedCache[filePathRel] = newHash;
//                 this.cache.set(persistedCache);
//             }
//
//             const info = /** @type {typedefs.WebpackAssetInfo} */({
//                 // contenthash: newHash,
//                 immutable: true, // newHash === persistedCache[filePathRel],
//                 javascriptModule: false,
//                 jsdoc: true
//             });
//             // this.compilation.buildDependencies.add(filePathRel);
//             // this.compilation.buildDependencies.add(filePath);
// 		    // this.compilation.compilationDependencies.add();
// 		    // this.compilation.contextDependencies.add();
//
//             this.compilation.fileDependencies.add(filePath);
//
//             assets[filePathRel] = source;
//
//             // const cache = this.compiler.getCache(`${this.app.build.name}_${this.app.build.type}_${this.app.wpc.target}`.toLowerCase());
//
//             // this.compilation.emitAsset(filePathRel, source, info);
//
//             // this.compilation.additionalChunkAssets.push(filePathRel);
//
//             const existingAsset = this.compilation.getAsset(filePathRel);
//             if (!existingAsset)
//             {
//                 logger.write("      emit asset", 3);
//                 this.compilation.emitAsset(filePathRel, source, info);
//             }
//             else {
//                 logger.write("      asset compared for emit", 3);
//                 // this.compilation.buildDependencies.add(filePath);
//                 // this.compilation.comparedForEmitAssets.add(filePath);
//                 // this.compilation.compilationDependencies.add(filePath);
//                 this.compilation.comparedForEmitAssets.add(filePath);
//                 // this.compilation.updateAsset(filePathRel, source, info);
//           }
// 		}
    };


    validateJsDocInstalled = () =>
    {
        return true;
    };

}


/**
 * @param { typedefs.WpBuildApp} app The current build's rc wrapper @see {@link typedefs.WpBuildApp WpBuildApp}
 * @returns {WpwJsDocPlugin | undefined}
 */
const jsdoc = (app) =>
    app.build.options.jsdoc &&
    app.build.options.jsdoc.enabled !== false &&
    app.build.options.jsdoc.type === "plugin" ? new WpwJsDocPlugin({ app }) : undefined;


module.exports = jsdoc;
