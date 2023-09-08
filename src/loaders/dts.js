/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable import/no-extraneous-dependencies */

const { validate } = require("schema-utils");
const WpwLogger = require("../utils/console");
const typedefs = require("../types/typedefs");
const { urlToRequest } = require("loader-utils");
// const webpack = require("webpack");
const webpack = /** @type {typedefs.WebpackType} */(requireResolve("webpack"));


/** @type {import("schema-utils/declarations/validate").Schema} */
const schema = {
    type: "object",
    properties: {
        test: {
            type: "string"
        },
        options: {
            type: "object",
            properties: {
                outDir: {
                    type: "string"
                },
                inputDir: {
                    type: "string"
                }
            }
        }
    }
};

const logger = new WpwLogger({
    envTag1: "loader", envTag2: "dts", colors: { default: "grey" }, level: 5
});


async function dtsLoader(source, map, meta)
{
    const options = this.getOptions();
    validate(schema, options, { name: "DTS Loader", baseDataPath: "options" });

    logger.value("request path", urlToRequest(this.resourcePath), 3);

    // const filename = loaderUtils.interpolateName(this, `[name]-page${i}-[contenthash].png`, {content: file});
    // const imageNames = images.map((file, i) => {
    //     return loaderUtils.interpolateName(this, `[name]-page${i}-[contenthash].png`, {content: file});
    // });
    // images.forEach((file, i) => {
    //     this.emitFile(imageNames[i], file);
    // });
    // const results = imageNames.map((imageName, i) => {
    //     return `${ASSET_PATH}${imageName}`;
    // });
    // return `export default ${JSON.stringify(results)}`;

    // const ASSET_PATH = process.env.ASSET_PATH || "/";
    // const results = `${ASSET_PATH}${filename}`;

    // __webpack_public_path__

    // const dummySource = new webpack.sources.RawSource("console.log('dummy source');");
    const dummyCode = "console.log('dummy source');";
    const dummySource = `export default () => { ${JSON.stringify(dummyCode)}; }`;
    //
    // TODO: do dts generation / transformations to the source...
    //

    // return source;
    // this.callback(null, source, map, meta);
    // this.callback(null, dummySource, null, null);
    return [ dummySource, map ];
}


function loader(source, map, meta)
{
    const callback = this.async();
	dtsLoader.call(this, source, map, meta)
    .then(
        (args) => callback(null, ...args),
        (err) => callback(err)
    );
}

module.exports = loader;
