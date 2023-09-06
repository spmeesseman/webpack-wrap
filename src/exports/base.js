// @ts-check

const WpwBase = require("../core/base");
const { WpBuildError } = require("../utils");
const typedefs = require("../types/typedefs");

/**
 * @abstract
 * @extends {WpwBase}
 * @implements {typedefs.IWpwExport}
 */
class WpwWebpackExport extends WpwBase
{
    /**
     * @param {typedefs.WpwExportOptions} options Plugin options to be applied
     */
	constructor(options) { super(options); }

    /**
     * @abstract
     * @protected
	 * @returns {void}
	 * @throws {typedefs.WpBuildError}
     */
    build = () =>
    {
        throw WpBuildError.getAbstractFunction("build", this.wpc, `name[${this.name}]`);
    };
}

module.exports = WpwWebpackExport;
