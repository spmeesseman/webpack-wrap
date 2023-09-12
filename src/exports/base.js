// @ts-check

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
	 * @returns {void}
	 * @throws {typedefs.WpwError}
     */
    build()
    {
        this.app.addMessage({ code: WpwError.Msg.ERROR_ABSTRACT_FUNCTION, message: `name[${this.name}][build]` });
    }

    /**
     * @abstract
     * @protected
     */
    jsdoc()
    {
        this.app.addMessage({ code: WpwError.Msg.ERROR_ABSTRACT_FUNCTION, message: `name[${this.name}][build][jsdoc]` });
    }

    /**
     * @abstract
     * @protected
     */
    module()
    {
        this.app.addMessage({ code: WpwError.Msg.ERROR_ABSTRACT_FUNCTION, message: `name[${this.name}][build][module]` });
    }

    /**
     * @abstract
     * @protected
     */
    tests()
    {
        this.app.addMessage({ code: WpwError.Msg.ERROR_ABSTRACT_FUNCTION, message: `name[${this.name}][build][tests]` });
    }

    /**
     * @abstract
     * @protected
     */
    types()
    {
        this.app.addMessage({ code: WpwError.Msg.ERROR_ABSTRACT_FUNCTION, message: `name[${this.name}][build][types]` });
    }

    /**
     * @abstract
     * @protected
     */
    webapp()
    {
        this.app.addMessage({ code: WpwError.Msg.ERROR_ABSTRACT_FUNCTION, message: `name[${this.name}][build][webapp]` });
    }

}


module.exports = WpwWebpackExport;
