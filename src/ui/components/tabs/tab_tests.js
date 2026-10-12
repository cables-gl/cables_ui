import { Logger, TalkerAPI, ele } from "cables-shared-client";
import Tab from "../../elements/tabpanel/tab.js";
import TabPanel from "../../elements/tabpanel/tabpanel.js";
import { gui } from "../../gui.js";
import { platform } from "../../platform.js";
import { editorSession } from "../../elements/tabpanel/editor_session.js";
import { setup, run, testEvents } from "../../tests/index.js";

export default class TestsTab
{
    static TABSESSION_NAME = "tests";

    #log = new Logger("tests");
    #tab = null;
    #listEle = null;
    #summaryEle = null;
    #running = false;
    #numPassed = 0;
    #numFailed = 0;
    #numPending = 0;
    #startTime = 0;
    #failedTitles = [];

    /**
     * @param {TabPanel} tabs
     */
    constructor(tabs)
    {
        this.#tab = new Tab("Tests", { "icon": "check", "singleton": true, "padding": true });
        if (tabs.addTab(this.#tab, true) != this.#tab) return;

        editorSession.rememberOpenEditor(TestsTab.TABSESSION_NAME, "tests", {}, true);
        this.#tab.on(Tab.EVENT_CLOSE, () =>
        {
            editorSession.remove(TestsTab.TABSESSION_NAME, "tests");
        });

        this.#tab.addButton("Run all", () => { this.run(); });
        this.#tab.addButton("Run failed", () => { this.runFailed(); });

        this.#tab.html("<div class=\"tabContentScrollContainer testsTab\"><div class=\"testsSummary\"></div><div class=\"testsList\"></div></div>");
        this.#summaryEle = this.#tab.contentEle.querySelector(".testsSummary");
        this.#listEle = this.#tab.contentEle.querySelector(".testsList");

        setup({ "gui": gui, "platform": platform, "TalkerAPI": TalkerAPI });
        this.run();
    }

    runFailed()
    {
        if (this.#failedTitles.length == 0) return;
        this.run("^(" + this.#failedTitles.map(escapeRegex).join("|") + ")$");
    }

    /**
     * @param {string} [grep]
     */
    run(grep)
    {
        if (this.#running) return;
        this.#running = true;
        this.#numPassed = 0;
        this.#numFailed = 0;
        this.#numPending = 0;
        this.#failedTitles = [];
        this.#startTime = performance.now();
        this.#listEle.innerHTML = "";
        this.#updateSummary();

        const runner = run(grep ? new RegExp(grep) : null);

        runner.on(testEvents.EVENT_SUITE_BEGIN, (suite) =>
        {
            if (suite.root) return;
            const suiteEle = document.createElement("div");
            suiteEle.classList.add("testsSuite");
            suiteEle.innerText = suite.fullTitle();
            this.#listEle.appendChild(suiteEle);
        });

        runner.on(testEvents.EVENT_TEST_PASS, (test) =>
        {
            this.#numPassed++;
            this.#addTest(test, "pass");
        });

        runner.on(testEvents.EVENT_TEST_FAIL, (test, err) =>
        {
            this.#numFailed++;
            this.#failedTitles.push(test.fullTitle());
            this.#log.warn("failed:", test.fullTitle(), err.message);
            this.#addTest(test, "fail", err);
        });

        runner.on(testEvents.EVENT_TEST_PENDING, (test) =>
        {
            this.#numPending++;
            this.#addTest(test, "pending");
        });

        runner.on(testEvents.EVENT_RUN_END, () =>
        {
            this.#running = false;
            this.#updateSummary();
            this.#log.log(this.#numPassed + " passed, " + this.#numFailed + " failed, " + this.#numPending + " pending");
        });
    }

    #updateSummary()
    {
        let html = "";
        if (this.#running) html += "running... ";
        html += "<span class=\"pass\">" + this.#numPassed + " passed</span> ";
        html += "<span class=\"fail\">" + this.#numFailed + " failed</span> ";
        if (this.#numPending) html += this.#numPending + " pending ";
        if (!this.#running) html += "in " + Math.round(performance.now() - this.#startTime) + "ms";
        this.#summaryEle.innerHTML = html;
    }

    /**
     * @param {any} test
     * @param {string} state
     * @param {Error} [err]
     */
    #addTest(test, state, err)
    {
        const testEle = document.createElement("div");
        testEle.classList.add("testsTest", state);

        const titleEle = document.createElement("a");
        titleEle.innerText = test.title;
        if (test.duration) titleEle.innerText += " (" + test.duration + "ms)";
        ele.clickable(titleEle, () => { this.run("^" + escapeRegex(test.fullTitle()) + "$"); });
        testEle.appendChild(titleEle);

        if (err)
        {
            const errEle = document.createElement("pre");
            errEle.innerText = err.stack || err.message || String(err);
            testEle.appendChild(errEle);
        }

        this.#listEle.appendChild(testEle);
        this.#updateSummary();
    }
}

/**
 * @param {string} str
 */
function escapeRegex(str)
{
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
