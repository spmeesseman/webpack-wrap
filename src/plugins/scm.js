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
const WpBuildApp = require("../core/app");

/** @typedef {import("../types").WebpackCompiler} WebpackCompiler */
/** @typedef {import("../types").WpwPluginOptions} WpwPluginOptions */


/**
 * @extends WpwPlugin
 */
class WpBuildScmPlugin extends WpwPlugin
{
    /**
     * @param {WpwPluginOptions} options Plugin options to be applied
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
            commitSourceCodeChanges: {
                async: true,
                hook: "shutdown",
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
        if (this.app.global.scm.callCount === 2 && this.app.global.scm.readyCount > 0)
        {
            const logger = this.app.logger,
                  provider = process.env.WPBUILD_SCM_PROVIDER || "git",
                  host = process.env.WPBUILD_SCM_HOST,
                  user = process.env.WPBUILD_SCM_USER; // ,
                  // /** @type {import("child_process").SpawnSyncOptions} */
                  // spawnSyncOpts = { cwd: this.app.getRcPath("main", ), encoding: "utf8", shell: true },
                  // sshAuth = process.env.WPBUILD_SCM_AUTH || "InvalidAuth";

            const scmArgs = [
                "ci",    // authenticate
                // sshAuth,  // auth key
                // "-q",  // quiet, don't show statistics
                "-r",     // copy directories recursively
                `${user}@${host}:${this.app.pkgJson.name}/v${this.app.pkgJson.version}"`
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
        }
    };

}


/**
 * @param {WpBuildApp} app
 * @returns {WpBuildScmPlugin | undefined}
 */
const scm = (app) => app.build.options.scm ? new WpBuildScmPlugin({ app }) : undefined;


module.exports = scm;
