// @ts-check

/**
 * @file src/loaders/wpw-types-loader/lib/types.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *
 *//** */

const { validate } = require("schema-utils");
const { urlToRequest } = require("loader-utils");
const typedefs = require("../../../types/typedefs");
const WpwLogger = require("../../../utils/console");
const { forwardSlash, findFiles } = require("../../../utils/utils");
const { resolve } = require("path");

/** @type {WpwLogger} */
let logger;

const baseDir= resolve(__dirname, "../../../..");


/** @type {typedefs.JsonSchema} */
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
                "config", "ext", "inputDir", "outDir", "virtualFile"
            ],
            properties: {
                entry: {
                    type: "string"
                },
                ext: {
                    type: "string"
                },
                inputDir: {
                    type: "string"
                },
                outDir: {
                    type: "string"
                },
                virtualFile: {
                    type: "string"
                },
                config: {
                    $ref: "https://app1.spmeesseman.com/res/app/webpack-wrap/v0.0.1/schema/spm.schema.wpw.json#/WpwPluginConfigTypes"
                }
            }
        }
    }
};

async function typesLoader(source, map, meta)
{
    const resourcePath = forwardSlash(urlToRequest(this.resourcePath));
    logger = logger || new WpwLogger({ envTag1: "loader", envTag2: "dts", level: 5 });
    logger.write("process loader request", 3);
    logger.value("   path", resourcePath, 3);

    const options = this.getOptions();
    validate(schema, options, { name: "DTS Loader", baseDataPath: "options" });

    // this.clearDependencies();
    // const files = await findFiles(`**/*${options.ext}`, { absolute: true, cwd: options.inputDir });
    // for (const file of files) {
    //     this.addDependency(file);
    //     logger.value("   add dependency", file, 5);
    // }

    return [ source, map, meta ];

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
    // return [ source, map, meta ];
}


module.exports = typesLoader;
