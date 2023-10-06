# WebpackWrap - JS/TS Webpack Build Wrapper

[![authors](https://img.shields.io/badge/authors-scott%20meesseman-6F02B5.svg?logo=visual%20studio%20code)](https://www.littlesm.com) [![app-category](https://img.shields.io/badge/category-releases%20automation%20npm-blue.svg)](https://www.spmeesseman.com) [![app-lang](https://img.shields.io/badge/language-typescript%20javascript-blue.svg)](https://www.spmeesseman.com) [![webpack-wrap](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-app--publisher-e10000.svg)](https://github.com/spmeesseman/webpack-wrap)

[![GitHub issues open](https://img.shields.io/github/issues-raw/spmeesseman/webpack%2dwrap.svg?logo=github)](https://github.com/spmeesseman/webpack-wrap/issues) [![GitHub issues closed](https://img.shields.io/github/issues-closed-raw/spmeesseman/webpack%2dwrap.svg?logo=github)](https://github.com/spmeesseman/webpack-wrap/issues) [![GitHub pull requests](https://img.shields.io/github/issues-pr/spmeesseman/webpack%2dwrap.svg?logo=github)](https://github.com/spmeesseman/webpack-wrap/pulls) [![GitHub last commit](https://img.shields.io/github/last-commit/spmeesseman/webpack%2dwrap.svg?logo=github)](https://github.com/spmeesseman/webpack-wrap)

[![PayPalDonate](https://img.shields.io/badge/paypal-donate-green.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=YWZXT3KE2L4BA&item_name=taskexplorer&currency_code=USD) [![codecov](https://codecov.io/gh/spmeesseman/webpack-wrap/branch/master/graph/badge.svg)](https://codecov.io/gh/spmeesseman/webpack-wrap) [![CodeFactor](https://www.codefactor.io/repository/github/spmeesseman/webpack-wrap/badge)](https://www.codefactor.io/repository/github/spmeesseman/webpack-wrap)

- [WebpackWrap - JS/TS Webpack Build Wrapper](#webpackwrap---jsts-webpack-build-wrapper)
  - [Description](#description)
  - [Requirements](#requirements)
  - [Installation](#installation)
  - [General Setup](#general-setup)
  - [Screenshots](#screenshots)
  - [Command Line and Options](#command-line-and-options)
    - [branch](#branch)
    - [buildPreCommand](#buildprecommand)
    - [changelogLineLen](#changeloglinelen)
    - [changelogSkip](#changelogskip)

## Description

The main purpose of this package is to provide a convenient interface for webpack builds acrosss projects.

## Requirements

- NodeJs 16.x
- JavaScript or TypeScript Project

## Installation

To install webpack-wrap globally, run the following command:

    npm install -g @spmeesseman/webpack-wrap

To install locally per project, run the following command from the directory containing the projects package.json file:

    npm install @spmeesseman/webpack-wrap

## General Setup

TODO

## Screenshots

TODO

on of http basic auth using an API token, i.e. username:token

## Command Line and Options

The following command line arguments and publishrc options are supported.

TODO

options examples:

### branch

|**Value Type**      |*__string__*|
| :----------------- | :--------- |
|**Value Default**   |*__trunk__*|
|**Command Line Arg**|*__-b \| --branch__*|

The branch to use.

For SVN, this should include the path to the branches directory, e.g.:

    branches/branch-name

SVN branch support can only work if there is a 'per project' branching folder / structure.  It is assumed that the 'tags' folders is named by convention, i.e. '/tags'

### buildPreCommand

|**Value Type**      |*__string \| string[]__*|
| :----------------- | :--------- |
|**Value Default**   ||
|**Command Line Arg**|*__n/a__*|

A script or list of scripts to run for the build stage, before the build process is started.

### changelogLineLen

|**Value Type**      |*__number__*|
| :----------------- | :--------- |
|**Value Default**   |80|
|**Command Line Arg**|*__-cll \| --changelog-line-len__*|

The maximum line length to use when parsing commits to populate the changelog file.

### changelogSkip

|**Value Type**      |*__boolean__*|
| :----------------- | :--------- |
|**Value Default**   |false|
|**Command Line Arg**|*__-clnt \| --changelog-skip__*|

Ignore / skip the changelog file stage.  Will not validate changelog file version.
