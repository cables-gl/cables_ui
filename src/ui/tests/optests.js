import { TalkerAPI } from "cables-shared-client";
import { Patch } from "cables";
import { platform } from "../platform.js";
import { loadProject, runPatch } from "./opexamples.js";

const DONE_TIMEOUT = 20000;

export const OP_TESTS_PATCHLIST_ID = "jRV_GF";

export const EVENT_TESTCASE_START = "opTestCaseStart";
export const EVENT_TESTCASE_DONE = "opTestCaseDone";
export const EVENT_TESTCASE_CHECK = "opTestCaseCheck";
export const EVENT_TESTCASE_CHECK_END = "opTestCaseCheckEnd";
export const EVENT_TEST_ASSERT = "opTestAssert";
export const ASSERT_ERROR_ID = "testAssert";

/**
 * @typedef TestPatch
 * @property {string} projectId
 * @property {string} title
 */

/**
 * @typedef AssertResult
 * @property {string} opId
 * @property {string} label
 * @property {boolean} passed
 * @property {any} expected
 * @property {any} actual
 * @property {boolean} [knownBug]
 * @property {string} [bug]
 */

/**
 * @typedef TestCaseResult
 * @property {string} name
 * @property {boolean} done
 * @property {number} numPassed
 * @property {number} numFailed
 * @property {number} numKnownBugs
 * @property {string[]} failed
 * @property {string[]} knownBugs
 */

/**
 * @param {string} listId
 * @returns {Promise<TestPatch[]>}
 */
export async function getTestPatches(listId)
{
    let projects = null;
    if (platform.isElectron())
    {
        const response = await fetch(platform.getCablesDocsUrl() + "/api/patchlists/patches/" + encodeURIComponent(listId));
        if (!response.ok) throw new Error("could not load patchlist " + listId + ": " + response.status);
        projects = (await response.json()).data;
    }
    else
    {
        projects = await new Promise((resolve, reject) =>
        {
            platform.talkerAPI.send(TalkerAPI.CMD_GET_PATCHLIST_PATCHES, { "listId": listId }, (err, r) =>
            {
                if (err) reject(new Error("could not load patchlist " + listId + ": " + (err.msg || err)));
                else resolve(r.data);
            });
        });
    }

    const tests = [];
    for (let i = 0; i < (projects || []).length; i++)
        tests.push({ "projectId": projects[i].shortId || projects[i]._id, "title": projects[i].name });
    return tests;
}

/**
 * @param {string} projectId
 * @returns {Promise<TestCaseResult[]>}
 */
export async function runTestPatch(projectId)
{
    const run = new TestRun();
    try
    {
        await runPatch(await loadProject(projectId), run);
    }
    catch (e)
    {
        const assertErrors = run.getAssertErrors();
        const otherErrors = [];
        const lines = e.message.split("\n");
        for (let i = 0; i < lines.length; i++)
            if (!assertErrors.includes(lines[i])) otherErrors.push(lines[i]);

        const error = new Error(otherErrors.join("\n"));
        error.testCases = run.getCases();
        throw error;
    }
    return run.getCases();
}

/**
 * @param {AssertResult} result
 */
function assertErrorText(result)
{
    let text = (result.label || result.opId) + ": expected " + JSON.stringify(result.expected) + ", got " + JSON.stringify(result.actual);
    if (result.knownBug && result.passed) text = (result.label || result.opId) + ": known bug fixed, untick Known Bug";
    if (result.knownBug && result.bug) text += " (" + result.bug + ")";
    return text;
}

/**
 * @param {AssertResult} result
 */
function isFailure(result)
{
    if (result.knownBug) return result.passed;
    return !result.passed;
}

class TestRun
{
    ignoreErrors = [ASSERT_ERROR_ID];

    /** @type {Object<string, {name: string, done: boolean}>} */
    #cases = {};

    /** @type {Object<string, {result: AssertResult, caseId: string}>} */
    #asserts = {};

    #checkingCaseId = null;

    /** @type {Patch} */
    #patch = null;
    #listeners = [];

    /**
     * @param {Patch} patch
     */
    start(patch)
    {
        this.#patch = patch;
        this.#listeners.push(patch.on(EVENT_TESTCASE_START, (opId, name) => { this.#cases[opId] = { "name": name, "done": false }; }));
        this.#listeners.push(patch.on(EVENT_TESTCASE_DONE, (opId) => { if (this.#cases[opId]) this.#cases[opId].done = true; }));
        this.#listeners.push(patch.on(EVENT_TESTCASE_CHECK, (opId) => { this.#checkingCaseId = opId; }));
        this.#listeners.push(patch.on(EVENT_TESTCASE_CHECK_END, () => { this.#checkingCaseId = null; }));
        this.#listeners.push(patch.on(EVENT_TEST_ASSERT, (result) => { this.#asserts[result.opId] = { "result": result, "caseId": this.#checkingCaseId }; }));
    }

    wait()
    {
        const startTime = performance.now();
        return new Promise((resolve, reject) =>
        {
            const check = () =>
            {
                const ids = Object.keys(this.#cases);
                const unfinished = [];
                for (let i = 0; i < ids.length; i++)
                    if (!this.#cases[ids[i]].done) unfinished.push(this.#cases[ids[i]].name || ids[i]);

                if (ids.length > 0 && unfinished.length == 0) return resolve();
                if (performance.now() - startTime > DONE_TIMEOUT)
                {
                    if (ids.length == 0) return reject(new Error("no TestCase op in patch"));
                    return reject(new Error("TestCase not done: " + unfinished.join(", ")));
                }
                setTimeout(check, 50);
            };
            check();
        });
    }

    getErrors()
    {
        const errors = [];
        if (Object.keys(this.#asserts).length == 0) errors.push("no assert was checked");
        errors.push(...this.getAssertErrors());
        return errors;
    }

    getAssertErrors()
    {
        const errors = [];
        const ids = Object.keys(this.#asserts);
        for (let i = 0; i < ids.length; i++)
        {
            const result = this.#asserts[ids[i]].result;
            if (isFailure(result)) errors.push(assertErrorText(result));
        }
        return errors;
    }

    /**
     * @returns {TestCaseResult[]}
     */
    getCases()
    {
        const byId = {};
        const caseIds = Object.keys(this.#cases);
        for (let i = 0; i < caseIds.length; i++)
        {
            const testCase = this.#cases[caseIds[i]];
            byId[caseIds[i]] = { "name": testCase.name || caseIds[i], "done": testCase.done, "numPassed": 0, "numFailed": 0, "numKnownBugs": 0, "failed": [], "knownBugs": [] };
        }

        const assertIds = Object.keys(this.#asserts);
        for (let i = 0; i < assertIds.length; i++)
        {
            const entry = this.#asserts[assertIds[i]];
            const caseId = entry.caseId || "none";
            if (!byId[caseId]) byId[caseId] = { "name": "asserts outside of a TestCase", "done": true, "numPassed": 0, "numFailed": 0, "numKnownBugs": 0, "failed": [], "knownBugs": [] };

            if (entry.result.knownBug && !entry.result.passed)
            {
                byId[caseId].numKnownBugs++;
                byId[caseId].knownBugs.push(assertErrorText(entry.result));
            }
            else if (!isFailure(entry.result))
            {
                byId[caseId].numPassed++;
            }
            else
            {
                byId[caseId].numFailed++;
                byId[caseId].failed.push(assertErrorText(entry.result));
            }
        }
        return Object.values(byId);
    }

    stop()
    {
        for (let i = 0; i < this.#listeners.length; i++) this.#patch.off(this.#listeners[i]);
        this.#listeners = [];
    }
}
