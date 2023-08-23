/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

/**
 * @file plugin/banner.js
 * @version 0.0.1
 * @license MIT
 * @author Scott Meesseman @spmeesseman
 */

const webpack = require("webpack");
const WpBuildPlugin = require("./base");
const { isString, isObject } = require("../utils/utils");

/** @typedef {import("../utils").WpBuildApp} WpBuildApp */


/**
 * @param {WpBuildApp} app
 * @returns {webpack.BannerPlugin | undefined}
 */
const banner = (app) =>
{
	if (app.build.plugins.banner)
	{
		let banner = isString(app.build.plugins.banner) ? app.build.plugins.banner : undefined;

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
