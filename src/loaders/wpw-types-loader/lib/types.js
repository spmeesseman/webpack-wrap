// @ts-check

const { resolve } = require("path");
const { validate } = require("schema-utils");
const { writeFile } = require("fs/promises");
const { urlToRequest } = require("loader-utils");
const WpwLogger = require("../../../utils/console");

/** @type {WpwLogger} */
let logger;


/** @type {import("schema-utils/declarations/validate").Schema} */
const schema = {
    type: "object",
    $id: "https://app1.spmeesseman.com/res/app/webpack-wrap/v0.0.1/schema/spm.schema.wpw.loader.types.json",
    properties: {
        test: {
            type: "string"
        },
        options: {
            type: "object",
            required: [
                "virtualFile", "typesConfig"
            ],
            properties: {
                virtualFile: {
                    type: "string"
                },
                typesConfig: {
                    $ref: "https://app1.spmeesseman.com/res/app/webpack-wrap/v0.0.1/schema/spm.schema.wpw.json#/WpwPluginConfigTypes"
                }
            }
        }
    }
};

async function typesLoader(source, map, meta)
{
    logger = logger || new WpwLogger({ envTag1: "loader", envTag2: "dts", level: 5 });
    logger.write("process request", 3);
    logger.value("   path", urlToRequest(this.resourcePath), 3);

    const options = this.getOptions();
    logger.object("options", options, 4, "   ");
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

    // let newSource = source;
    // if (new RegExp(options.test).test(this.resourcePath))
    // {
    //     // const dummySource = new webpack.sources.RawSource("console.log('dummy source');");
    //     const dummyCode = "console.log('dummy source');";
    //     newSource = `export default () => { ${JSON.stringify(dummyCode)}; }`;
    //     await writeFile(resolve(options.virtualFile), newSource);
    // }
    //
    // TODO: [??]: do dts generation / transformations , do a renameAsset of the fakeAssetName / get rid of types plugin
    //

    // return source;
    // this.callback(null, source, map, meta);
    // this.callback(null, dummySource, null, null);
    // return [ newSource, map, meta ];
    return [ source, map, meta ];
}


module.exports = typesLoader;
