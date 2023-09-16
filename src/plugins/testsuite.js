/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/testsuite.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const { existsSync } = require("fs");
const WpwTscPlugin = require("./tsc");
const { unlink } = require("fs/promises");
const WpwBuild = require("../core/build");
const WpwError = require("../utils/message");
const typedefs = require("../types/typedefs");
const { join, dirname, isAbsolute, resolve, relative } = require("path");


/**
 * @extends WpwTscPlugin
 */
class WpwTestSuitePlugin extends WpwTscPlugin
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
		await this.execTsBuild(this.build.source.configFile, [ "-p", relTsConfigPath ], 2, testsDir);
	}

}


/**
 * @param {WpwBuild} build
 * @returns {WpwTestSuitePlugin | undefined}
 */
const testsuite = (build) => build.options.testsuite ? new WpwTestSuitePlugin({ build }) : undefined;


module.exports = testsuite;
