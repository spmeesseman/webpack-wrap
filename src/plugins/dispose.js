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
const { findFilesSync, findFiles, existsAsync } = require("../utils");
const { rm } = require("fs/promises");


/**
 * @extends WpwPlugin
 */
class WpwDisposePlugin extends WpwPlugin
{
    static buildDisposeCount = 0;


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
                async: true,
                hook: "shutdown",
                callback: this.dispose.bind(this)
            }
        };
    }


    async dispose()
    {
        console.log("0: " + this.build.name);
        this.logger.write("build complete, perform shutdown stage cleanup", 2);
        let tmpPath = join(this.build.getTempPath(), this.build.name);
		if (await existsAsync(tmpPath)) {
			await rm(tmpPath, { recursive: true, force: true });
		}
        tmpPath = dirname(tmpPath);
        if ((await findFiles("*", { cwd: tmpPath })).length === 0) {
            await rm(tmpPath, { recursive: true, force: true });
        }
        await this.build.dispose();
        console.log("1");
        console.log("this.build.buildCount: " + this.build.buildCount);
        if (++WpwDisposePlugin.buildDisposeCount === this.build.buildCount)
        {
            console.log("2");
            await this.build.wrapper.dispose();
            console.log("3");
        }
        console.log("4");
    }
}


/**
 * @param {typedefs.WpwBuild} build
 * @returns {WpwDisposePlugin}
 */
const dispose = (build) => new WpwDisposePlugin({ build });


module.exports = dispose;
