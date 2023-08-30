/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/testsuite.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 */

const { existsSync } = require("fs");
const { unlink } = require("fs/promises");
const { WebpackError } = require("webpack");
const WpBuildBaseTsPlugin = require("./tsc");
const { join, dirname, isAbsolute, resolve, relative } = require("path");;

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */
/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WebpackCompilation} WebpackCompilation */
/** @typedef {import("../types").WpBuildPluginOptions} WpBuildPluginOptions */


/**
 * @extends WpBuildBaseTsPlugin
 */
class WpBuildTestSuitePlugin extends WpBuildBaseTsPlugin
{
    /**
     * @param {WpBuildPluginOptions} options Plugin options to be applied
     */
	constructor(options) { super(options); }


    /**
     * Called by webpack runtime to initialize this plugin
     * @override
     * @param {WebpackCompiler} compiler the compiler instance
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
	 * @param {WebpackCompilation} compilation
	 */
	async testsuite(compilation)
	{
		this.app.logger.write("build test suite", 1);
		this.onCompilation(compilation);

		const testsDir = join(this.app.getDistPath(), "test");

		if (!this.app.source.config.options || !this.app.source.config.path)
		{
			const eMsg = "Could not locate tsconfig file for tests suite - must be **/tests?/tsconfig.* or **/tsconfig.tests?.json";
			this.handleError(new WebpackError(eMsg));
			this.logger.warning("consider possible solutions:");
			this.logger.warning("   (1) rename test suite config file according to convention");
			this.logger.warning("   (2) disable testsuite plugin in italic(.wsbuildrc.plugins.testsuite)");
			return;
		}

		this.app.logger.value("   using tsconfig file", this.app.source.config.path, 2);

		if (!existsSync(testsDir) && this.app.source.config.dir)
		{
			this.app.logger.write("   checking for tsbuildinfo file path", 3);
			let buildInfoFile = this.app.source.config.options.compilerOptions.tsBuildInfoFile || join(dirname(this.app.source.config.dir), "tsconfig.tsbuildinfo");
			if (!isAbsolute(buildInfoFile)) {
				buildInfoFile = resolve(this.app.source.config.dir, buildInfoFile);
			}
			this.app.logger.value("   delete tsbuildinfo file", buildInfoFile, 3);
			try {
				await unlink(buildInfoFile);
			} catch {}
		}

		const relTsConfigPath = relative(this.app.getBasePath(), this.app.source.config.path);
		await this.execTsBuild(this.app.source.config, [ "-p", relTsConfigPath ], 2, testsDir);
	}

}


/**
 * @param {WpBuildApp} app
 * @returns {WpBuildTestSuitePlugin | undefined}
 */
const testsuite = (app) => app.build.options.testsuite ? new WpBuildTestSuitePlugin({ app }) : undefined;


module.exports = testsuite;
