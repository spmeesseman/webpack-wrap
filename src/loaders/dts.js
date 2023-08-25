/* eslint-disable import/no-extraneous-dependencies */

const { validate } = require("schema-utils");
const { urlToRequest } = require("loader-utils");
const WpBuildConsoleLogger = require("../utils/console");

/** @type {import("schema-utils/declarations/validate").Schema} */
const schema = {
    type: "object",
    properties: {
        test: {
            type: "string"
        }
    }
};

const logger = new WpBuildConsoleLogger({
  envTag1: "loader", envTag2: "dts", colors: { default: "grey" }, level: 5
});


function dtsLoader(source, map, meta)
{
  const options = this.getOptions();

  validate(schema, options, { name: "DTS Loader", baseDataPath: "options" });

  logger.value("request path", urlToRequest(this.resourcePath), 2);

  //
  // TODO: do dts generation / transformations to the source...
  //

  // return source;
  this.callback(null, source, map, meta);
  return;
}

module.exports = dtsLoader;
