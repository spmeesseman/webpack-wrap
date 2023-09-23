/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/scm.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const WpwPlugin = require("./base");
const typedefs = require("../types/typedefs");


/**
 * @extends WpwPlugin
 */
class WpwScmPlugin extends WpwPlugin
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
            commitSourceCodeChanges: {
                async: true,
                hook: "done",
                callback: this.commit.bind(this)
            }
        });
    }


    /**
     * @private
     * @async
     */
    async commit()
    {
        const logger = this.build.logger,
                provider = process.env.WPBUILD_SCM_PROVIDER || "git",
                host = process.env.WPBUILD_SCM_HOST,
                user = process.env.WPBUILD_SCM_USER; // ,
                // /** @type {import("child_process").SpawnSyncOptions} */
                // spawnSyncOpts = { cwd: build.getBasePath(, encoding: "utf8", shell: true },
                // sshAuth = process.env.WPBUILD_SCM_AUTH || "InvalidAuth";

        const scmArgs = [
            "ci",    // authenticate
            // sshAuth,  // auth key
            // "-q",  // quiet, don't show statistics
            "-r",     // copy directories recursively
            `${user}@${host}:${this.build.pkgJson.name}/v${this.build.pkgJson.version}"`
        ];
        logger.write(`${logger.icons.color.star } ${logger.withColor(`check in resource files to ${host}`, logger.colors.grey)}`);
        try {
            logger.write(`   full scm command      : ${provider} ${scmArgs.map((v, i) => (i !== 3 ? v : "<PWD>")).join(" ")}`);
            //
            // TODO - check in any project-info files that were copied
            //        -*-and-*- package.json if we add content hash to "main" file name???
            //
            // spawnSync(provider, scmArgs, spawnSyncOpts);
            logger.write(`${logger.icons.color.star} ${logger.withColor("successfully checked in resource files", logger.colors.grey)}`);
        }
        catch (e) {
            logger.error(`error checking in resource files: ${e.message}`);
        }
    };

}


/**
 * @param {typedefs.WpwBuild} build
 * @returns {WpwScmPlugin | undefined}
 */
const scm = (build) => build.options.scm ? new WpwScmPlugin({ build }) : undefined;


module.exports = scm;
