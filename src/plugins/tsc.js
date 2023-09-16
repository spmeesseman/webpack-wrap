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
const { findFiles, relativePath, resolvePath, existsAsync, isString, isDirectory } = require("../utils");


/**
 * @abstract
 * @extends WpwPlugin
 */
class WpwTscPlugin extends WpwPlugin
{
    /** @type {typedefs.WpwBuildOptionsConfig<"types">} @protected */
    typesBuildOptions;


    /**
     * @param {typedefs.WpwPluginOptions} options Plugin options to be applied
     */
	constructor(options)
	{
		super(options);
        this.typesBuildOptions = /** @type {typedefs.WpwBuildOptionsConfig<"types">} */(this.build.options.types);
	}


    /**
	 * @protected
	 * @param {string} statsProperty
	 * @param {string | undefined} [outputDir] full path
	 */
	async dtsBundle(statsProperty, outputDir)
	{
		if (this.global.typesBundled) {
			this.build.addMessage({ code: WpwError.Msg.INFO_BUILD_SKIPPED_NON_FATAL, message: "dts bundling already completed" });
			return;
		}

		const l = this.build.logger,
			  baseBuildDir = this.build.getBasePath(),
			  bundleOptions = /** @type {typedefs.IWpwPluginConfigTypesBundle} */(this.typesBuildOptions.bundle);
		l.start("bundle types .d.ts files", 1);
		l.value("   types output directory", outputDir, 2);

		if (!outputDir)
		{
			const compilerOptions = this.build.source.config.compilerOptions;
			outputDir = resolvePath(
				baseBuildDir, compilerOptions.declarationDir ?? this.build.getDistPath({ rel: true, psx: true })
			);
			if (!(await existsAsync(outputDir)))
			{
				this.build.addMessage({ code: WpwError.Msg.ERROR_NO_OUTPUT_DIR, compilation: this.compilation, message: "dts bundling failed" });
				return;
			}
		}

		const name = bundleOptions.name || `${this.build.pkgJson.name}-${this.build.name}`.replace(/\//g, "-").replace(/@/g, ""),
			out = bundleOptions.out || this.build.name + ".d.ts",
			dtsFilePathAbs = join(outputDir, out),
			dtsFilePathRel = relativePath(outputDir, dtsFilePathAbs).replace(/\\/g, "/"),
			dtsFilePathRelContext = relativePath(this.compiler.context, dtsFilePathAbs).replace(/\\/g, "/"),
			dtsFilePathRelBase = relativePath(baseBuildDir, dtsFilePathAbs).replace(/\\/g, "/"),
			dtsBundleBaseDir = relativePath(baseBuildDir, outputDir).replace(/\\/g, "/").replace(/\/$/, ""),
			baseDir = bundleOptions.baseDir || dtsBundleBaseDir;

		let main = dtsBundleBaseDir + "/**/*.d.ts";
		if (isString(bundleOptions.main))
		{
			let cfgMain = bundleOptions.main;
			if (bundleOptions.main === "entry")
			{
				cfgMain = this.getDtsEntryFile(outputDir);
			}
			if (await existsAsync(resolvePath(baseBuildDir, cfgMain)))
			{
				main = cfgMain;
				if (bundleOptions.main !== "entry" && isDirectory(main)) {
					main = join(main, "**/*.d.ts");
				}
			}
		}

		if (existsSync(dtsFilePathAbs))
		{
			l.write("   clean/remove prior bundle output @ " + dtsFilePathRelBase, 2);
			await unlink(dtsFilePathAbs);
		}

		/** @type {typedefs.WpwPluginConfigTypesBundle} */
		const bundleCfg =
		{
			out, main, name, baseDir,
			headerPath: bundleOptions.headerPath || "",
			headerText: bundleOptions.headerText || "",
			outputAsModuleFolder: bundleOptions.outputAsModuleFolder !== undefined ? bundleOptions.outputAsModuleFolder : true,
			removeSource: !!bundleOptions.removeSource,
			verbose: this.build.log.level >= 4 || !!bundleOptions.verbose
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
			l.value("      output file", bundleCfg.out);
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
			const outputFiles = await findFiles("**/*.d.ts", { cwd: outputDir, absolute: true });
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
			this.build.addMessage({
				code: WpwError.Msg.ERROR_TYPES_FAILED,
				compilation: this.compilation,
				error: e,
				message: "types build: failed to create bundle"
			});
		}
	}


	/**
	 * Executes a typescript build using the specified tsconfig
	 * @protected
	 * @param {typedefs.WpwSourceTsConfigFile} configFile
	 * @param {string[]} args
	 * @param {number} identifier Unique group identifier to associate with the file path
	 * @param {string} outputDir Output directory of build
	 * @param {boolean} [alias] Write alias paths with ``
	 * @returns {Promise<number | null>}
	 * @throws {typedefs.WpwError}
	 */
	async execTsBuild(configFile, args, identifier, outputDir, alias)
	{
		if (!configFile || !configFile.path) {
			this.build.addMessage({
				code: WpwError.Msg.ERROR_TYPES_FAILED,
				compilation: this.compilation,
				message: "invalid source code configured path"
			});
			return -1;
		}
		// const babel = [
		// 	"npx", "babel", tsConfig, "--out-dir", outputDir, "--extensions", ".ts",
		// 	"--presets=@babel/preset-env,@babel/preset-typescript",
		// ];
		const logger = this.build.logger,
			  relativeOutputPath = relativePath(this.build.paths.base, configFile.path);

		let command = `npx tsc -p ./${relativeOutputPath} ${args.join(" ")}`;
		logger.write(`   execute tsc command using config file @ [${configFile.path}]`, 1);
		logger.write("      command: " + command.slice(4), 2);

		let result = await this.exec(command, "tsc");
		if (result !== 0)
		{
			this.build.addMessage({
				code: WpwError.Msg.ERROR_TYPES_FAILED,
				compilation: this.compilation,
				message: "tsc returned error code " + result
			});
			return result;
		}
		//
		// Ensure target directory exists
		//
		try {
			await access(outputDir);
		}
		catch (e) {
			this.build.addMessage({
				code: WpwError.Msg.ERROR_TYPES_FAILED,
				compilation: this.compilation,
				message: "output directory does not exist"
			});
			return -2;
		}
		//
		// Run `tsc-alias` for path aliasing if specified.
		//
		if (alias)
		{   //
			// Note that `tsc-alias` requires a filename e.g. tsconfig.json in it's path argument
			//
			command = `tsc-alias -p ${configFile.path}`;
			result = await this.exec(command, "typescript path aliasing");
			if (result !== 0)
			{
				this.build.addMessage({
					code: WpwError.Msg.ERROR_TYPES_FAILED,
					compilation: this.compilation,
					message: "typescript path aliasing failed, returned exit code " + result
				});
				return result;
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

		// const cache = this.compiler.getCache(`${this.build.name}_${this.build.type}_${this.build.wpc.target}`.toLowerCase());

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
		return 0;
	}


	/**
	 * @protected
	 * @param {string} outputDir full path
	 * @returns {string}
	 */
	getDtsEntryFile(outputDir)
	{
		const baseDir = this.build.getBasePath();
		const entryOptions = /** @type {typedefs.WebpackEntryOptions} */(this.compilation.entries.get(this.build.name)?.options);
		// 		// entryOptions2 = /** @type {typedefs.WebpackEntryOptions} */(this.compilation.entrypoints.get(this.build.name)?.options);
		const entryName = /** @type {string} */(entryOptions.name);
		let entryFile = /** @type {string} */(this.compilation.getAsset(entryName)?.name); // ,
			// entryFileAbs; // , entryFileRel, entryFileRelBase, entryFileRelContext;// entryName + "." + this.build.source.ext,
		if (entryFile)
		{
			// entryFileAbs = resolvePath(outputDir, entryFile).replace(/\\/g, "/");
			// entryFileRel = relativePath(outputDir, entryFileAbs).replace(/\\/g, "/");
			// entryFileRelBase = relativePath(baseDir, entryFileAbs).replace(/\\/g, "/");
			// entryFileRelContext = relativePath(this.compiler.context, entryFileAbs).replace(/\\/g, "/");
			entryFile = resolvePath(outputDir, entryFile).replace(/\\/g, "/");
		}
		let dtsEntryFile = entryFile.replace(this.build.source.ext, "d.ts");
		const rootDir = this.build.source.config.compilerOptions.rootDir;
		if (rootDir && rootDir !== ".") {
			dtsEntryFile = dtsEntryFile.replace(rootDir.replace(/\\/g, "/"), "").replace("//", "/").replace(/^\//, "");
		}
		const dtsEntryFileAbs = resolvePath(outputDir, dtsEntryFile),
			  // dtsEntryFileRel = relativePath(outputDir, dtsEntryFileAbs),
			  // dtsEntryFileRelContext = relativePath(this.compiler.context, dtsEntryFileAbs),
			  dtsEntryFileRelBase = relativePath(baseDir, dtsEntryFileAbs);
		return dtsEntryFileRelBase;
	}

}


module.exports = WpwTscPlugin;
