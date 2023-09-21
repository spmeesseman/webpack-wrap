/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/licensefiles.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const { join } = require("path");
const { existsSync } = require("fs");
const WpwPlugin = require("./base");
const typedefs = require("../types/typedefs");
const { rename, unlink, readdir } = require("fs/promises");


/**
 * @extends WpwPlugin
 */
class WpwLicenseFilesPlugin extends WpwPlugin
{
    /**
     * Called by webpack runtime to initialize this plugin
     * @override
     * @param {typedefs.WebpackCompiler} compiler the compiler instance
     * @returns {void}
     */
    apply(compiler)
    {
        this.onApply(compiler,
        {
            processLicenseFiles: {
                async: true,
                hook: "shutdown",
                callback: this.licenseFiles.bind(this)
            }
        });
    }


    /**
     * @returns {Promise<void>}
     */
    async licenseFiles()
    {
        const distDir = this.compiler.options.output.path || this.compiler.outputPath,
              items = existsSync(distDir) ? await readdir(distDir) : [];
        for (const file of items.filter(i => i.includes("LICENSE")))
        {
            try {
                if (!file.includes(".debug")) {
                    await rename(join(distDir, file), join(distDir, file.replace("js.LICENSE.txt", "LICENSE")));
                }
                else {
                    await unlink(join(distDir, file));
                }
            } catch {}
        }
    };

}


/**
 * @param {typedefs.WpwBuild} build
 * @returns {WpwLicenseFilesPlugin | undefined}
 */
const licensefiles = (build) =>
    (build.options.licensefiles ? new WpwLicenseFilesPlugin({ build }) : undefined);


module.exports = licensefiles;
