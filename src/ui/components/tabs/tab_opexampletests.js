import { Logger, ele } from "cables-shared-client";
import Tab from "../../elements/tabpanel/tab.js";
import TabPanel from "../../elements/tabpanel/tabpanel.js";
import { editorSession } from "../../elements/tabpanel/editor_session.js";
import { getOpExamples, runOpExample } from "../../tests/opexamples.js";
import { getTestPatches, runTestPatch } from "../../tests/optests.js";
import { platform } from "../../platform.js";

const STATE_LABELS = { "pass": "pass", "fail": "fail", "knownbug": "known bug", "pending": "pending", "running": "running" };

export default class OpExampleTestsTab
{
    static TABSESSION_NAME = "opexampletests";
    static TABSESSION_NAME_OPTESTS = "optests";

    #log = new Logger("opexampletests");
    #filter = "";
    #listId = "";
    #sessionName = OpExampleTestsTab.TABSESSION_NAME;
    #tab = null;
    #listEle = null;
    #summaryEle = null;
    #examples = [];
    #rowEles = {};
    #results = {};
    #running = false;
    #stop = false;
    #current = 0;
    #total = 0;
    #startTime = 0;

    /**
     * @param {TabPanel} tabs
     * @param {any} [data]
     */
    constructor(tabs, data = {})
    {
        this.#listId = data.listId || "";
        if (this.#listId) this.#sessionName = OpExampleTestsTab.TABSESSION_NAME_OPTESTS;

        this.#tab = new Tab(this.#listId ? "Op Tests" : "Op Example Tests", { "icon": "check", "singleton": true, "padding": true });
        if (tabs.addTab(this.#tab, true) != this.#tab) return;

        this.#filter = data.filter || "";
        this.#rememberSession();
        this.#tab.on(Tab.EVENT_CLOSE, () =>
        {
            this.#stop = true;
            editorSession.remove(this.#sessionName, this.#sessionName);
        });

        this.#tab.addButton("Run all", () => { this.run(this.#getFiltered()); });
        this.#tab.addButton("Run failed", () => { this.runFailed(); });
        this.#tab.addButton("Stop", () => { this.#stop = true; });
        this.#tab.addButton("Randomize", () => { this.randomize(); });

        this.#tab.html("<div class=\"tabContentScrollContainer testsTab\"><input class=\"medium info testsFilter\" type=\"search\" placeholder=\"filter op name\"/><div class=\"testsSummary\"></div><table class=\"testsTable\"><thead><tr><th>Status</th><th>Test</th><th>Passed</th><th>Failed</th><th>Known Bugs</th><th>Asserts</th></tr></thead></table></div>");
        this.#summaryEle = this.#tab.contentEle.querySelector(".testsSummary");
        this.#listEle = this.#tab.contentEle.querySelector(".testsTable");

        const filterEle = this.#tab.contentEle.querySelector(".testsFilter");
        filterEle.value = this.#filter;
        filterEle.addEventListener("input", () => { this.#setFilter(filterEle.value); });

        this.#loadEntries();
    }

    async #loadEntries()
    {
        if (!this.#listId)
        {
            const examples = getOpExamples();
            for (let i = 0; i < examples.length; i++) this.#examples.push({ "projectId": examples[i].projectId, "title": examples[i].opNames.join(", ") });
        }
        else
        {
            try
            {
                this.#examples = await getTestPatches(this.#listId);
            }
            catch (e)
            {
                this.#summaryEle.innerText = e.message;
                return;
            }
        }

        for (let i = 0; i < this.#examples.length; i++) this.#addRow(this.#examples[i]);
        this.#applyFilter();
    }

    #rememberSession()
    {
        editorSession.rememberOpenEditor(this.#sessionName, this.#sessionName, { "filter": this.#filter, "listId": this.#listId }, true);
    }

    /**
     * @param {string} filter
     */
    #setFilter(filter)
    {
        this.#filter = filter;
        this.#rememberSession();
        this.#applyFilter();
    }

    /**
     * @param {import("../../tests/optests.js").TestPatch} example
     */
    #matchesFilter(example)
    {
        const filter = this.#filter.toLowerCase();
        if (!filter) return true;
        return example.title.toLowerCase().includes(filter);
    }

    #getFiltered()
    {
        const examples = [];
        for (let i = 0; i < this.#examples.length; i++)
            if (this.#matchesFilter(this.#examples[i])) examples.push(this.#examples[i]);
        return examples;
    }

    #applyFilter()
    {
        for (let i = 0; i < this.#examples.length; i++)
        {
            const rowEle = this.#rowEles[this.#examples[i].projectId];
            if (this.#matchesFilter(this.#examples[i])) rowEle.classList.remove("hidden");
            else rowEle.classList.add("hidden");
        }
        this.#updateSummary();
    }

    randomize()
    {
        if (this.#running) return;
        for (let i = this.#examples.length - 1; i > 0; i--)
        {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = this.#examples[i];
            this.#examples[i] = this.#examples[j];
            this.#examples[j] = tmp;
        }
        for (let i = 0; i < this.#examples.length; i++) this.#listEle.appendChild(this.#rowEles[this.#examples[i].projectId]);
    }

    runFailed()
    {
        const failed = [];
        const examples = this.#getFiltered();
        for (let i = 0; i < examples.length; i++)
            if (this.#results[examples[i].projectId] && this.#results[examples[i].projectId].state == "fail") failed.push(examples[i]);
        this.run(failed);
    }

    /**
     * @param {import("../../tests/optests.js").TestPatch[]} examples
     */
    async run(examples)
    {
        if (this.#running || examples.length == 0) return;
        this.#running = true;
        this.#stop = false;
        this.#current = 0;
        this.#total = examples.length;
        this.#startTime = performance.now();

        for (let i = 0; i < examples.length; i++) this.#setResult(examples[i].projectId, "pending");

        for (let i = 0; i < examples.length; i++)
        {
            if (this.#stop) break;
            const example = examples[i];
            this.#current = i + 1;
            this.#setResult(example.projectId, "running");
            try
            {
                const runner = this.#listId ? runTestPatch : runOpExample;
                // eslint-disable-next-line no-await-in-loop
                const testCases = await runner(example.projectId);
                this.#setResult(example.projectId, "pass", "", testCases);
            }
            catch (e)
            {
                this.#log.warn("failed:", example.title, e.message);
                this.#setResult(example.projectId, "fail", e.message, e.testCases);
            }
        }

        this.#running = false;
        this.#updateSummary();
    }

    /**
     * @param {import("../../tests/optests.js").TestPatch} example
     */
    #addRow(example)
    {
        const bodyEle = document.createElement("tbody");
        bodyEle.classList.add("testsTest");
        this.#listEle.appendChild(bodyEle);
        this.#rowEles[example.projectId] = bodyEle;
        this.#renderRows(example, "", "", null);
    }

    /**
     * @param {string} projectId
     */
    #getExample(projectId)
    {
        for (let i = 0; i < this.#examples.length; i++)
            if (this.#examples[i].projectId == projectId) return this.#examples[i];
        return null;
    }

    /**
     * @param {string} projectId
     * @param {string} state
     * @param {string} [errorText]
     * @param {import("../../tests/optests.js").TestCaseResult[]} [testCases]
     */
    #setResult(projectId, state, errorText, testCases)
    {
        this.#results[projectId] = { "state": state, "error": errorText, "numKnownBugs": countKnownBugs(testCases) };
        this.#renderRows(this.#getExample(projectId), state, errorText, testCases);

        if (state == "running") this.#rowEles[projectId].scrollIntoView({ "block": "nearest" });
        this.#updateSummary();
    }

    /**
     * @param {import("../../tests/optests.js").TestPatch} example
     * @param {string} state
     * @param {string} errorText
     * @param {import("../../tests/optests.js").TestCaseResult[]} testCases
     */
    #renderRows(example, state, errorText, testCases)
    {
        const bodyEle = this.#rowEles[example.projectId];
        bodyEle.innerHTML = "";

        let numPassed = 0;
        let numFailed = 0;
        let numKnownBugs = 0;
        if (testCases)
        {
            for (let i = 0; i < testCases.length; i++)
            {
                numPassed += testCases[i].numPassed;
                numFailed += testCases[i].numFailed;
                numKnownBugs += testCases[i].numKnownBugs || 0;
            }
        }

        let displayState = state;
        if (state == "pass" && numKnownBugs > 0) displayState = "knownbug";

        const titleEle = document.createElement("a");
        titleEle.innerText = example.title;
        ele.clickable(titleEle, () => { this.run([example]); });

        const linkEle = document.createElement("a");
        linkEle.classList.add("link");
        linkEle.innerText = example.projectId;
        ele.clickable(linkEle, () => { window.open(platform.getCablesDocsUrl() + "/edit/" + example.projectId, "_blank"); });

        const testEle = document.createElement("span");
        testEle.append(titleEle, " (", linkEle, ")");

        const rowEle = createRow("testsPatchRow", displayState, testEle, testCases ? [numPassed, numFailed, numKnownBugs] : null);
        bodyEle.appendChild(rowEle);

        if (testCases)
        {
            for (let i = 0; i < testCases.length; i++)
            {
                const testCase = testCases[i];
                const caseKnownBugs = testCase.numKnownBugs || 0;
                let caseState = "pass";
                if (caseKnownBugs > 0) caseState = "knownbug";
                if (testCase.numFailed > 0 || !testCase.done) caseState = "fail";

                let name = testCase.name;
                if (!testCase.done) name += ", not finished";
                bodyEle.appendChild(createRow("testsCaseRow", caseState, name, [testCase.numPassed, testCase.numFailed, caseKnownBugs]));

                for (let j = 0; j < testCase.failed.length; j++) bodyEle.appendChild(createDetailRow("testsAssertFail", testCase.failed[j]));
                for (let j = 0; j < (testCase.knownBugs || []).length; j++) bodyEle.appendChild(createDetailRow("testsAssertKnownBug", testCase.knownBugs[j]));
            }
        }

        if (errorText)
        {
            const errEle = document.createElement("pre");
            errEle.classList.add("testsError");
            errEle.innerText = errorText;
            bodyEle.appendChild(createDetailRow("testsErrorRow", errEle));
        }
    }

    #updateSummary()
    {
        let numPassed = 0;
        let numFailed = 0;
        let numKnownBugs = 0;
        const examples = this.#getFiltered();
        for (let i = 0; i < examples.length; i++)
        {
            const result = this.#results[examples[i].projectId];
            if (!result) continue;
            if (result.state == "pass") numPassed++;
            if (result.state == "fail") numFailed++;
            numKnownBugs += result.numKnownBugs;
        }

        let html = examples.length + (this.#listId ? " test patches " : " example patches ");
        if (this.#running) html += "running " + this.#current + "/" + this.#total + "... ";
        html += "<span class=\"pass\">" + numPassed + " passed</span> ";
        html += "<span class=\"fail\">" + numFailed + " failed</span> ";
        if (numKnownBugs > 0) html += "<span class=\"knownbug\">" + numKnownBugs + " known bugs</span> ";
        if (!this.#running && this.#startTime) html += "in " + Math.round((performance.now() - this.#startTime) / 1000) + "s";
        this.#summaryEle.innerHTML = html;
    }
}

/**
 * @param {import("../../tests/optests.js").TestCaseResult[]} [testCases]
 */
function countKnownBugs(testCases)
{
    let num = 0;
    if (!testCases) return num;
    for (let i = 0; i < testCases.length; i++) num += testCases[i].numKnownBugs || 0;
    return num;
}

/**
 * @param {string} className
 * @param {string} state
 * @param {string|HTMLElement} content
 * @param {number[]} counts
 */
function createRow(className, state, content, counts)
{
    const rowEle = document.createElement("tr");
    rowEle.classList.add(className);
    if (state) rowEle.classList.add(state);

    const statusEle = document.createElement("td");
    statusEle.classList.add("testsStatus");
    if (state) statusEle.classList.add(state);
    statusEle.innerText = STATE_LABELS[state] || "";
    rowEle.appendChild(statusEle);

    const testEle = document.createElement("td");
    testEle.append(content);
    rowEle.appendChild(testEle);

    const countClasses = ["", "fail", "knownbug"];
    for (let i = 0; i < 3; i++)
    {
        const countEle = document.createElement("td");
        countEle.classList.add("testsCount");
        if (counts)
        {
            countEle.innerText = String(counts[i]);
            if (countClasses[i] && counts[i] > 0) countEle.classList.add(countClasses[i]);
        }
        rowEle.appendChild(countEle);
    }

    const totalEle = document.createElement("td");
    totalEle.classList.add("testsCount");
    if (counts) totalEle.innerText = String(counts[0] + counts[1] + counts[2]);
    rowEle.appendChild(totalEle);
    return rowEle;
}

/**
 * @param {string} className
 * @param {string|HTMLElement} content
 */
function createDetailRow(className, content)
{
    const rowEle = document.createElement("tr");
    rowEle.classList.add(className);
    rowEle.appendChild(document.createElement("td"));
    const cellEle = document.createElement("td");
    cellEle.colSpan = 5;
    cellEle.append(content);
    rowEle.appendChild(cellEle);
    return rowEle;
}
