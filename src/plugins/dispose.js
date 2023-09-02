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


/**
 * @extends WpwPlugin
 */
class WpBuildDisposePlugin extends WpwPlugin
{
    /**
     * Called by webpack runtime to initialize this plugin
     * @override
     * @param {typedefs.WebpackCompiler} compiler the compiler instance
     */
    apply(compiler)
    {
        this.onApply(compiler,
        {
            cleanupRegisteredDisposables: {
                async: true,
                hook: "shutdown",
                callback: this.dispose.bind(this)
            }
        });
    }

    dispose()
    {
        this.logger.write("cleanup: call all registered disposables", 2);
        return this.app.dispose();
    }
}


/**
 * @param {typedefs.WpBuildApp} app
 * @returns {WpBuildDisposePlugin}
 */
const dispose = (app) => new WpBuildDisposePlugin({ app });


module.exports = dispose;
