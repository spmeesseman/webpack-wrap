/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/dispose.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const WpwPlugin = require("./base");
const typedefs = require("../types/typedefs");
const { existsSync, rmSync } = require("fs");
const { join, dirname } = require("path");
const { findFilesSync } = require("../utils");


/**
 * @extends WpwPlugin
 */
class WpwDisposePlugin extends WpwPlugin
{
    /**
     * Called by webpack runtime to initialize this plugin
     * @override
     * @param {typedefs.WebpackCompiler} compiler the compiler instance
     */
    apply(compiler)
    {
        this.onApply(compiler,
        {
            buildCleanupOnShutdown: {
                async: true,
                hook: "shutdown",
                callback: this.dispose.bind(this)
            }
        });
    }

    dispose()
    {
        this.logger.write("build complete, perform shutdown stage cleanup", 2);
        let tmpPath = join(this.build.getTempPath(), this.build.name);
		if (existsSync(tmpPath)) {
			rmSync(tmpPath, { recursive: true, force: true });
		}
        tmpPath = dirname(tmpPath);
        if (findFilesSync("*", { cwd: tmpPath }).length === 0) {
            rmSync(tmpPath, { recursive: true, force: true });
        }
        return this.build.dispose();
    }
}


/**
 * @param {typedefs.WpwBuild} build
 * @returns {WpwDisposePlugin}
 */
const dispose = (build) => new WpwDisposePlugin({ build });


module.exports = dispose;
