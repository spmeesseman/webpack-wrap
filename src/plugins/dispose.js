/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/dispose.js
 * @version 0.0.1
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const WpwPlugin = require("./base");
const { join, dirname } = require("path");
const { existsSync, rmSync } = require("fs");
const typedefs = require("../types/typedefs");
const { findFilesSync } = require("../utils");


/**
 * @extends WpwPlugin
 */
class WpwDisposePlugin extends WpwPlugin
{
    /**
     * @param {typedefs.IWpwBaseModuleOptions} options
     */
    constructor(options)
    {
        super(options);
    }


    /**
     * @override
     * @returns {typedefs.WpwPluginTapOptions}
     */
    onApply()
    {
        return {
            buildCleanupOnShutdown: {
                hook: "shutdown",
                forceRun: true,
                // hook: "compilation",
                // hookCompilation: "processWarnings",
                callback: this.dispose.bind(this)
            }
        };
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
        this.build.dispose();
    }
}


/**
 * @param {typedefs.WpwBuild} build
 * @returns {WpwDisposePlugin}
 */
const dispose = (build) => new WpwDisposePlugin({ build });


module.exports = dispose;
