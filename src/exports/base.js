// @ts-check

/**
 * @file src/exports/base.js
 * @version 0.0.1
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const WpwError = require("../utils/message");
const typedefs = require("../types/typedefs");
const WpwBaseModule = require("../core/basemodule");

const ABSTRACT_ERROR = WpwError.Code.ERROR_ABSTRACT_FUNCTION;


/**
 * @abstract
 * @extends {WpwBaseModule}
 * @implements {typedefs.IWpwExport}
 */
class WpwWebpackExport extends WpwBaseModule
{
    /**
     * @param {typedefs.WpwExportOptions} options Plugin options to be applied
     */
	constructor(options) { super(options); }


    /**
     * @abstract
     * @protected
     */
    app()
    {
        this.build.addMessage({ code: ABSTRACT_ERROR, message: `name[${this.name}][build][app]` });
    }


    /**
     * @abstract
     * @protected
	 * @returns {void}
	 * @throws {typedefs.WpwError}
     */
    create()
    {
        this.build.addMessage({ code: ABSTRACT_ERROR, message: `name[${this.name}][build]` });
    }


    /**
     * @abstract
     * @protected
     */
    jsdoc()
    {
        this.build.addMessage({ code: ABSTRACT_ERROR, message: `name[${this.name}][build][jsdoc]` });
    }


    /**
     * @abstract
     * @protected
     */
    script()
    {
        this.build.addMessage({ code: ABSTRACT_ERROR, message: `name[${this.name}][build][script]` });
    }


    /**
     * @abstract
     * @protected
     */
    tests()
    {
        this.build.addMessage({ code: ABSTRACT_ERROR, message: `name[${this.name}][build][tests]` });
    }


    /**
     * @abstract
     * @protected
     */
    types()
    {
        this.build.addMessage({ code: ABSTRACT_ERROR, message: `name[${this.name}][build][types]` });
    }


    /**
     * @abstract
     * @protected
     */
    webapp()
    {
        this.build.addMessage({ code: ABSTRACT_ERROR, message: `name[${this.name}][build][webapp]` });
    }


    /**
     * Wraps a vendor plugin to give it access to the WpwBuild instance, and couples it with
     * the the WpwPlugin instance.
     *
     * @param {typedefs.WpwBuild} build current build wrapper
     * @returns {WpwWebpackExport | undefined} WpwPlugin | undefined
     */
    static wrap(build)
    {
        const buildOptions = build.options[this.optionsKey]; // ,
        //       enabled = buildOptions && buildOptions.enabled !== false;
        // if (enabled && this.validate(buildOptions, build))
        // {
            const wpExport = new this({ build, buildOptions });
            wpExport.create();
            return wpExport;
        // }
    }

}


module.exports = WpwWebpackExport;
