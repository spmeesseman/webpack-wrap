/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/types.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const { join } = require("path");
const dts = require("dts-bundle");
const WpwPlugin = require("./base");
const { existsSync } = require("fs");
const WpwError = require("../utils/message");
const typedefs = require("../types/typedefs");
const { access, unlink, readFile } = require("fs/promises");
const { findFiles, relativePath, resolvePath, existsAsync } = require("../utils");


/**
 * @abstract
 * @extends WpwPlugin
 */
class WpwTscPlugin extends WpwPlugin
{
    /**
	 * @protected
	 * @param {string} statsProperty
	 * @param {string | undefined} [outputDir] full path
	 */
	async bundleDts(statsProperty, outputDir)
	{

		if (this.global.typesBundled) {
			this.app.addInfo(WpwError.Msg.INFO_BUILD_SKIPPED_NON_FATAL, "dts bundling already completed");
			return;
		}

		const l = this.app.logger,
			  baseDir = this.app.getBasePath();
		l.start("bundle types .d.ts files", 1);
		l.value("   types output directory", outputDir, 2);

		if (!outputDir)
		{
			const compilerOptions = this.app.source.config.options.compilerOptions;
			outputDir = resolvePath(
				baseDir, compilerOptions.declarationDir ?? this.app.getDistPath({ rel: true, psx: true })
			);
			if (!(await existsAsync(outputDir)))
			{
				this.app.addError(WpwError.Msg.ERROR_NO_OUTPUT_DIR, this.compilation, "dts bundling failed");
				return;
			}
		}

		// const baseDir = this.app.getBasePath(),
		// 	  dtsFile = this.app.build.name + ".d.ts",
		// 	  dtsFilePathAbs = join(outputDir, dtsFile),
		// 	  dtsFilePathRel = relativePath(outputDir, dtsFilePathAbs).replace(/\\/g, "/"),
		// 	  dtsFilePathRelContext = relativePath(this.compiler.context, dtsFilePathAbs).replace(/\\/g, "/"),
		// 	  dtsFilePathRelBase = relativePath(baseDir, dtsFilePathAbs).replace(/\\/g, "/"),
		// 	  outputDirRelBase = relativePath(baseDir, outputDir),
		// 	  entryOptions = /** @type {typedefs.WebpackEntryOptions} */(this.compilation.entries.get(this.app.build.name)?.options);
		// 		// entryOptions2 = /** @type {typedefs.WebpackEntryOptions} */(this.compilation.entrypoints.get(this.app.build.name)?.options);
		// let entryName = /** @type {string} */(entryOptions.name),
		// 	entryFile = /** @type {string} */(this.compilation.getAsset(entryName)?.name),
		// 	entryFileAbs, entryFileRel, entryFileRelBase, entryFileRelContext;// entryName + "." + this.app.source.ext,

		// if (entryFile)
		// {
		// 	entryFileAbs = resolvePath(outputDir, entryFile);
		// 	entryFileRel = relativePath(outputDir, entryFileAbs);
		// 	entryFileRelContext = relativePath(this.compiler.context, entryFileAbs);
		// 	entryFileRelBase = relativePath(baseDir, entryFileAbs);
		// }

		// f (!entryFileAbs || !existsSync(entryFileAbs))
		//
		// 	const typesOptions = this.app.build.types;
		// 	if (typesOptions && typesOptions.enabled && typesOptions.entry)
		// 	{
		// 		entryName = this.fileNameStrip(typesOptions.entry, true);
		// 		entryFile = typesOptions.entry;
		// 		entryFileAbs = resolvePath(outputDir, entryFile);
		// 		entryFileRel = relativePath(outputDir, entryFileAbs);
		// 		entryFileRelBase = relativePath(baseDir, entryFileAbs);
		// 		entryFileRelContext = relativePath(this.compiler.context, entryFileAbs);
		// 	}

		// if (!entryFileRel || !entryFileRelBase || !entryFileAbs || !entryFileRelContext)
		// {
		// 	this.app.addError(WpwError.Msg.ERROR_TYPES_FAILED, this.compilation, "could not determine entry file");
		// 	return;
		// }

		// entryFile = entryFile.replace(/\\/g, "/");
		// entryFileRel = entryFileRel.replace(/\\/g, "/");
		// entryFileRelBase = entryFileRelBase.replace(/\\/g, "/");
		// entryFileRelContext = entryFileRelBase.replace(/\\/g, "/");

		// let dtsEntryFile = entryFile.replace(this.app.source.ext, "d.ts");
		// const rootDir = this.app.source.config.options.compilerOptions.rootDir;
		// if (rootDir && rootDir !== ".") {
		// 	dtsEntryFile = dtsEntryFile.replace(rootDir.replace(/\\/g, "/"), "").replace("//", "/").replace(/^\//, "");
		// }
		// const dtsEntryFileAbs = resolvePath(outputDir, dtsEntryFile),
		// 	  dtsEntryFileRel = relativePath(outputDir, dtsEntryFileAbs),
		// 	  dtsEntryFileRelContext = relativePath(this.compiler.context, dtsEntryFileAbs),
		// 	  dtsEntryFileRelBase = relativePath(baseDir, dtsEntryFileAbs);

		const dtsFile = this.app.build.name + ".d.ts",
			  dtsFilePathAbs = join(outputDir, dtsFile),
			  dtsFilePathRel = relativePath(outputDir, dtsFilePathAbs).replace(/\\/g, "/"),
			  dtsFilePathRelContext = relativePath(this.compiler.context, dtsFilePathAbs).replace(/\\/g, "/"),
			  dtsFilePathRelBase = relativePath(baseDir, dtsFilePathAbs).replace(/\\/g, "/"),
			  dtsBundleBaseDir = relativePath(baseDir, outputDir).replace(/\\/g, "/").replace(/\/$/, "");

		if (existsSync(dtsFilePathAbs))
		{
			l.write("   clean/remove prior bundle output @ " + dtsFilePathRelBase, 2);
			await unlink(dtsFilePathAbs);
		}

		/** @type {typedefs.WpBuildDtsBundleOptions} */
		const bundleCfg =
		{
			name: `${this.app.pkgJson.name}-${this.app.build.name}`.replace(/\//g, "-").replace(/@/g, ""),
			baseDir: dtsBundleBaseDir,
			headerPath: "",
			headerText: "",
			main: dtsBundleBaseDir + "/**/*.d.ts",
			out: dtsFile,
			outputAsModuleFolder: true,
			// removeSource: true,
			verbose: this.app.build.log.level >= 4
		};

		if (this.logger.level >= 2)
		{
			l.write("   output bundle path info:");
			l.value("      relative path (->dist)", dtsFilePathRel);
			l.value("      relative path (->context)", dtsFilePathRelContext);
			l.value("      relative path (->base)", dtsFilePathRelBase);
			l.value("      absolute path", dtsFilePathAbs);
			l.value("      base output path", outputDir);
			l.write("   dts-bundle options:");
			l.value("      name", bundleCfg.name);
			l.value("      out", bundleCfg.out);
			l.value("      main", bundleCfg.main);
			l.value("      base dir", bundleCfg.baseDir);
			l.value("      header text", bundleCfg.headerText);
			l.value("      header path", bundleCfg.headerPath);
			l.value("      output as module folder", bundleCfg.outputAsModuleFolder);
		}
			//
		try // Create bundle - using dts bundling library
		{	// TODO - Can typescript.program() bundle, using 'out' compilerOption?
			//
			dts.bundle(bundleCfg);
			this.global.typesBundled = true;
			//
			// Add .d.ts file as file dependencies
			//
			// this.compilation.fileDependencies.clear();
			const outputFiles = await findFiles("**/*.d.ts", { cwd: outputDir});
			outputFiles.forEach((f) => { this.compilation.fileDependencies.add(f); });
			//
			// Emit bundled file as compilation asset
			//
			const info = /** @type {typedefs.WebpackAssetInfo} */({
				// contenthash: newHash,
				immutable: false, // newHash === persistedCache[filePathRel],
				javascriptModule: false,
				[statsProperty]: true
			});
			const data = await readFile(dtsFilePathAbs),
				  source = new this.compiler.webpack.sources.RawSource(data);
			this.compilation.emitAsset(dtsFilePathRel, source, info);
			// this.compilation.fileDependencies.add(dtsFilePathAbs);
			l.write("   dts bundle created successfully @ " + dtsFilePathRelBase, 1);
		}
		catch (e) {
			this.app.addError(WpwError.Msg.ERROR_TYPES_FAILED_BUNDLE, this.compilation, e);
		}
	}


	/**
	 * Executes a typescript build using the specified tsconfig
	 * @protected
	 * @param {typedefs.WpwSourceCodeConfig} sourceCodeConfig
	 * @param {string[]} args
	 * @param {number} identifier Unique group identifier to associate with the file path
	 * @param {string} outputDir Output directory of build
	 * @param {boolean} [alias] Write alias paths with ``
	 * @throws {typedefs.WpwError}
	 */
	async execTsBuild(sourceCodeConfig, args, identifier, outputDir, alias)
	{
		if (!sourceCodeConfig || !sourceCodeConfig.path) {
			this.app.addError(WpwError.Msg.ERROR_TYPES_FAILED, this.compilation, "invalid source code configured path");
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
			this.app.addError(WpwError.Msg.ERROR_TYPES_FAILED, this.compilation, "tsc returned error code " + code);
			return;
		}
		//
		// Ensure target directory exists
		//
		try {
			await access(outputDir);
		}
		catch (e) {
			this.app.addError(WpwError.Msg.ERROR_TYPES_FAILED_NO_OUTPUT_DIR, this.compilation);
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
				this.app.addError(WpwError.Msg.ERROR_TYPES_FAILED, this.compilation, "typescript path aliasing failed");
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
			const filePathRel = relativePath(outputDir, filePath);
logger.value("   process types output file", filePathRel, 1);
			logger.value("   process types output file", filePathRel, 4);
		// 	logger.write("      check compilation cache for snapshot", 4);
		// 	try {
		// 		persistedCache = this.cache.get();
		// 		cacheEntry = await this.wpCacheCompilation.getPromise(`${filePath}|${identifier}`, null);
		// 	}
		// 	catch (e) {
		// 		this.handleError("failed while checking cache", e);
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
		// 			this.handleError("failed while checking snapshot", e);
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
		// 			this.handleError("failed while creating snapshot for " + filePathRel, e);
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
		// 				this.handleError("failed while caching snapshot " + filePathRel, e);
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
	}

}


module.exports = WpwTscPlugin;
