// @ts-check

/**
 * @file src/exports/base.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const WpwError = require("../utils/message");
const typedefs = require("../types/typedefs");
const WpwBaseModule = require("../core/basemodule");

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
        this.build.addMessage({ code: WpwError.Msg.ERROR_ABSTRACT_FUNCTION, message: `name[${this.name}][build][app]` });
    }

    /**
     * @abstract
     * @protected
	 * @returns {void}
	 * @throws {typedefs.WpwError}
     */
    create()
    {
        this.build.addMessage({ code: WpwError.Msg.ERROR_ABSTRACT_FUNCTION, message: `name[${this.name}][build]` });
    }

    /**
     * @abstract
     * @protected
     */
    jsdoc()
    {
        this.build.addMessage({ code: WpwError.Msg.ERROR_ABSTRACT_FUNCTION, message: `name[${this.name}][build][jsdoc]` });
    }

    /**
     * @abstract
     * @protected
     */
    tests()
    {
        this.build.addMessage({ code: WpwError.Msg.ERROR_ABSTRACT_FUNCTION, message: `name[${this.name}][build][tests]` });
    }

    /**
     * @abstract
     * @protected
     */
    types()
    {
        this.build.addMessage({ code: WpwError.Msg.ERROR_ABSTRACT_FUNCTION, message: `name[${this.name}][build][types]` });
    }

    /**
     * @abstract
     * @protected
     */
    webapp()
    {
        this.build.addMessage({ code: WpwError.Msg.ERROR_ABSTRACT_FUNCTION, message: `name[${this.name}][build][webapp]` });
    }

}


module.exports = WpwWebpackExport;
