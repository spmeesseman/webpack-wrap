/* eslint-disable import/no-extraneous-dependencies */

const { validate } = require("schema-utils");
const { urlToRequest } = require("loader-utils");
const WpwLogger = require("../utils/console");
const webpack = require("webpack");


/** @type {import("schema-utils/declarations/validate").Schema} */
const schema = {
    type: "object",
    properties: {
        test: {
            type: "string"
        }
    }
};

const logger = new WpwLogger({
    envTag1: "loader", envTag2: "dts", colors: { default: "grey" }, level: 5
});


function dtsLoader(source, map, meta)
{
    const options = this.getOptions();

    validate(schema, options, { name: "DTS Loader", baseDataPath: "options" });

    logger.value("request path", urlToRequest(this.resourcePath), 3);

    const dummySource = new webpack.sources.RawSource("console.log('dummy source');");
    //
    // TODO: do dts generation / transformations to the source...
    //

    // return source;
    // this.callback(null, source, map, meta);
    this.callback(null, dummySource, null, null);
    return;
}

module.exports = dtsLoader;
