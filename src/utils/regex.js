// @ts-check

/**
 * @file utils/regex.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author @spmeesseman Scott Meesseman
 */

const TestsChunk = (/[a-z]+\.(?:tests?|specs?)$|[\/\\]tests?|suite[\/\\]/i);

const PathVersion = /\/v([0-9]+\\.[0-9]+\\.[0-9]+(?:-(?:pre|alpha|beta)\\.[0-9]+)?)\//;


const WpwRegex = {
    PathVersion, TestsChunk
};

module.exports = WpwRegex;
