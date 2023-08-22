// @ts-check

/**
 * @file utils/regex.js
 * @version 0.0.1
 * @license MIT
 * @author @spmeesseman Scott Meesseman
 */

const RegexTestsChunk = (/[a-z]+\.(?:tests?|specs?)$|[\/\\]tests?|suite[\/\\]/i);

module.exports = {
    RegexTestsChunk
};
