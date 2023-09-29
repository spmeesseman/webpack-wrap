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
     * @param {typedefs.WpwPluginOptions} options
     */
	constructor(options)
	{
		super(options);
        this.buildOptions = /** @type {typedefs.WpwBuildOptionsConfig<"licensefiles">} */(this.buildOptions); // reset for typings
	}


    /**
     * Called by webpack runtime to initialize this plugin
     * @override
     * @returns {typedefs.WpwPluginTapOptions}
     */
    onApply()
    {
        return {
            renameLicenseFiles: {
                hook: "compilation",
                stage: "ANALYSE",
                hookCompilation: "processAssets",
                callback: this.renameLicenseFiles.bind(this)
            }
        };
    }


	/**
     * @override
     * @param {typedefs.WpwBuild} build
	 * @returns {WpwLicenseFilesPlugin | undefined}
     */
	static create = (build) => WpwPlugin.wrap(WpwLicenseFilesPlugin, build, "licensefiles");


    /**
     * @private
     * @param {typedefs.WebpackCompilationAssets} assets
     */
    renameLicenseFiles = (assets) =>
    {
        const l = this.logger.write("rename license files: strip contenthash and txt extension from filenames", 1),
              compilation = this.compilation;

        Object.entries(assets).filter(([ file ]) => file.includes(".LICENSE")).forEach(([ file ]) =>
        {
            const asset = compilation.getAsset(file);
            if (asset)
            {
                l.write(`found license file italic(${asset.name})`, 2);
                l.value("   current filename", file, 2);
                if (!file.includes(".debug"))
                {
                    const rgx = new RegExp(`\.[a-f0-9]{${this.hashDigestLength}}\.js\.LICENSE(?:\.[a-z]+)?`);
                    const newFile = file.replace(rgx, ".LICENSE");
                    l.value("   new filename", newFile, 2);
                    l.value("   asset info", JSON.stringify(asset.info), 3);
                    l.write("   rename license file in compilation", 2);
                    compilation.renameAsset(file, newFile);
                }
                else {
                    l.value("   asset info", JSON.stringify(asset.info), 3);
                    l.write("   remove 'debug build' license file from compilation", 2);
                    compilation.deleteAsset(file);
                }
            }
        });
    };

}


module.exports = WpwLicenseFilesPlugin.create;
