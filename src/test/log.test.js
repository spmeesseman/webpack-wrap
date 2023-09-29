/* eslint-disable prefer-arrow/prefer-arrow-functions */

const fs = require("fs").promises;
const path = require("path");
const testUtils = require("./utils");
const expect = require("chai").expect;
const { suite, suiteSetup, suiteTeardown, test } = require("mocha");


/** @type {ILog} */
let log;
/** @type {import('../lib/utils')} */
let utils;
/** @type {number} */
let origLogLevel = 0;


const runRequestLogging = () =>
{
    log.payload({ data: "some data", data2: 19 });
    log.payload({ data: "some data", data2: 19 }, 5);
    log.payload({ data: "some data", data2: 19 }, 1, "", "main", "info");
    log.payload({ data: "some data", data2: 19 }, 1, "");
    log.payload("{\"p1\":\"v1\", \"p2\":\"v2\"}", 1, ""); // string
    log.payload("Just a normal string", 1, ""); // string
    // > 500 bytes
    log.payload(`Just a normal long piece of data >500 bytes which will get only
    the first 500 bytes written to the console, but the entire message to the **
    log file********************************************************************
    ****************************************************************************
    ****************************************************************************
    ****************************************************************************
    ****************************************************************************
    ****************************************************************************
    ****************************************************************************
    ****************************************************************************
    ********************`, 1, "");
    log.request({ body: { Id: "T33474358757269" } }, 1, "   ", "");
    log.request({ body: { Id: "T33474358757269" } }, 2, "");
    log.request({ body: { Id: "T33474358757269" } }, 3);
    log.request({ body: { Id: "T33474358757269" } }, 4);
    log.request({ body: { Id: "T33474358757269" } }, 5, "", "main");
    log.request({ body: { Id: "T33474358757269" } });
    log.request({ body: { Id: "T33474358757269" } }, 5, "", "", 1.5);
    log.request({ body: { Id: "T33474358757269" } }, 5, "", "", 2.5);
    log.request({ body: { Id: "T33474358757269" } }, 5, "", "", 1);
    log.request({ body: { Id: "T33474358757269" } }, 5, "", "", 0);
    log.request({ body: { Id: "T33474358757269" } }, 5, "", "", 0.75);
    log.request({ body: { Id: "T33474358757269" } }, 5, "", "", 0.5);
    log.request({ body: { Id: "T33474358757269" } }, 5, "", "", -1);
    // @ts-ignore
    log.request({ body: { Id: "T33474358757269" } }, 5, "", "", "1.2");
    // @ts-ignore
    log.request({ body: { Id: "T33474358757269" } }, 5, "", "", "1.2", "info");
    // @ts-ignore
    log.request({ body: { Id: "T33474358757269" } }, 5, "", "", "1", "warn");
    // @ts-ignore
    log.request({ body: { Id: "T33474358757269" } }, 5, "", "", null, "start");
};

