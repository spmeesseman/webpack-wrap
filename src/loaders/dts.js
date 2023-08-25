/* eslint-disable import/no-extraneous-dependencies */

const { urlToRequest } = require("loader-utils");
const { validate } = require("schema-utils");

/** @type {import("schema-utils/declarations/validate").Schema} */
const schema = {
  type: 'object',
  properties: {
    test: {
      type: 'string'
    }
  }
};

function dtsLoader(source, map, meta)
{
  const options = this.getOptions();

  validate(schema, options, {
    name: 'Example Loader',
    baseDataPath: 'options'
  });

  console.log('The request path', urlToRequest(this.resourcePath));

  // Apply some transformations to the source...

  this.callback(null, source, map, meta);
  return;
  // return source;;
}

module.exports = dtsLoader;
