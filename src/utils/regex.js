// @ts-check

/**
 * @file utils/regex.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author @spmeesseman Scott Meesseman
 */

const TestsChunk = (/[a-z]+\.(?:tests?|specs?)$|[\/\\]tests?|suite[\/\\]/i);

const PathVersion = /\/v([0-9]+\.[0-9]+\.[0-9]+(?:\-(?:pre|alpha|beta)\.[0-9]+)?)\//;

const StackTraceCurrentColumn = /at [a-zA-Z0-9_.]+ +\(.*?[\\\/]webpack\-wrap[\\\/]src[\\\/][a-zA-Z0-9_.\\\/]+?:[0-9]+?:([0-9]+?)\) *$/;

const StackTraceCurrentFile = /at [a-zA-Z0-9_.]+ +\(.*?[\\\/]webpack\-wrap[\\\/]([a-zA-Z0-9_.\\\/]+?):/;

const StackTraceCurrentFileAbs = /at [a-zA-Z0-9_.]+ +\((.*?[\\\/]webpack\-wrap[\\\/][a-zA-Z0-9_.\\\/]+?):/;

const StackTraceCurrentLine = /at [a-zA-Z0-9_.]+ +\(.*?[\\\/]webpack\-wrap[\\\/]src[\\\/][a-zA-Z0-9_.\\\/]+?:([0-9]+?):[0-9]/;

const StackTraceCurrentMethod = /at ([a-zA-Z0-9_.]*)/;

const WpwRegex = {
    PathVersion, TestsChunk, StackTraceCurrentColumn, StackTraceCurrentFile, StackTraceCurrentFileAbs,
    StackTraceCurrentLine, StackTraceCurrentMethod
};

module.exports = WpwRegex;
