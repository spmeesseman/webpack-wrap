/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/banner.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author Scott Meesseman @spmeesseman
 */

const WpBuildPlugin = require("./base");
const { isString, requireResolve } = require("../utils");

/** @typedef {import("../types/typedefs").WebpackType} WebpackType */
const webpack = /** @type {WebpackType} */(requireResolve("webpack"));
/*  // const webpack = require("webpack"); */
/*  // const webpack = require("webpack"); */
/** @typedef {import("../utils").WpBuildApp} WpBuildApp */
/** @typedef {import("webpack").BannerPlugin} BannerPlugin */


/**
 * @param {WpBuildApp} app
 * @returns {BannerPlugin | undefined}
 */
const banner = (app) =>
{
	if (app.build.options.banner)
	{
		let banner = isString(app.build.options.banner) ? app.build.options.banner : undefined;

		if (!banner)
		{
			const author = isString(app.pkgJson.author) ? app.pkgJson.author : app.pkgJson.author?.name;
			if (author) {
				banner = "Copyright [DATE_STAMP_YEAR] " + author;
			}
		}

		if (banner)
		{
			return new webpack.BannerPlugin({
				entryOnly: true,
				test: WpBuildPlugin.getEntriesRegex(app.wpc, true, true),
				banner: banner.replace(new RegExp("\\[DATE_STAMP_YEAR\\]"), new Date().getFullYear().toString())
			});
		}
	}
};


module.exports = banner;
