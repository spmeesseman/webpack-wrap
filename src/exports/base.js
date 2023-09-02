

const { WpwBase } = require("../core/base");
const typedefs = require("../types/typedefs");


/**
 * @abstract
 * @extends {WpwBase}
 * @implements {typedefs.IWpwExport}
 */
class WpwWebpackExport extends WpwBase
{
    /**
     * @param {typedefs.WpBuildExportOptions} options Plugin options to be applied
     */
	constructor(options)
    {
        super(options);
    }

}


module.exports = WpwWebpackExport;
