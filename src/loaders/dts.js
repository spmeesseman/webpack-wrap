/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable import/no-extraneous-dependencies */

const { validate } = require("schema-utils");
const WpwLogger = require("../utils/console");
const typedefs = require("../types/typedefs");
const { urlToRequest } = require("loader-utils");
// const webpack = require("webpack");
// const { requireResolve } = require("../utils");
// const webpack = /** @type {typedefs.WebpackType} */(requireResolve("webpack"));

/** @type {WpwLogger} */
let logger;


/** @type {import("schema-utils/declarations/validate").Schema} */
const schema = {
    type: "object",
    $id: "https://app1.spmeesseman.com/res/app/wpbuild/v0.0.1/schema/.wpbuildrc.schema.loader.dts.json",
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
                },
                typesConfig: {
                    $ref: "https://app1.spmeesseman.com/res/app/wpbuild/v0.0.1/schema/.wpbuildrc.schema.json#/WpwPluginConfigTypes"
                }
            }
        }
    }
};


async function dtsLoader(source, map, meta)
{
    logger.value("request path", urlToRequest(this.resourcePath), 3);

    const options = this.getOptions();
    validate(schema, options, { name: "DTS Loader", baseDataPath: "options" });


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

    if (new RegExp(options.test).test(this.resourcePath))
    {
        // const dummySource = new webpack.sources.RawSource("console.log('dummy source');");
        const dummyCode = "console.log('dummy source');";
        source = `export default () => { ${JSON.stringify(dummyCode)}; }`;
    }
    //
    // TODO: [??]: do dts generation / transformations , do a renameAsset of the fakeAssetName / get rid of types plugin
    //

    // return source;
    // this.callback(null, source, map, meta);
    // this.callback(null, dummySource, null, null);
    return [ source, map, meta ];
}


function loader(source, map, meta)
{
    const callback = this.async();
    logger = logger || new WpwLogger({ envTag1: "loader", envTag2: "dts", level: 5 });
	dtsLoader.call(this, source, map, meta)
    .then(
        (args) => callback(null, ...args),
        (err) => callback(err)
    );
}

module.exports = loader;
