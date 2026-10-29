import { Logger, ele } from "cables-shared-client";
import Tab from "../../elements/tabpanel/tab.js";
import TabPanel from "../../elements/tabpanel/tabpanel.js";
import { editorSession } from "../../elements/tabpanel/editor_session.js";
import { getOpExamples, runOpExample } from "../../tests/opexamples.js";
import { platform } from "../../platform.js";

export default class OpExampleTestsTab
{
    static TABSESSION_NAME = "opexampletests";

    #log = new Logger("opexampletests");
    #filter = "";
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
        this.#tab = new Tab("Op Example Tests", { "icon": "check", "singleton": true, "padding": true });
        if (tabs.addTab(this.#tab, true) != this.#tab) return;

        this.#filter = data.filter || "";
        editorSession.rememberOpenEditor(OpExampleTestsTab.TABSESSION_NAME, OpExampleTestsTab.TABSESSION_NAME, { "filter": this.#filter }, true);
        this.#tab.on(Tab.EVENT_CLOSE, () =>
        {
            this.#stop = true;
            editorSession.remove(OpExampleTestsTab.TABSESSION_NAME, OpExampleTestsTab.TABSESSION_NAME);
        });

        this.#tab.addButton("Run all", () => { this.run(this.#getFiltered()); });
        this.#tab.addButton("Run failed", () => { this.runFailed(); });
        this.#tab.addButton("Stop", () => { this.#stop = true; });
        this.#tab.addButton("Randomize", () => { this.randomize(); });

        this.#tab.html("<div class=\"tabContentScrollContainer testsTab\"><input class=\"medium info testsFilter\" type=\"search\" placeholder=\"filter op name\"/><div class=\"testsSummary\"></div><div class=\"testsList\"></div></div>");
        this.#summaryEle = this.#tab.contentEle.querySelector(".testsSummary");
        this.#listEle = this.#tab.contentEle.querySelector(".testsList");

        const filterEle = this.#tab.contentEle.querySelector(".testsFilter");
        filterEle.value = this.#filter;
        filterEle.addEventListener("input", () => { this.#setFilter(filterEle.value); });

        this.#examples = getOpExamples();
        for (let i = 0; i < this.#examples.length; i++) this.#addRow(this.#examples[i]);
        this.#applyFilter();
    }

    /**
     * @param {string} filter
     */
    #setFilter(filter)
    {
        this.#filter = filter;
        editorSession.rememberOpenEditor(OpExampleTestsTab.TABSESSION_NAME, OpExampleTestsTab.TABSESSION_NAME, { "filter": this.#filter }, true);
        this.#applyFilter();
    }

    /**
     * @param {import("../../tests/opexamples.js").OpExample} example
     */
    #matchesFilter(example)
    {
        const filter = this.#filter.toLowerCase();
        if (!filter) return true;
        for (let i = 0; i < example.opNames.length; i++)
            if (example.opNames[i].toLowerCase().includes(filter)) return true;
        return false;
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
     * @param {import("../../tests/opexamples.js").OpExample[]} examples
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
                // eslint-disable-next-line no-await-in-loop
                await runOpExample(example.projectId);
                this.#setResult(example.projectId, "pass");
            }
            catch (e)
            {
                this.#log.warn("failed:", example.opNames.join(", "), e.message);
                this.#setResult(example.projectId, "fail", e.message);
            }
        }

        this.#running = false;
        this.#updateSummary();
    }

    /**
     * @param {import("../../tests/opexamples.js").OpExample} example
     */
    #addRow(example)
    {
        const rowEle = document.createElement("div");
        rowEle.classList.add("testsTest");

        const titleEle = document.createElement("a");
        titleEle.innerText = example.opNames.join(", ");
        ele.clickable(titleEle, () => { this.run([example]); });
        rowEle.appendChild(titleEle);

        const linkEle = document.createElement("a");
        linkEle.classList.add("link");
        linkEle.innerText = example.projectId;
        ele.clickable(linkEle, () => { window.open(platform.getCablesDocsUrl() + "/edit/" + example.projectId, "_blank"); });
        rowEle.append(" (", linkEle, ")");

        this.#listEle.appendChild(rowEle);
        this.#rowEles[example.projectId] = rowEle;
    }

    /**
     * @param {string} projectId
     * @param {string} state
     * @param {string} [errorText]
     */
    #setResult(projectId, state, errorText)
    {
        this.#results[projectId] = { "state": state, "error": errorText };

        const rowEle = this.#rowEles[projectId];
        rowEle.classList.remove("pass", "fail", "pending", "running");
        rowEle.classList.add(state);

        const oldErrEle = rowEle.querySelector(".testsError");
        if (oldErrEle) oldErrEle.remove();
        if (errorText)
        {
            const errEle = document.createElement("pre");
            errEle.classList.add("testsError");
            errEle.innerText = errorText;
            rowEle.appendChild(errEle);
        }

        if (state == "running") rowEle.scrollIntoView({ "block": "nearest" });
        this.#updateSummary();
    }

    #updateSummary()
    {
        let numPassed = 0;
        let numFailed = 0;
        const examples = this.#getFiltered();
        for (let i = 0; i < examples.length; i++)
        {
            const result = this.#results[examples[i].projectId];
            if (!result) continue;
            if (result.state == "pass") numPassed++;
            if (result.state == "fail") numFailed++;
        }

        let html = examples.length + " example patches ";
        if (this.#running) html += "running " + this.#current + "/" + this.#total + "... ";
        html += "<span class=\"pass\">" + numPassed + " passed</span> ";
        html += "<span class=\"fail\">" + numFailed + " failed</span> ";
        if (!this.#running && this.#startTime) html += "in " + Math.round((performance.now() - this.#startTime) / 1000) + "s";
        this.#summaryEle.innerHTML = html;
    }
}
