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
    constructor(options) { super(options); }


	/**
     * @override
     */
	static create = WpwDisposePlugin.wrap.bind(this);


    /**
     * @override
     * @returns {typedefs.WpwPluginTapOptions}
     */
    onApply()
    {
        return {
            buildCleanupAndShutdown: {
                // hook: "shutdown",
                forceRun: true,
                hook: "compilation",
                hookCompilation: "processWarnings",
                callback: this.dispose.bind(this)
            }
        };
    }


    dispose()
    {
        this.logger.write("build complete, perform shutdown stage cleanup", 2);
        let tmpPath = join(this.build.getTempPath(), this.build.name);
		if (existsSync(tmpPath)) {
            this.logger.write("delete temporary directories,", 3);
			rmSync(tmpPath, { recursive: true, force: true });
		}
        tmpPath = dirname(tmpPath);
        this.logger.write("delete temporary files,", 3);
        if (findFilesSync("*", { cwd: tmpPath }).length === 0) {
            rmSync(tmpPath, { recursive: true, force: true });
        }
        this.logger.write("release build disposables", 3);
        this.build.dispose();
    }
}


module.exports = WpwDisposePlugin.create;
