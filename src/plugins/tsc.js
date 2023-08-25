/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/types.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const dts = require("dts-bundle");
const { existsSync, unlinkSync } = require("fs");
const WpBuildPlugin = require("./base");
const { findFiles, isString, isArray, WpBuildError } = require("../utils");
const { WebpackError } = require("webpack");
const typedefs = require("../types/typedefs");
const { access, readFile } = require("fs/promises");
const { relative, dirname, join, basename, resolve } = require("path");


/**
 * @class WpBuildBaseTsPlugin
 * @abstract
 */
class WpBuildBaseTsPlugin extends WpBuildPlugin
{
	/**
	 * @function
	 * @protected
	 * @param {typedefs.WebpackCompilationAssets} assets
	 */
	bundleDts = (assets) =>
	{
		const l = this.app.logger,
			  typesDirSrc = this.app.getSrcPath({ stat: true }),
			  typesDirDist = this.app.getDistPath({ stat: true });

		l.write("start bundle dts", 1);
		l.value("   types source directory", typesDirSrc, 2);

		if (!this.global.typesBundled && typesDirSrc && typesDirDist)
		{
			const typesDistPathRel = this.app.getDistPath({ rel: true });

			Object.entries(assets).filter(([ file, _ ]) => this.isEntryAsset(file)).forEach(([ file, _ ]) =>
			{
				const asset = this.compilation.getAsset(file);
				if (asset) {
					asset.info.tsbundle = true;
				}
			});

			const outputFile = this.app.build.name + ".d.ts",
				  outputPath = join(typesDirDist, outputFile);
			if (existsSync(outputPath)) {
				unlinkSync(outputPath);
			}
			// let entryFile = Object.valuthis.app.wpc.entryes().map(
			// 	/** @type {typedefs.WpBuildWebpackEntryValue} */(v) => resolve(typesDirDist, !isString(v) ? v.import : v)
			// )[0]?.replace(".ts", ".d.ts");
			const entry = this.app.wpc.entry[this.app.build.name];
			let entryFile = resolve(typesDirDist, isString(entry) ? entry : (entry.import ? entry.import : (entry[0] ?? "")));
			if (!entryFile ||!existsSync(entryFile))
			{
				entryFile = join(typesDirDist, "index.d.ts");
				if (!existsSync(entryFile)) {
					entryFile = join(typesDirDist, "types.d.ts");
					if (!existsSync(entryFile)) {
						const mainBuild = this.app.getAppBuild("module");
						if (mainBuild) {
							entryFile = join(typesDirDist, mainBuild.name + ".d.ts");
						}
					}
				}
			}
			if (existsSync(entryFile))
			{
				l.value("  using tsconfig file", entryFile, 2);
				/** @type {typedefs.WpBuildDtsBundleOptions} */
				const bundleCfg = {
					name: `${this.app.pkgJson.name}-${this.app.build.name}`,
					baseDir: typesDistPathRel,
					headerPath: "",
					headerText: "",
					main: join(typesDistPathRel, basename(entryFile)),
					out: outputFile,
					outputAsModuleFolder: true,
					// removeSource: true,
					verbose: this.app.build.log.level === 5
				};
				try {
					dts.bundle(bundleCfg);
					this.global.typesBundled = true;
					this.compilation.buildDependencies.add(join(typesDirDist, bundleCfg.out));
					// this.compilation.compilationDependencies.add();this.compilation.
					// this.compilation.contextDependencies.add();
					l.write("   dts bundle created successfully @ " + join(bundleCfg.baseDir, bundleCfg.out), 1);
				}
				catch (e) {
					this.handleError(e, "call to dts-bundle package falied");
				}
			}
			else {
				l.warning("   types entry file could not be located, dts bundling skipped");
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
	 * @function Executes a typescript build using the specified tsconfig
	 * @protected
	 * @param {typedefs.WpwRcSourceCodeConfig} tsc
	 * @param {string[]} args
	 * @param {number} identifier Unique group identifier to associate with the file path
	 * @param {string} outputDir Output directory of build
	 * @param {boolean} [alias] Write alias paths with ``
	 * @throws {WpBuildError}
	 */
	execTsBuild = async (tsc, args, identifier, outputDir, alias) =>
	{
		if (!tsc.path) {
			this.handleError(new WpBuildError("Invalid source code configured path", "plugins/tsc.js"));
			return;
		}
		// const babel = [
		// 	"npx", "babel", tsConfig, "--out-dir", outputDir, "--extensions", ".ts",
		// 	"--presets=@babel/preset-env,@babel/preset-typescript",
		// ];
		const logger = this.app.logger;
		let command = `npx tsc ${args.join(" ")}`;
		logger.write(`   execute typescript build @ italic(${tsc.path})`, 1);

		let code = await this.exec(command, "tsc");
		if (code !== 0)
		{
			this.compilation.errors.push(new WebpackError("typescript build failed for " + tsc.path));
			return;
		}
		//
		// Ensure target directory exists
		//
		try {
			await access(outputDir);
		}
		catch (e) {
			this.handleError(new WebpackError("typescript build failed for " + tsc.path), "output directory doesn't exist");
			return;
		}
		//
		// Run `tsc-alias` for path aliasing if specified.
		//
		if (alias)
		{   //
			// Note that `tsc-alias` requires a filename e.g. tsconfig.json in it's path argument
			//
			command = `tsc-alias -p ${tsc.path}`;
			code = await this.exec(command, "typescript path aliasing");
			if (code !== 0)
			{
				this.compilation.errors.push(new WebpackError("typescript path aliasing failed for " + tsc.path));
				return;
			}
		}
		//
		// Process output files
		//
		const files = await findFiles("**/*.js", { cwd: outputDir, absolute: true });
		for (const filePath of files)
		{
			// let data, source, hash, newHash, cacheEntry, persistedCache;
			const filePathRel = relative(this.compiler.outputPath, filePath);

		// 	logger.value("   process test suite output file", filePathRel, 3);
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

		const info = /** @type {typedefs.WebpackAssetInfo} */({
			// contenthash: newHash,
			development: true,
			immutable: true, // newHash === persistedCache[filePathRel],
			javascriptModule: false,
			types: true
		});
		this.compilation.buildDependencies.add(filePathRel);
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

		logger.write(`   finished execution of typescript build @ italic(${tsc.path})`, 3);
	};

}


module.exports = WpBuildBaseTsPlugin;