const runSepLogging = () =>
{
    log.sep();
    log.sep([], 1);
    log.sep("red");
    log.sep("red", 1);
    log.sep("red", 2);
    log.sep("red", 3);
    log.sep("red", 4);
    log.sep("red", 5);
    // @ts-ignore
    log.sep([ 1 ], 1);
    log.sep([ "green" ]);
    log.sep([ "green" ], 1);
    // @ts-ignore
    log.sep([ 1, "green" ], 1);
    log.sep([ "blue", "yellow" ], 1, "   ");
    log.sep([ "blue", "yellow" ]);
    log.sep([ "red", "white", "blue" ]);
    log.sep([ "blue", "green" ], 1, "", "test", 1.5);
    log.sep([ "blue", "yellow" ], 1, "", "test", 1);
    log.sep([ "blue", "red" ], 1, "", "test", 0.65);
    log.sep([ "blue", "orange" ], 1, "", "test", 0.2);
    log.sep([ "blue", "blue" ], 1, "", "", -11);
    log.sep([ "blue", "yellow" ], 1, "", "", 2.23);
    log.sep([ "white", "yellow", "red" ], 1, "", "", 0);
    log.sep([ "white", "yellow", "red" ], 1, "", "", 0, "start");
    log.sep([ "white", "yellow", "red" ], 1, "", "", 1, "info");
    // @ts-ignore
    log.sep([ "white", "yellow", "red" ], 1, "", "", null, "warn");
    log.sepWrap("Message1");
    log.sepWrap("Message1", true);
    log.sepWrap("Message1", false);
    log.sepWrap("Message1", false, true);
    log.sepWrap("Message1", true, false);
    log.sepWrap("Message1", true, true);
    log.sepWrap("Message1", true, true, "red", 1, "", "colors");
    log.sepWrap("Message2", true, true, [ "red" ], 1, "");
    log.sepWrap("Message3", true, true, [ "red", "blue" ], 1);
    log.sepWrap("Message4", true, true, [ "red", "blue" ], 5);
    log.sepWrap("Message5", true, true, [ "red", "blue", "green" ], 1);
    log.sepWrap("Message6", true, true, [ "red", "blue", "green" ]);
    log.sepWrap("Message7", true, false, [ "red", "blue", "green" ]);
    log.sepWrap("Message8", false, false, [ "red", "blue", "green" ]);
    log.sepWrap("Message9", false, true, [ "red", "blue", "green" ], 2, "");
    log.sepWrap("Message9", false, true, [ "red", "blue", "green" ], 2, "", "main", 1.5);
    log.sepWrap("Message9", true, true, [ "red", "blue", "green" ], 2, "", "", 1.2);
    log.sepWrap("Message9", false, false, [ "red", "blue" ], 1, "", "main", 0.755);
    log.sepWrap("Message9", true, false, [ "red", "blue" ], 1, "", "main", 0.2);
    log.sepWrap("Message9", false, true, [ "red", "blue", "green" ], 1, "", "", -1.5);
    log.sepWrap("Message9", true, false, [ "red", "blue", "green" ], 2, "", "", 2.5);
    log.sepWrap("Message9", true, false, [ "red", "blue", "green" ], 2, "", "", 0);
    log.sepWrap("Message9", false, false, [ "red", "blue" ], 1, "   ", "", 0.755);
    log.sepWrap("Message9", true, false, [ "red", "blue" ], 1, "   ", "", 0.755);
    // @ts-ignore
    log.sepWrap("Message9", false, false, [ "red", "blue" ], 1, "   ", "", "0.7");
    log.sepWrap("Message9", false, false, [ "red", "blue" ], 1, "   ", "", 1, "start");
    // @ts-ignore
    log.sepWrap("Message9", false, false, [ "red", "blue" ], 1, "   ", "", null, "info");
    log.sepWrap("Message9", false, false, [ "red", "blue" ], 1, "   ", "", 0, "info", false);
    log.sepWrap("Message9", false, false, [ "red", "blue" ], 1, "   ", "", 1, "info", false);
    log.sepWrap("Message9", false, false, [ "red", "blue" ], 1, "   ", "", 1, "info", true);
    log.sepWrap("Message9", true, false, [ "red", "blue" ], 1, "   ", "", 0, "info", false);
    log.sepWrap("Message9", true, true, [ "red", "blue" ], 1, "   ", "", 1, "info", false);
    log.sepWrap("Message9", true, false, [ "red", "blue" ], 1, "   ", "", 1, "info", true);
};

