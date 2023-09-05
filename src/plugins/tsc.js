/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/types.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const dts = require("dts-bundle");
const { existsSync } = require("fs");
const WpwPlugin = require("./base");
const { WebpackError } = require("webpack");
const typedefs = require("../types/typedefs");
const { access, unlink, readFile } = require("fs/promises");
const { relative, join, resolve } = require("path");
const { findFiles, isString, WpBuildError, relativePath } = require("../utils");


/**
 * @abstract
 * @extends WpwPlugin
 */
class WpBuildBaseTsPlugin extends WpwPlugin
{
    /**
     * @param {typedefs.WpwPluginOptions} options Plugin options to be applied
     */
	constructor(options) { super(options); }


	/**
	 * @protected
	 * @param {typedefs.WebpackCompilationAssets} assets
	 */
	bundleDts = async (assets) =>
	{
		const l = this.app.logger,
			  typesDirSrc = this.app.getSrcPath({ stat: true }),
			  typesDirDist = this.app.getDistPath({ stat: true });

		l.write("start bundle dts", 1);
		l.value("   types source directory", typesDirSrc, 2);
		l.value("   types output directory", typesDirDist, 2);

		if (!this.global.typesBundled && typesDirSrc && typesDirDist)
		{
			const typesDistPathRel = this.app.getDistPath({ rel: true });

			Object.entries(assets).filter(([ file, _ ]) => this.isEntryAsset(file)).forEach(([ file, _ ]) =>
			{
				const asset = this.compilation.getAsset(file);
				if (asset) {
					asset.info.tsbundle = true;
					l.value("   asset tagged for bundling", asset.name, 3);
				}
			});

			const outputFile = this.app.build.name + ".d.ts",
				  outputPath = join(typesDirDist, outputFile),
				  outputFilePath = join(outputPath, outputFile),
				  outputFilePathRel = relativePath(this.compiler.context, outputFile);
			if (existsSync(outputPath)) {
				l.write("   clean/remove prior bundle output @ " + outputPath, 2);
				await unlink(outputPath);
			}
			// let entryFile = Object.valuthis.app.wpc.entryes().map(
			// 	/** @type {typedefs.WpwWebpackEntryValue} */(v) => resolve(typesDirDist, !isString(v) ? v.import : v)
			// )[0]?.replace(".ts", ".d.ts");

			l.write("   locating entry file", 2);
			const entry = this.app.wpc.entry[this.app.build.name] || this.app.wpc.entry.index;
			let entryFile = resolve(typesDirDist, isString(entry) ? entry : (entry.import ? entry.import : (entry[0] ?? "")));
			if (!entryFile ||!existsSync(entryFile))
			{
				entryFile = join(typesDirDist, "index.d.ts");
				if (!existsSync(entryFile))
				{
					entryFile = join(typesDirDist, "types.d.ts");
					if (!existsSync(entryFile))
					{
						const mainBuild = this.app.getAppBuild("module");
						if (mainBuild) {
							entryFile = join(typesDirDist, mainBuild.name + ".d.ts");
						}
					}
					if (!existsSync(entryFile))
					{
						l.write("   entry file not found in output directory, scanning sub-directories", 2);
						entryFile = (await findFiles("**/index.d.ts", { maxDepth: 2, cwd: typesDirDist }))[0];
						if (!entryFile || !existsSync(resolve(typesDirDist, entryFile)))
						{
							entryFile = (await findFiles("**/types.d.ts", { maxDepth: 2, cwd: typesDirDist }))[0];
							if (!entryFile || !existsSync(resolve(typesDirDist, entryFile)))
							{
								const mainBuild = this.app.getAppBuild("module");
								if (mainBuild) {
									entryFile = await findFiles(`**/${mainBuild.name}.d.ts`, { maxDepth: 2, cwd: typesDirDist })[0];
								}
							}
						}
					}
				}
			}

			if (entryFile && existsSync(entryFile))
			{
				l.value("   using main entry file", entryFile, 2);
				/** @type {typedefs.WpBuildDtsBundleOptions} */
				const bundleCfg = {
					name: `${this.app.pkgJson.name}-${this.app.build.name}`,
					baseDir: typesDistPathRel,
					headerPath: "",
					headerText: "",
					main: join(typesDistPathRel, relative(typesDirDist, entryFile)),
					out: outputFile,
					outputAsModuleFolder: true,
					// removeSource: true,
					verbose: this.app.build.log.level === 5
				};
				try {
					dts.bundle(bundleCfg);
					this.global.typesBundled = true;
					// this.compilation.fileDependencies.clear();
					const info = /** @type {typedefs.WebpackAssetInfo} */({
						// contenthash: newHash,
						immutable: true, // newHash === persistedCache[filePathRel],
						javascriptModule: false,
						dts: true
					});
					const data = await readFile(outputFilePath),
						  source = new this.compiler.webpack.sources.RawSource(data);
					this.compilation.fileDependencies.add(join(typesDirDist, outputFile));
					this.compilation.emitAsset(outputFilePathRel, source, info);
					//
					// Remove js file produced by webpack bundler, by default there's no way to load source
					// code without specifying an entry point that will in the end produce a js bundle, which,
					// of course, is what Web[packis for and does.  In the case of building declarations/types
					// though, it doesnt really fit "module" definition as defined by Webpack.
					//
					// entryFile = join(typesDirDist, basename(entryFile).replace(".d.ts", ".js"));
					// if (existsSync(entryFile)) {
					// 	await unlink(entryFile);
					// }
					// this.compilation.compilationDependencies.add();this.compilation.
					// this.compilation.contextDependencies.add();
					l.write("   dts bundle created successfully @ " + join(bundleCfg.baseDir, outputFile), 1);
				}
				catch (e) {
					this.handleError(e, "call to dts-bundle package failed");
				}
			}
			else {
				l.warning(`   types entry file '${entryFile}' could not be located - dts bundling skipped`);
			}
		}
		else if (!typesDirDist) {
			l.warning("   types output directory doesn't exist, dts bundling skipped");
		}
		else if (!typesDirSrc) {
			l.warning("   types source directory doesn't exist, dts bundling skipped");
		}
		else {
			l.write("   dts bundling skipped", 1);
		}
	};


