// @ts-check

/**
 * @file utils/regex.js
 * @version 0.0.1
 * @license MIT
 * @copyright Scott P Meesseman 2023
 * @author @spmeesseman Scott Meesseman
 */

const MessageContainsError = (/TS[0-9]{4}|error|fail(?:ed)?|could not|cannot|can'?t|unable to/i);

const PathVersion = /\/v([0-9]+\.[0-9]+\.[0-9]+(?:\-(?:pre|alpha|beta)\.[0-9]+)?)\//;

const SourceFile = / (?:[a-z]:)?[\\\/].*?[\\\/]webpack\-wrap[\\\/](.*?\.(?:c?m?js|ts)x?) /;

const SourceFileAbs = / ((?:[a-z]:)?[\\\/].*?[\\\/]webpack\-wrap[\\\/].*?\.(?:c?m?js|ts)x?) /;

const StackTraceCurrentColumn = /at [a-zA-Z0-9_.]+ +\(.*?[\\\/]webpack\-wrap[\\\/]src[\\\/][a-zA-Z0-9_.\\\/]+?:[0-9]+?:([0-9]+?)\) *$/;

const StackTraceCurrentFile = /at [a-zA-Z0-9_.]+ +\(.*?[\\\/]webpack\-wrap[\\\/](.*?\.(?:c?m?js|ts)x?):/;

const StackTraceCurrentFileAbs = /at [a-zA-Z0-9_.]+ +\((.*?[\\\/]webpack\-wrap[\\\/].*?\.(?:c?m?js|ts)x?):/;

const StackTraceCurrentLine = /at [a-zA-Z0-9_.]+ +\(.*?[\\\/]webpack\-wrap[\\\/]src[\\\/][a-zA-Z0-9_.\\\/]+?:([0-9]+?):[0-9]/;

const StackTraceCurrentMethod = /at ([a-zA-Z0-9_.]*)/;

const TestsChunk = (/[a-z]+\.(?:tests?|specs?)$|[\/\\]tests?|suite[\/\\]/i);


const WpwRegex = {
    MessageContainsError, PathVersion, SourceFile, SourceFileAbs, StackTraceCurrentColumn, StackTraceCurrentFile,
    StackTraceCurrentFileAbs, StackTraceCurrentLine, StackTraceCurrentMethod, TestsChunk
};

module.exports = WpwRegex;