const runValueLogging = () =>
{
    log.value("Logging Tests", "Value", 2);
    log.value("", "Value", 2);
    log.value("", "", 2);
    log.value("", null, 2);
    // @ts-ignore
    log.value(null, null, 2);
    log.value("Logging Tests", true, 2);
    log.value("Logging Tests", false, 2);
    log.value("Logging Tests", 111, 2);
    log.value("Logging Tests", null, 2);
    log.value("Logging Tests", undefined, 2);
    // @ts-ignore
    log.value("Logging Tests");
    log.value("Logging Tests", "Value", 2, "", "main", "start");
    // @ts-ignore
    log.value("Logging Tests", "Value", 2, "", null, "info");
    log.values([
        [ "Property1", "Value1" ], [ "Property2", "Value2" ], [ "Property3", "Value3" ],
        [ "Property4", true ], [ "Property5", false ], [ "Property6", null ], [ "Property7", 111 ]
    ]);
    log.values([
        [ "Property1", undefined ], [ "Property2", null ], [ "", "" ], [ "Property3" ]
    ], 2);
    log.values([
        [ "Property1", "Value1" ], [ "Property2", "Value2" ], [ "Property3", [ "33", "333", "3333" ]], [ "Property4", "Value4" ]
    ], 2, "   ", true);
    log.values([
        [ "Property1", "Value1" ], [ "Property2", "Value2" ], [ "Property3", [ "33", "333", "3333" ]], [ "Property4", "Value4" ]
    ], 2, "   ", true, "main", "start");
    log.values([
        [ "Property1", "Value1" ], [ "Property2", "Value2" ], [ "Property3", [ "33", "333", "3333" ]], [ "Property4", "Value4" ]
    ], 2, "   ", true, undefined, "star");
};

const runLogFunctions = () =>
{
    log.blank();
    log.blank();
    log.blank();
    // @ts-ignore
    log.color();
    log.color("main");
    log.color("main", [ "red", "blue" ]);
    log.color("main", [ "red", "blue" ], 1);
    log.color("main", [ "red", "blue" ], 2, "   ");
    // @ts-ignore
    log.color("main", [ "red", "blue" ], 2, "", null, "star");
    // @ts-ignore
    log.color("main", [ "red", "blue" ], 2, null, "main", "info");
    // @ts-ignore
    log.color("main", null, 2, "   ");
    // @ts-ignore
    log.color(null, "message");
    log.info("Logging Tests");
    log.info("Logging Tests", 0);
    log.info("Logging Tests", 1);
    log.info("Logging Tests", 2, "");
    log.star("Logging Tests", 1);
    log.star("Logging Tests", 3, "   ");
    log.star("Logging Tests", 5);
    log.complete("Logging Tests", 1);
    log.complete("Logging Tests", 3, "   ");
    log.complete("Logging Tests", 5);
    log.scope("main", "message");
    log.scope("main", "message", 1);
    log.scope("main", "message", 2, "   ");
    log.scope("main", "message", 2, "", "star");
    // @ts-ignore
    log.scope("main", "message", 2, null, "info");
    // @ts-ignore
    log.scope("main", null, 2, "   ");
    // @ts-ignore
    log.scope(null, "message");
    log.start("Logging Tests", 2);
    log.success("Logging Tests", 3);
    log.warn("Logging Tests", 4);
    log.write("");
    // @ts-ignore
    log.write(undefined, 1);
    // @ts-ignore
    log.write(null, 2, "   ");
    log.write("");
    log.write(" ");
    log.write("  ");
    log.write("test");
    log.write("  ");
    log.write(" ");
    log.write("");
    log.write("test");
    runRequestLogging();
    runSepLogging();
    runValueLogging();
};

/** @type {string[]} */
const deletes = [];


