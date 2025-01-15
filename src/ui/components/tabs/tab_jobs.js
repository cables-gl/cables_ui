import { Events } from "cables-shared-client";
import Tab from "../../elements/tabpanel/tab.js";
import { getHandleBarHtml } from "../../utils/handlebars.js";
import text from "../../text.js";
import { gui } from "../../gui.js";

export default class JobsTab extends Events
{
    constructor(tabs)
    {
        super();
        this._tabs = tabs;

        this._tab = new Tab("Jobs", { "icon": "list", "infotext": "tab_logging", "padding": true, "singleton": "true", });
        this._tabs.addTab(this._tab, true);

        this._html();

        gui.corePatch().loading.on("finishedTask", this._html.bind(this));
        gui.corePatch().loading.on("addTask", this._html.bind(this));
        gui.corePatch().loading.on("startTask", this._html.bind(this));

        gui.jobs().on("taskAdd", this._html.bind(this));
        gui.jobs().on("taskFinish", this._html.bind(this));
    }

    _html()
    {
        let list = gui.corePatch().loading.getList();
        let jobs = gui.jobs().getList();

        for (let i = 0; i < jobs.length; i++)
        {
            jobs[i].name = jobs[i].name || jobs[i].title;
            jobs[i].type = jobs[i].type || "";
            jobs[i].finished = jobs[i].finished || false;
            list.push(jobs[i]);
        }

        list.sort((a, b) => { return b.timeStart - a.timeStart; });

        const html = getHandleBarHtml("tab_jobs", { "user": gui.user, "texts": text.preferences, "list": list });
        this._tab.html(html);
    }
}
