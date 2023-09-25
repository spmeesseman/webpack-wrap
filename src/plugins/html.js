/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file src/plugins/html.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const { posix } = require("path");
const WpwPlugin = require("./base");
const typedefs = require("../types/typedefs");
const { isString } = require("@spmeesseman/type-utils");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CspHtmlWebpackPlugin = require("csp-html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin");


/**
 * @extends WpwPlugin
 */
class WpwWebPlugin extends WpwPlugin
{
    /**
     * @private
     * @type {typedefs.WpwBuildOptionsConfig<"web"> | undefined}
     */
    webBuildOptions;


	/**
	 * @param {typedefs.WpwPluginOptions} options Plugin options to be applied
	 */
	constructor(options)
    {
        super(options);
        this.buildOptions = /** @type {typedefs.WpwBuildOptionsConfig<"html">} */(this.buildOptions); // reset for typings
        this.webBuildOptions = this.build.options.web;
    }


	/**
     * @override
     * @param {typedefs.WpwBuild} build
	 * @returns {WpwWebPlugin | undefined}
     */
	static create = (build) => WpwWebPlugin.wrap(this, build, "html");


    /**
	 * @override
     * @returns {typedefs.WebpackPluginInstanceOrUndef[] | undefined}
     */
    getVendorPlugin()
    {
        const build = this.build;
        if (build.type === "webapp")
        {
            return [
                this.css(),
				...this.webapps(),
				this.csp(),
				this.inlinechunks(),
				this.images()
            ];
        }
    };


    /**
     * @returns {MiniCssExtractPlugin}
     */
    css()
    {
        return new MiniCssExtractPlugin(
        {
            filename: (pathData, assetInfo) =>
            {
                let name = "[name]";
                if (pathData.chunk?.name) {
                    name = pathData.chunk.name.replace(/[a-z]+([A-Z])/g, (substr, token) => substr.replace(token, "-" + token.toLowerCase()));
                }
                return `css/${name}.css`;
            }
        });
    }


    /**
     * @returns {typedefs.WebpackPluginInstance}
     */
    csp()
    {
        /** @type {typedefs.WebpackPluginInstance} */
        // @ts-ignore
        const plugin = new CspHtmlWebpackPlugin(
        {
            // "connect-src":
            // build.wpc.mode !== 'production'
            // 		 ? [ "#{cspSource}", "'nonce-#{cspNonce}'", "https://www.sandbox.paypal.com", "https://www.paypal.com" ]
            // 		 : [ "#{cspSource}", "'nonce-#{cspNonce}'", "https://www.paypal.com" ],
            "default-src": "'none'",
            "font-src": [ "#{cspSource}" ],
            // "frame-src":
            // build.wpc.mode !== 'production'
            // 		 ? [ "#{cspSource}", "'nonce-#{cspNonce}'", "https://www.sandbox.paypal.com", "https://www.paypal.com" ]
            // 		 : [ "#{cspSource}", "'nonce-#{cspNonce}'", "https://www.paypal.com" ],
            "img-src": [ "#{cspSource}", "https:", "data:" ],
            "script-src":
            this.build.wpc.mode !== "production"
                    ? [ "#{cspSource}", "'nonce-#{cspNonce}'", "'unsafe-eval'" ]
                    : [ "#{cspSource}", "'nonce-#{cspNonce}'" ],
            "style-src":
            this.build.wpc.mode === "production"
                    ? [ "#{cspSource}", "'nonce-#{cspNonce}'", "'unsafe-hashes'" ]
                    : [ "#{cspSource}", "'unsafe-hashes'", "'unsafe-inline'" ]
        },
        {
            enabled: true,
            hashingMethod: "sha256",
            hashEnabled: {
                "script-src": true,
                "style-src": this.build.wpc.mode === "production"
            },
            nonceEnabled: {
                "script-src": true,
                "style-src": this.build.wpc.mode === "production"
            }
        });

        //
        // For vscode extensions -
        // Override the nonce creation so it can be dynamically generated at runtime
        //
        if (this.build.vscode) {
            // @ts-ignore
            plugin.createNonce = () => "#{cspNonce}";
        }

        return plugin;
    }


    /**
     * @returns {InlineChunkHtmlPlugin}
     */
    inlinechunks() { return new InlineChunkHtmlPlugin(HtmlWebpackPlugin, []); }


