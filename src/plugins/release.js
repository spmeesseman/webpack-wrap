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


/**
 * @extends WpwPlugin
 */
class WpwReleasePlugin extends WpwPlugin
{
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
            setNewVersion: {
                hook: "environment",
                callback: this.setNewVersion.bind(this)
            },
            updateChangelog: {
                hook: "afterEnvironment",
                callback: this.updateChangelog.bind(this)
            }
        };

        if (this.buildOptions.github)
        {
            hooksConfig.executeGithubRelease = {
                hook: "done",
                callback: this.executeGithubRelease.bind(this)
            };
        }

        if (this.buildOptions.gitlab)
        {
            hooksConfig.executeGitlabRelease = {
                hook: "done",
                callback: this.executeGitlabRelease.bind(this)
            };
        }

        if (this.buildOptions.mantis)
        {
            hooksConfig.executeMantisRelease = {
                hook: "done",
                callback: this.executeMantisRelease.bind(this)
            };
        }

        if (this.buildOptions.npm)
        {
            hooksConfig.executeNpmRelease = {
                hook: "done",
                callback: this.executeNpmRelease.bind(this)
            };
        }

        return hooksConfig;
    }


    /**
     * @private
     */
    executeGithubRelease()
    {
    }


    /**
     * @private
     */
    executeGitlabRelease()
    {
    }


    /**
     * @private
     */
    executeMantisRelease()
    {
    }


    /**
     * @private
     */
    executeNpmRelease()
    {
    }


    /**
     * @private
     */
    setNewVersion()
    {
    }


    /**
     * @private
     */
    updateChangelog()
    {
    }

}


module.exports = WpwReleasePlugin.create;
