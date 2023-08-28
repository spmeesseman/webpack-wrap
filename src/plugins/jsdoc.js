/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/types.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 */

const WpBuilPlugin = require("./base");
const typedefs = require("../types/typedefs");
const { existsSync } = require("fs");
const { resolve, join, relative } = require("path");
const { isString, WpBuildError, findFiles } = require("../utils");
const { access, readFile } = require("fs/promises");


/**
 * @extends WpBuilPlugin
 */
class WpwJsDocPlugin extends WpBuilPlugin
{
    /**
     * @param {typedefs.WpBuildPluginOptions} options Plugin options to be applied
     */
	constructor(options) { super(options); }


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
                stage: "ADDITIONAL",
                hookCompilation: "processAssets",
                statsProperty: "jsdoc",
                callback: this.generateJsDocs.bind(this)
            }
        });
    }

	/**
	 * @param {typedefs.WebpackCompilationAssets} assets
	 * @returns {Promise<void>}
	 */
	generateJsDocs = async (assets) =>
	{
        const identifier = this.name,
              logger = this.app.logger,
              currentAssets = Object.entries(assets).filter(([ file ]) => this.isEntryAsset(file)),
              outDir = this.app.build.options.jsdoc?.outDir || join(this.app.build.paths.dist, "doc");

		logger.write("create jsdoc documentation", 1);
		logger.value("   output directory", outDir, 1);
        logger.value("   # of current entry assets processed", currentAssets.length, 2);
		this.printCompilationDependencies();

		const code = await this.exec(`npx jsdoc -d "${outDir}" -r ./src`, "jsdoc");
		if (code !== 0)
		{
			this.compilation.errors.push(new WpBuildError("jsdoc build failed with exit code " + code, "plugins/jsdoc.js"));
			return;
		}
		//
		// Ensure target directory exists
		//
		try {
			await access(outDir);
		}
		catch (e) {
			this.handleError(new WpBuildError("jsdoc build failed - output directory doesn't exist", "plugins/jsdoc.js", outDir));
			return;
		}
		//
		// Process output files
		//
		const files = await findFiles("**/*.{html,css,js}", { cwd: outDir, absolute: true });
		for (const filePath of files)
		{
			let data, source, hash, newHash, cacheEntry, persistedCache;
			const filePathRel = relative(outDir, filePath);

            logger.value("   process jsdoc output files", filePathRel, 3);
            logger.write("      check compilation cache for snapshot", 4);
            try {
                persistedCache = this.cache.get();
                cacheEntry = await this.wpCacheCompilation.getPromise(`${filePath}|${identifier}`, null);
            }
            catch (e) {
                this.handleError(e, "failed while checking cache");
                return;
            }

            if (cacheEntry)
            {
                let isValidSnapshot;
                logger.write("      check snapshot valid", 4);
                try {
                    isValidSnapshot = await this.checkSnapshotValid(cacheEntry.snapshot);
                }
                catch (e) {
                    this.handleError(e, "failed while checking snapshot");
                    return;
                }
                if (isValidSnapshot)
                {
                    logger.write("      snapshot is valid", 4);
                    ({ hash, source } = cacheEntry);
                    data = data || await readFile(filePath);
                    newHash = newHash || this.getContentHash(data);
                    if (newHash === hash)
                    {
                        logger.write("      asset is unchanged since last snapshot", 4);
                    }
                    else {
                        logger.write("      asset has changed since last snapshot", 4);
                    }
                }
                else {
                    logger.write("      snapshot is invalid", 4);
                }
            }

            if (!source)
            {
                let snapshot;
                const startTime = Date.now();
                data = data || await readFile(filePath);
                source = new this.compiler.webpack.sources.RawSource(data);
                logger.write("      create snapshot", 4);
                try {
                    snapshot = await this.createSnapshot(startTime, filePath);
                }
                catch (e) {
                    this.handleError(e, "failed while creating snapshot for " + filePathRel);
                    return;
                }
                if (snapshot)
                {
                    logger.write("      cache snapshot", 4);
                    try {
                        newHash = newHash || this.getContentHash(source.buffer());
                        snapshot.setFileHashes(hash);
                        await this.wpCacheCompilation.storePromise(`${filePath}|${identifier}`, null, { source, snapshot, hash });
                        cacheEntry = await this.wpCacheCompilation.getPromise(`${filePath}|${identifier}`, null);
                    }
                    catch (e) {
                        this.handleError(e, "failed while caching snapshot " + filePathRel);
                        return;
                    }
                }
            }

            data = data || await readFile(filePath);
            newHash = newHash || this.getContentHash(data);
            if (newHash === persistedCache[filePathRel])
            {
                logger.write("      asset is unchanged", 4);
            }
            else {
                logger.write("      asset has changed, update hash in persistent cache", 4);
                persistedCache[filePathRel] = newHash;
                this.cache.set(persistedCache);
            }

            const info = /** @type {typedefs.WebpackAssetInfo} */({
                // contenthash: newHash,
                immutable: true, // newHash === persistedCache[filePathRel],
                javascriptModule: false,
                jsdoc: true
            });
            // this.compilation.buildDependencies.add(filePathRel);
            this.compilation.buildDependencies.add(filePath);
		    // this.compilation.compilationDependencies.add();
		    // this.compilation.contextDependencies.add();

		    // const cache = this.compiler.getCache(`${this.app.build.name}_${this.app.build.type}_${this.app.wpc.target}`.toLowerCase());

		    this.compilation.emitAsset(filePathRel, source, info);

            // this.compilation.additionalChunkAssets.push(filePathRel);

            const existingAsset = this.compilation.getAsset(filePathRel);
            if (!existingAsset)
            {
                logger.write("      emit asset", 3);
                this.compilation.emitAsset(filePathRel, source, info);
            }
            else if (this.options.force)
            {
                logger.write("      update asset", 3);
                this.compilation.updateAsset(filePathRel, source, info);
            }
            else {
                logger.write("      asset compared for emit", 3);
                this.compilation.buildDependencies.add(filePathRel);
                this.compilation.comparedForEmitAssets.add(filePathRel);
                this.compilation.compilationDependencies.add(filePathRel);
            }
		}

		logger.write(`   finished execution of jsdoc build @ italic(${relative(this.app.build.paths.base, outDir)})`, 3);
	};


    validateJsDocInstalled = () =>
    {
        return true;
    };

}


/**
 * @param {typedefs.WpBuildApp} app
 * @returns {WpwJsDocPlugin | undefined}
 */
const jsdoc = (app) => app.build.options.jsdoc ? new WpwJsDocPlugin({ app }) : undefined;


module.exports = jsdoc;