suite("Logging Tests", () =>
{

    suiteSetup(function()
    {
        log = testUtils.getApp().log;
        utils = testUtils.getApp().utils;
        origLogLevel = log.getLogLevel();
        log.setLogLevel(3);
	});


	suiteTeardown(async function()
    {
        log.setLogLevel(origLogLevel);
        for (const d of deletes) {
            /* istanbul ignore next */
            try {
                /* istanbul ignore next */
                await fs.rm(d, { recursive: true, force: true });
            } catch (e) {}
        }
	});


    test("Logging - Base Functions", async function()
    {
        runLogFunctions();
    });


    test("Logging - Scopes", async function()
    {
        log.payload({ data: "some data", data2: 19 }, 1, "", "experian");
        log.start("Logging Tests", 2, "", "data");
        log.value("Logging Tests", "Value", 2, "seven");
        log.write("Logging Tests", 2, "", "back");
        log.write("Logging Tests", 2, "");
        log.write("Logging Tests", 2, "", "main");
        log.write("Logging Tests", 2, "", "try");
        log.write("Logging Tests", 2, "", "db");
    });


    test("Logging - Message Types", async function()
    {
        log.value("test", "value", 1, "", "", "complete");
        log.value("test", "value", 1, "", "", "error");
        log.value("test", "value", 1, "", "", "info");
        log.value("test", "value", 1, "", "", "star");
        log.value("test", "value", 1, "", "", "start");
        log.value("test", "value", 1, "", "", "success");
        log.value("test", "value", 1, "", "", "warn");
        log.value("test", "value", 1, "", "", "write");
    });


    test("Logging - Experian Event", async function()
    {
        log.getDirPath();
        log.getFilePath();

        const jso = {
            body: testUtils.getDefaultReqData()
        };
        log.eventExperian(1, jso);
        log.eventExperian(11, jso, 0);
        log.eventExperian(111, jso, 1);
        log.eventExperian(1111, jso, 0, "");
        log.eventExperian(11111, jso, 1, "   ");
        log.eventExperian(111111, jso, 1, "      ");
        log.eventExperian(11111, jso, 4);
        log.eventExperian(1111, jso, 5);
        // @ts-ignore
        log.eventExperian(null, jso);
        log.eventExperian("Invalid", jso);
        log.eventExperian(1111, jso, 5);
        log.eventExperian(1111, jso, 5, "", "main");
    });


    test("Logging - Headers", async function()
    {
        const hdrObject = testUtils.getDefaultReqOptions();
        // @ts-ignore
        log.header(hdrObject);
        // @ts-ignore
        log.header(hdrObject, "Content-Type");
        log.header(hdrObject, [ "Content-Type" ]);
        log.header(hdrObject, [ "Content-Type", "authorization" ], 2, "");
        // @ts-ignore
        log.header(hdrObject, null, 2, "", null, "star");
        // @ts-ignore
        log.header(hdrObject, null, 1, "", "main", "info");
        // @ts-ignore
        log.header(hdrObject, null, 1, "");
        // @ts-ignore
        log.header(hdrObject, null, 1, "", null);
        // @ts-ignore
        log.header(hdrObject, null, 1, "", null, null);
        // @ts-ignore
        log.header(null, null, 1, "", null, null);
        // @ts-ignore
        log.header({ noHdr: [] }, null, 1, "", null, null);
        // @ts-ignore
        log.header({ headers: [] });
    });


    test("Logging - Requests", async function()
    {
        runRequestLogging();
    });


    test("Logging - Values", async function()
    {
        runValueLogging();
    });


    test("Logging - Separators", async function()
    {
        runSepLogging();
    });


    test("Logging - Set Log Name", async function()
    {
        let f1, f2, f3, f4;
        const logFilePath = log.getFilePath();
        log.disableLogFile(true);
        log.disableLogging(false);
        log.disableLogFile(false);
        log.setLogName("tmp-log.out.log");
        f1 = path.basename(log.getFilePath());
        expect(log.getFilePath()).to.include("tmp-log.out.log");
        runLogFunctions();
        let cnt = await fs.readFile(log.getFilePath());
        expect(cnt.toString().length).to.be.greaterThan(15000);
        log.setLogName("tmp-log.out2.log");
        f2 = path.basename(log.getFilePath());
        expect(log.getFilePath()).to.include("tmp-log.out2.log");
        runLogFunctions();
        cnt = await fs.readFile(log.getFilePath());
        expect(cnt.toString().length).to.be.greaterThan(15000);
        log.disableLogFile(true);
        log.disableLogging(true);
        log.setLogName("tmp-log.out3.log");
        f3 = path.basename(log.getFilePath());
        expect(log.getFilePath()).to.include("tmp-log.out3.log");
        runLogFunctions();
        cnt = await fs.readFile(log.getFilePath());
        expect(cnt.toString().length).to.be.equal(0);
        log.disableLogFile(false);
        log.disableLogging(false);
        log.setLogName("tmp-log.out4.log");
        f4 = path.basename(log.getFilePath());
        expect(log.getFilePath()).to.include("tmp-log.out4.log");
        runLogFunctions();
        cnt = await fs.readFile(log.getFilePath());
        expect(cnt.toString().length).to.be.greaterThan(15000);
        await fs.unlink(path.join(log.getDirPath(), f1));
        await fs.unlink(path.join(log.getDirPath(), f2));
        await fs.unlink(path.join(log.getDirPath(), f3));
        await fs.unlink(path.join(log.getDirPath(), f4));
        log.setLogName(path.basename(logFilePath));
        log.disableLogFile(false);
        log.disableLogging(false);
    });


    test("Logging - Disable log file", async function()
    {
        log.disableLogFile(true);
        log.disableLogFile(false);
        log.disableLogFile(true);
        log.disableLogFile(false);
        log.disableLogFile(false);
        log.disableLogFile(false);
        log.disableLogFile(true);
        log.setLogDir("log");
        log.disableLogFile(true);
        runLogFunctions();
        log.disableLogFile(false);
        log.setLogDir("log");
        log.disableLogFile(false);
        runLogFunctions();
    });


    test("Logging - Disable logging", async function()
    {
        log.disableLogFile(true);
        log.disableLogFile(false);
        log.disableLogFile(true);
        log.disableLogFile(true);
        log.disableLogging(true);
        log.setLogDir("log");
        log.disableLogging(true);
        runLogFunctions();
        log.disableLogging(false);
        log.setLogDir("log");
        log.disableLogging(false);
        runLogFunctions();
    });


    test("Logging - On / Off / No Log Directory", async function()
    {
        await utils.sleep(250);
        let logPath = log.setLogDir("__log");
        runLogFunctions();
        log.disableLogFile(false);
        logPath = log.setLogDir("__log");
        runLogFunctions();
        await utils.sleep(750);
        log.setLogDir("log");
        try {
            await fs.rm(logPath, { recursive: true, force: true });
        } catch (e) {}
        log.setLogDir("log");
        log.setLogDir("log");
        runLogFunctions();
    });


    test("Logging - Miscellaneous", async function()
    {
        const yy = (new Date()).getFullYear(),
              msg = "This is a\r\ntest for\nline breaks",
              msg2 = "This is a\ntest for line\r\nbreaks",
              d1 = new Date(yy, 8, 15, 8, 0, 0),
              d2 = new Date(yy, 11, 5, 8, 0, 10),
              d3 = new Date(yy, 7, 20, 22, 0, 0),
              d4 = new Date(yy, 10, 1, 22, 10, 0);

        log.write(msg);
        log.write(msg2);
        log.write(utils.dateToYMD(d1));
        log.write(utils.dateToYMD(d2));
        log.write(utils.dateToYMD(d3));
        log.write(utils.dateToYMD(d4));
        log.write(utils.dateToYMD(d4, "/"));

        log.write(utils.dateToMDY(d1));
        log.write(utils.dateToMDY(d2));
        log.write(utils.dateToMDY(d3));
        log.write(utils.dateToMDY(d4));
        // @ts-ignore
        log.write(utils.dateToMDY(d4), "-");

        log.write(utils.dateToHMS(d1));
        log.write(utils.dateToHMS(d2));
        log.write(utils.dateToHMS(d3));
        log.write(utils.dateToHMS(d4));
        // @ts-ignore
        log.write(utils.dateToHMS(d4), ":");

        /* istanbul ignore next */
        log.write(utils.isString("Test") ? "Is string" : "No string");
        /* istanbul ignore next */
        log.write(utils.isString(100) ? "Is string" : "No string");
        /* istanbul ignore next */
        log.write(utils.isString(false) ? "Is string" : "No string");
        /* istanbul ignore next */
        log.write(utils.isString([ "Test" ]) ? "Is string" : "No string");
        /* istanbul ignore next */
        log.write(utils.isNumber("Test") ? "Is number" : "No number");
        /* istanbul ignore next */
        log.write(utils.isNumber(100) ? "Is number" : "No number");
        /* istanbul ignore next */
        log.write(utils.isNumber(false) ? "Is number" : "No number");
        /* istanbul ignore next */
        log.write(utils.isNumber([ 100 ]) ? "Is number" : "No number");
    });

});
