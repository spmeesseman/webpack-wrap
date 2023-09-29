/* eslint-disable import/no-extraneous-dependencies */

import { join, resolve } from "path";
import { TestRunner } from "@spmeesseman/test-utils";
import { copyFileSync, existsSync, mkdirSync } from "fs";


export const run = async () =>
{
    const xArgs = JSON.parse(process.env.xArgs || "[]"),
		  testArgs = JSON.parse(process.env.testArgs || "[]"),
		  clean = !xArgs.includes("--nyc-no-clean") || xArgs.includes("--nyc-clean"),
		  projectRoot = resolve(__dirname, "..", ".."),
		  verbose = xArgs.includes("--nyc-verbose"),
		  silent = xArgs.includes("--nyc-silent");

	const runner = new TestRunner(
	{
		isTypescript: false,
		moduleBuildDir: "dist",
		moduleName: "webpack-wrap",
		projectRoot,
		register: {
			sourceMapSupport: true,
			tsNode: true
		},
		coverage: {
			clean,
			htmlReportDark: true,
			tool: "nyc",
			config: {
				clean,
				cwd: projectRoot,
                // extends: "@istanbuljs/load-nyc-config",
				hookRequire: true,
				hookRunInContext: true,
				hookRunInThisContext: true,
				ignoreClassMethods: [
					"require", "onWindowStateChanged"
				],
				instrument: true,
				reportDir: "./.coverage",
				showProcessTree: verbose,
				silent,
				skipEmpty: true,
				reporter: [
					"text-summary", "html" // "text","lcov", "cobertura", "json", "lcov"
				],
				include: [
					"dist/webpack-wrap.js"
				],
				exclude: [
					"dist/test", "node_modules", "dist/vendor.js", "dist/runtime.js"
				]
                // sourceMap: isProdBuild,
                // produceSourceMap: false, // isProdBuild,
                // include: !isProdBuild ? [ "src/**/*.js" ] : [ "**/spm-license-server.js", "**/src/**/*.js" ],
                // exclude: [ "test/**", "node_modules/**", "**/external node-commonjs/**/*.js", "webpack/**/*.js" ],
			}
		},
		framework: {
			type: "mocha",
			root: __dirname,
			suite: testArgs,
			config: {
				ui: "tdd", // the TDD UI is being used in extension.test.ts (suite, test, etc.)
				color: true, // colored output from test results,
				timeout: 30000, // default timeout: 10 seconds
				retries: 0, // ,
				slow: 250,
				require: [
					"ts-node/register",
					"source-map-support/register"
				]
				// reporter: "mocha-multi-reporters",
				// reporterOptions: {
				//     reporterEnabled: "spec, mocha-junit-reporter",
				//     mochaJunitReporterReporterOptions: {
				//         mochaFile: __dirname + "/../../coverage/junit/extension_tests.xml",
				//         suiteTitleSeparatedBy: ": "
				//     }
				// }
			}
		}
	});

	try {
		await runner.run();
	}
	catch (error) {
		try {
			console.error(error.message);
		} catch (_) {}
		process.exit(1);
	};
};