	/**
	 * Executes a typescript build using the specified tsconfig
	 * @protected
	 * @param {typedefs.WpwSourceCodeConfig} sourceCodeConfig
	 * @param {string[]} args
	 * @param {number} identifier Unique group identifier to associate with the file path
	 * @param {string} outputDir Output directory of build
	 * @param {boolean} [alias] Write alias paths with ``
	 * @throws {WpBuildError}
	 */
	execTsBuild = async (sourceCodeConfig, args, identifier, outputDir, alias) =>
	{
		if (!sourceCodeConfig || !sourceCodeConfig.path) {
			this.handleError(new WpBuildError("Invalid source code configured path", "plugins/tsc.js"));
			return;
		}
		// const babel = [
		// 	"npx", "babel", tsConfig, "--out-dir", outputDir, "--extensions", ".ts",
		// 	"--presets=@babel/preset-env,@babel/preset-typescript",
		// ];
		const logger = this.app.logger,
			  relativeOutputPath = relativePath(this.app.build.paths.base, sourceCodeConfig.path);

		let command = `npx tsc -p ./${relativeOutputPath} ${args.join(" ")}`;
		logger.write(`   execute tsc command using config file @ [${sourceCodeConfig.path}]`, 1);
		logger.write("      command: " + command.slice(4), 2);

		let code = await this.exec(command, "tsc");
		if (code !== 0)
		{
			this.handleError("tsc command failed", "plugins/tsc.js", "using config file @ " + sourceCodeConfig.path);
			return;
		}
		//
		// Ensure target directory exists
		//
		try {
			await access(outputDir);
		}
		catch (e) {
			this.handleError("tsc command failed", "plugins/tsc.js", "output directory doesn't exist");
			return;
		}
		//
		// Run `tsc-alias` for path aliasing if specified.
		//
		if (alias)
		{   //
			// Note that `tsc-alias` requires a filename e.g. tsconfig.json in it's path argument
			//
			command = `tsc-alias -p ${sourceCodeConfig.path}`;
			code = await this.exec(command, "typescript path aliasing");
			if (code !== 0)
			{
				this.handleError("tsc command failed", "plugins/tsc.js", "path aliasing faile");
				return;
			}
		}
		//
		// Process output files
		//
		const files = await findFiles("**/*.{js,d.ts}", { cwd: outputDir, absolute: true });
		for (const filePath of files)
		{
			// let data, source, hash, newHash, cacheEntry, persistedCache;
			const filePathRel = relative(outputDir, filePath);
logger.value("   process types output file", filePathRel, 1);
			logger.value("   process types output file", filePathRel, 4);
		// 	logger.write("      check compilation cache for snapshot", 4);
		// 	try {
		// 		persistedCache = this.cache.get();
		// 		cacheEntry = await this.wpCacheCompilation.getPromise(`${filePath}|${identifier}`, null);
		// 	}
		// 	catch (e) {
		// 		this.handleError(e, "failed while checking cache");
		// 		return;
		// 	}

		// 	if (cacheEntry)
		// 	{
		// 		let isValidSnapshot;
		// 		logger.write("      check snapshot valid", 4);
		// 		try {
		// 			isValidSnapshot = await this.checkSnapshotValid(cacheEntry.snapshot);
		// 		}
		// 		catch (e) {
		// 			this.handleError(e, "failed while checking snapshot");
		// 			return;
		// 		}
		// 		if (isValidSnapshot)
		// 		{
		// 			logger.write("      snapshot is valid", 4);
		// 			({ hash, source } = cacheEntry);
		// 			data = data || await readFile(filePath);
		// 			newHash = newHash || this.getContentHash(data);
		// 			if (newHash === hash)
		// 			{
		// 				logger.write("      asset is unchanged since last snapshot", 4);
		// 			}
		// 			else {
		// 				logger.write("      asset has changed since last snapshot", 4);
		// 			}
		// 		}
		// 		else {
		// 			logger.write("      snapshot is invalid", 4);
		// 		}
		// 	}

		// 	if (!source)
		// 	{
		// 		let snapshot;
		// 		const startTime = Date.now();
		// 		data = data || await readFile(filePath);
		// 		source = new this.compiler.webpack.sources.RawSource(data);
		// 		logger.write("      create snapshot", 4);
		// 		try {
		// 			snapshot = await this.createSnapshot(startTime, filePath);
		// 		}
		// 		catch (e) {
		// 			this.handleError(e, "failed while creating snapshot for " + filePathRel);
		// 			return;
		// 		}
		// 		if (snapshot)
		// 		{
		// 			logger.write("      cache snapshot", 4);
		// 			try {
		// 				newHash = newHash || this.getContentHash(source.buffer());
		// 				snapshot.setFileHashes(hash);
		// 				await this.wpCacheCompilation.storePromise(`${filePath}|${identifier}`, null, { source, snapshot, hash });
		// 				cacheEntry = await this.wpCacheCompilation.getPromise(`${filePath}|${identifier}`, null);
		// 			}
		// 			catch (e) {
		// 				this.handleError(e, "failed while caching snapshot " + filePathRel);
		// 				return;
		// 			}
		// 		}
		// 	}

		// 	data = data || await readFile(filePath);
		// 	newHash = newHash || this.getContentHash(data);
		// 	if (newHash === persistedCache[filePathRel])
		// 	{
		// 		logger.write("      asset is unchanged", 4);
		// 	}
		// 	else {
		// 		logger.write("      asset has changed, update hash in persistent cache", 4);
		// 		persistedCache[filePathRel] = newHash;
		// 		this.cache.set(persistedCache);
		// 	}

		// const info = /** @type {typedefs.WebpackAssetInfo} */({
		// 	// contenthash: newHash,
		// 	development: true,
		// 	immutable: true, // newHash === persistedCache[filePathRel],
		// 	javascriptModule: false,
		// 	types: true
		// });

		// logger.value("      add to compilation build dependencies", filePathRel, 5);
		// this.compilation.buildDependencies.add(filePathRel);
		logger.write("      add to compilation file dependencies", 5);
		this.compilation.fileDependencies.add(filePath);
		// this.compilation.compilationDependencies.add();this.compilation.
		// this.compilation.contextDependencies.add();

		// const cache = this.compiler.getCache(`${this.app.build.name}_${this.app.build.type}_${this.app.wpc.target}`.toLowerCase());

		// this.compilation.emitAsset(filePathRel, source, info);

		// 	// this.compilation.additionalChunkAssets.push(filePathRel);

		// 	const existingAsset = this.compilation.getAsset(filePathRel);
		// 	if (!existingAsset)
		// 	{
		// 		logger.write("      emit asset", 3);
		// 		this.compilation.emitAsset(filePathRel, source, info);
		// 	}
		// 	else if (this.options.force)
		// 	{
		// 		logger.write("      update asset", 3);
		// 		this.compilation.updateAsset(filePathRel, source, info);
		// 	}
		// 	else {
		// 		logger.write("      asset compared for emit", 3);
		// 		this.compilation.buildDependencies.add(filePathRel);
		// 		this.compilation.comparedForEmitAssets.add(filePathRel);
		// 		this.compilation.compilationDependencies.add(filePathRel);
		// 	}
		}

		logger.write("   finished execution of tsc command", 3);
	};

}


module.exports = WpBuildBaseTsPlugin;
