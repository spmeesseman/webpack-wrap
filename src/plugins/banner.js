/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/banner.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 *//** */

const WpwPlugin = require("./base");
const typedefs = require("../types/typedefs");
const { isString, requireResolve } = require("../utils");
const webpack = /** @type {typedefs.WebpackType} */(requireResolve("webpack"));
/** @typedef {import("../core/build")} WpwBuild */
/** @typedef {import("webpack").BannerPlugin} BannerPlugin */


/**
 * @param {WpwBuild} build
 * @returns {BannerPlugin | undefined}
 */
const banner = (build) =>
{
	if (build.options.banner)
	{
		let banner = isString(build.options.banner) ? build.options.banner : undefined;

		if (!banner)
		{
			const author = isString(build.pkgJson.author) ? build.pkgJson.author : build.pkgJson.author?.name;
			if (author) {
				banner = "Copyright #{DATE_STAMP_YEAR} " + author;
			}
		}

		if (banner)
		{
			return new webpack.BannerPlugin({
				entryOnly: true,
				test: WpwPlugin.getEntriesRegex(build.wpc, true, true),
				banner: banner.replace(new RegExp("#\\{DATE_STAMP_YEAR\\}"), new Date().getFullYear().toString())
			});
		}
	}
};


module.exports = banner;
