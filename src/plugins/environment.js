/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/environment.js
 * @version 0.0.1
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const WpwPlugin = require("./base");
const typedefs = require("../types/typedefs");


/**
 * @extends WpwPlugin
 */
class WpwEnvironmentPlugin extends WpwPlugin
{
    /**
     * @override
     * @returns {typedefs.WpwPluginTapOptions}
     */
    onApply()
    {
        return {
            finishEnvironmentInitialization: {
                hook: "environment",
                callback: this.environment.bind(this)
            }
        };
    }


	/**
	 * @private
	 */
	environment = () =>
	{
		this.setVersion();
	};


	/**
	 * @private
	 */
	setVersion = () =>
	{
		if (this.build.type === "app" && this.build.mode === "production")
		{
			// let version = build.pkgJson.version;
		}
	};

}


/**
 * @param {typedefs.WpwBuild} build
 * @returns {WpwEnvironmentPlugin | undefined}
 */
const environment = (build) => build.mode === "production" ? new WpwEnvironmentPlugin({ build }) : undefined;


module.exports = environment;
