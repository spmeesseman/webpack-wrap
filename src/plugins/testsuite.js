/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/testsuite.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

 const WpwPlugin = require("./base");
const { existsSync } = require("fs");
const WpwError = require("../utils/message");
const typedefs = require("../types/typedefs");
const { unlink, access } = require("fs/promises");
const { relativePath, resolvePath } = require("../utils");
const { join, dirname, isAbsolute, resolve, relative } = require("path");


/**
 * @extends WpwPlugin
 */
class WpwTestSuitePlugin extends WpwPlugin
{
    /**
     * @param {typedefs.WpwPluginOptions} options Plugin options to be applied
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
			buildTestsSuite: {
				async: true,
                hook: "afterCompile",
                // hook: "compilation",
				// stage: "ADDITIONAL",
				statsProperty: "tests",
                callback: this.testsuite.bind(this)
            }
        });
    }


	/**
	 * Executes a typescript build using the specified tsconfig
	 * @private
	 * @param {typedefs.WpwSourceTsConfigFile} configFile
	 * @param {string[]} args
	 * @param {string} outputDir Output directory of build
	 * @param {boolean} [alias] Write alias paths with ``
	 * @returns {Promise<number | null>}
	 * @throws {typedefs.WpwError}
	 */
	async execTsBuild(configFile, args, outputDir, alias)
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
			  baseBuildDir = this.build.getBasePath(),
			  configFilePathRel = relativePath(this.build.getBasePath(), configFile.path),
			  outputDirAbs = resolvePath(baseBuildDir, outputDir);

		let command = `npx tsc -p ./${configFilePathRel} ${args.join(" ")}`;
		logger.write(`   execute tsc command [ config file @ ${configFile.path}]`, 1);
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
			await access(outputDirAbs);
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
		// const files = await findFiles("**/*.{js,d.ts}", { cwd: outputDir, absolute: true });
		// for (const filePath of files)
		// {
		// 	// let data, source, hash, newHash, cacheEntry, persistedCache;
		// 	const filePathRel = relativePath(outputDir, filePath);
		// 	logger.value("   process types output file", filePathRel, 4);
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
		// logger.write("      add to compilation file dependencies", 5);
		// this.compilation.fileDependencies.add(filePath);
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
		// }

		logger.write("   finished execution of tsc command", 3);
		return 0;
	}


	/**
	 * @private
	 * @param {typedefs.WebpackCompilation} compilation
	 */
	async testsuite(compilation)
	{
		this.build.logger.write("build test suite", 1);
		this.onCompilation(compilation);

		const testsDir = join(this.build.getDistPath(), "test");

		if (!this.build.source.config || !this.build.source.configFile.path)
		{
			const eMsg = "Could not locate tsconfig file for tests suite - must be **/tests?/tsconfig.* or **/tsconfig.tests?.json";
			this.build.addMessage({ code: WpwError.Msg.ERROR_GENERAL, compilation: this.compilation, message: eMsg });
			this.logger.warning("consider possible solutions:");
			this.logger.warning("   (1) rename test suite config file according to convention");
			this.logger.warning("   (2) disable testsuite plugin in italic(.wsbuildrc.plugins.testsuite)");
			return;
		}

		this.build.logger.value("   using tsconfig file", this.build.source.configFile.path, 2);

		if (!existsSync(testsDir) && this.build.source.configFile.dir)
		{
			this.build.logger.write("   checking for tsbuildinfo file path", 3);
			let buildInfoFile = this.build.source.config.compilerOptions.tsBuildInfoFile || join(dirname(this.build.source.configFile.dir), "tsconfig.tsbuildinfo");
			if (!isAbsolute(buildInfoFile)) {
				buildInfoFile = resolve(this.build.source.configFile.dir, buildInfoFile);
			}
			this.build.logger.value("   delete tsbuildinfo file", buildInfoFile, 3);
			try {
				await unlink(buildInfoFile);
			} catch {}
		}

		const relTsConfigPath = relative(this.build.getBasePath(), this.build.source.configFile.path);
		await this.execTsBuild(this.build.source.configFile, [ "-p", relTsConfigPath ], testsDir);
	}

}


/**
 * @param {typedefs.WpwBuild} build
 * @returns {WpwTestSuitePlugin | undefined}
 */
const testsuite = (build) => build.options.testsuite ? new WpwTestSuitePlugin({ build }) : undefined;


module.exports = testsuite;