    /**
     * @returns {ImageMinimizerPlugin | undefined}
     */
    images()
    {
        let plugin;
        if (this.build.wpc.mode === "production")
        {
            plugin = new ImageMinimizerPlugin({
            	deleteOriginalAssets: true,
            	generator: [ this.imageminimizer() ]
            });
        }
        return plugin;
    }


    /**
     * @returns { ImageMinimizerPlugin.Generator<any> }
     */
    imageminimizer()
    {
        if (this.build.cmdLine.imageOpt)
        {
            // @ts-ignore
            return {
                type: "asset",
                implementation: ImageMinimizerPlugin.sharpGenerate,
                options: {
                    encodeOptions: {
                        webp: {
                            lossless: true
                        }
                    }
                }
            };
        }

        return {
            type: "asset",
            implementation: ImageMinimizerPlugin.imageminGenerate,
            options: {
                plugins: [
                [
                    "imagemin-webp",
                    {
                        lossless: true,
                        nearLossless: 0,
                        quality: 100,
                        method: this.build.wpc.mode === "production" ? 4 : 0
                    }
                ]]
            }
        };
    }


    /**
     * @returns {HtmlWebpackPlugin[]}
     */
    webapps()
    {
        const build = this.build,
              apps = isString(build.entry) ? [ build.entry ] :
                     (Object.keys(build.entry || this.createEntryObjFromDir(build.getSrcPath(), build.source.dotext)));

        return apps.map((name) =>
        {
            const wwwName = name.replace(/[a-z]+([A-Z])/g, (substr, token) => substr.replace(token, "-" + token.toLowerCase()));
            return new HtmlWebpackPlugin(
            {
                inject: true,
                scriptLoading: "module",
                chunks: [ name, wwwName ],
                filename: posix.join(build.getDistPath(), "page", `${wwwName}.html`),
                inlineSource: build.wpc.mode === "production" ? ".css$" : undefined,
                template: posix.join(name, `${wwwName}.html`),
                minify: build.wpc.mode !== "production" ?
                        false :
                        {
                            removeComments: true,
                            collapseWhitespace: true,
                            removeRedundantAttributes: false,
                            useShortDoctype: true,
                            removeEmptyAttributes: true,
                            removeStyleLinkTypeAttributes: true,
                            keepClosingSlash: true,
                            minifyCSS: true
                        }
            });
        });
    }

}


class InlineChunkHtmlPlugin
{
	constructor(htmlPlugin, patterns)
	{
		this.htmlPlugin = htmlPlugin;
		this.patterns = patterns;
	}

	getInlinedTag(publicPath, assets, tag)
	{
		if (
			(tag.tagName !== "script" || !(tag.attributes && tag.attributes.src)) &&
			(tag.tagName !== "link" || !(tag.attributes && tag.attributes.href))
		) {
			return tag;
		}

		let chunkName = tag.tagName === "link" ? tag.attributes.href : tag.attributes.src;
		if (publicPath) {
			chunkName = chunkName.replace(publicPath, "");
		}
		if (!this.patterns.some(pattern => chunkName.match(pattern))) {
			return tag;
		}

		const asset = assets[chunkName];
		if (!asset) {
			return tag;
		}

		return { tagName: tag.tagName === "link" ? "style" : tag.tagName, innerHTML: asset.source(), closeTag: true };
	}

	apply(compiler)
	{
		let publicPath = compiler.options.output.publicPath || "";
		if (publicPath && !publicPath.endsWith("/")) {
			publicPath += "/";
		}

		compiler.hooks.compilation.tap("InlineChunkHtmlPlugin", compilation => {
			const getInlinedTagFn = tag => this.getInlinedTag(publicPath, compilation.assets, tag);
			const sortFn = (a, b) => (a.tagName === "script" ? 1 : -1) - (b.tagName === "script" ? 1 : -1);
			this.htmlPlugin.getHooks(compilation).alterAssetTagGroups.tap("InlineChunkHtmlPlugin", assets => {
				assets.headTags = assets.headTags.map(getInlinedTagFn).sort(sortFn);
				assets.bodyTags = assets.bodyTags.map(getInlinedTagFn).sort(sortFn);
			});
		});
	}
}


module.exports = WpwWebPlugin.create;
