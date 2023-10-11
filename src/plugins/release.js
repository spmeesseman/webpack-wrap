/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/runtimevars.js
 * @version 0.0.1
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman\
 *//** */

const WpwPlugin = require("./base");
const WpwError = require("../utils/message");
const typedefs = require("../types/typedefs");
const { isString, apply, isObjectEmpty, merge } = require("@spmeesseman/type-utils");
const { sleep } = require("../utils");


/**
 * @extends WpwPlugin
 */
class WpwReleasePlugin extends WpwPlugin
{
    /**
     * @private
     * @type {string}
     */
    currentVersion;
    /**
     * @private
     * @type {string}
     */
    nextVersion;
    /**
     * @private
     * @type {boolean}
     */
    hasFileUpdates;
    /**
     * @private
     * @type {string}
     */
    versionBump;


    /**
     * @param {typedefs.WpwPluginOptions} options Plugin options to be applied
     */
	constructor(options)
    {
        super(options);
        this.buildOptions = /** @type {typedefs.WpwBuildOptionsConfig<"release">} */(this.buildOptions); // reset for typings
    }


	/**
     * @override
     */
	static create = WpwReleasePlugin.wrap.bind(this);


    /**
     * @override
     * @returns {typedefs.WpwPluginTapOptions}
     */
    onApply()
    {
        /** @type {typedefs.WpwPluginTapOptions} */
        const hooksConfig = {
            printApInfo: {
                hook: "beforeRun",
                async: true,
                callback: this.printApInfo.bind(this)
            },
            getVersions: {
                hook: "run",
                async: true,
                callback: this.getVersions.bind(this)
            }
        };

        if (!this.buildOptions.printVersionsOnly)
        {
            apply(hooksConfig, {
                updateVersionFiles: {
                    hook: "beforeCompile",
                    async: true,
                    callback: this.updateVersionFiles.bind(this)
                },
                cleanup: {
                    hook: "shutdown",
                    forceRun: true,
                    callback: this.cleanup.bind(this)
                },
                updateChangelog: {
                    hook: "done",
                    callback: this.updateChangelog.bind(this)
                }
            });
            if (this.buildOptions.github)
            {
                hooksConfig.executeGithubRelease = {
                    hook: "done",
                    async: true,
                    callback: this.executeGithubRelease.bind(this)
                };
            }
            else if (this.buildOptions.gitlab)
            {
                hooksConfig.executeGitlabRelease = {
                    hook: "done",
                    async: true,
                    callback: this.executeGitlabRelease.bind(this)
                };
            }
            if (this.buildOptions.mantis)
            {
                hooksConfig.executeMantisRelease = {
                    hook: "done",
                    async: true,
                    callback: this.executeMantisRelease.bind(this)
                };
            }
            if (this.buildOptions.npm)
            {
                hooksConfig.executeNpmRelease = {
                    hook: "done",
                    async: true,
                    callback: this.executeNpmRelease.bind(this)
                };
            }
        }

        return hooksConfig;
    }


    /**
     * @private
     */
    async cleanup()
    {
        if (this.buildOptions.dryRun || (this.build.hasError && this.hasFileUpdates))
        {
            await this.execAp(null, "--task-revert");
        }
    }


    /**
     * @param {Partial<typedefs.ExecAsyncOptions> | null | undefined} options
     * @param {string[]} args
     * @returns {Promise<typedefs.ExecAsyncResult>} Promise<ExecAsyncResult>
     */
    execAp(options, ...args)
    {
        args.push("--no-ci");
        if (this.buildOptions.dryRun) {
            args.push("--dry-run");
        }
        if (this.buildOptions.promptVersion && !args.includes("--prompt-version-disable")) {
           args.push("--prompt-version");
        }
        //
        // Can't be verbose if we are readibg stdout as a value i.e. versions
        //
        if (!options?.stdin)
        {
            if (this.buildOptions.verbose) {
                args.push("--verbose");
            }
            if (this.buildOptions.veryVerbose) {
                args.push("--verboseEx");
            }
        }

        return this.exec(`app-publisher ${args.join(" ")}`, "app-publisher", options || undefined);
    }


    /**
     * @private
     */
    async executeGithubRelease()
    {
        await this.execAp(null, "--task-release-github");
    }


    /**
     * @private
     */
    async executeGitlabRelease()
    {   //
        // TODO - app-publisher gitlab release
        //
        // await this.execAp("--task-release-gitlab");
        this.build.addMessage({
            code: WpwError.Code.ERROR_NOT_IMPLEMENTED, message: "app-publisher: --task-release-gitlab"
        });
        await sleep(1);
    }


    /**
     * @private
     */
    async executeMantisRelease()
    {
        await this.execAp(null, "--task-release-mantis");
    }


    /**
     * @private
     * @returns {Promise<void>}
     */
    async executeNpmRelease()
    {
        await this.execAp(null, "--task-release-npm");
    }


    /**
     * @private
     */
    async getVersions()
    {
        const args = [ "--task-version-info" ],
              preTag = this.buildOptions.preVersion;
        //
        // a 1st release will auto-prompt, disable if not explicitly set
        //
        if (this.build.pkgJson.version === "0.0.1" && !this.buildOptions.promptVersion) {
            // args.push("--version-force-next", "0.0.1");
            args.push("--prompt-version-disable");
        }
        if (preTag) {
            args.push("--version-pre-release-id", preTag);
        }
        const versions = (await this.execAp({ stdin: true }, ...args)).stdout.split("|");
        this.currentVersion = versions[0];
        this.nextVersion = versions[1];
        this.versionBump = versions[2];
        this.logger.value("current version", this.currentVersion, 1);
        this.logger.value("next version", this.nextVersion, 1);
        this.logger.value("version bump", this.versionBump, 2);
    }


    /**
     * @private
     */
    async printApInfo()
    {
        await this.execAp({ stdout: true, raw: true }, "--version");
        this.hasFileUpdates = this.hasFileUpdates || !this.build.hasError;
    }


    /**
     * @private
     */
    async updateChangelog()
    {
        await this.execAp(null, "--task-release-changelog");
        this.hasFileUpdates = this.hasFileUpdates || !this.build.hasError;
    }


    /**
     * @private
     */
    async updateVersionFiles()
    {
        const preTag = this.buildOptions.preVersion;
        this.logger.write("update version files", 1);
        if (this.buildOptions.promptVersion)
        {
            // TODO - prompt for version
        }
        if (!preTag) {
            await this.execAp(null, "--task-version-update", "--version-force-next", this.nextVersion);
        }
        else {
            await this.execAp(null, "--task-version-update", "--version-pre-release-id", preTag, "--version-force-next", this.nextVersion);
        }
        this.hasFileUpdates = this.hasFileUpdates || !this.build.hasError;
    }

}


module.exports = WpwReleasePlugin.create;
