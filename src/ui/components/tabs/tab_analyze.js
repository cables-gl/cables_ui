import Tab from "../../elements/tabpanel/tab";
import { getHandleBarHtml } from "../../utils/handlebars";
import text from "../../text";
import FindTab from "./tab_find";

export default class AnalyzePatchTab extends CABLES.EventTarget
{
    constructor(tabs)
    {
        super();
        this._tabs = tabs || gui.mainTabs;

        this._tab = new Tab("Analyze", { "icon": "list", "infotext": "tab_logging", "padding": true, "singleton": "true", });
        this._tabs.addTab(this._tab, true);
        gui.maintabPanel.show(true);

        this._html();
    }


    _html()
    {
        let report = "";
        const patch = gui.corePatch();

        report += "<h3>Ops</h3>";

        const opsCount = {};
        for (let i = 0; i < patch.ops.length; i++)
        {
            opsCount[patch.ops[i].objName] = opsCount[patch.ops[i].objName] || 0;
            opsCount[patch.ops[i].objName]++;
        }

        report += patch.ops.length + " Ops total<br/>";
        report += Object.keys(opsCount).length + " unique ops<br/>";
        report += "<br/>";

        {
            let arr = FindTab.searchOutDated(gui.corePatch().ops, []);
            report += arr.length + " outdated ops ";
            if (arr.length > 0) report += "<a class=\"button-small\" onclick=\"new CABLES.UI.FindTab(gui.mainTabs, ':outdated');\">find</a>";
            report += "<br/>";
        }
        {
            let arr = FindTab.searchPatchOps(gui.corePatch().ops, []);
            report += arr.length + " patch ops ";
            if (arr.length > 0) report += "<a class=\"button-small\" onclick=\"new CABLES.UI.FindTab(gui.mainTabs, ':notcoreops patch');\">find</a>";
            report += "<br/>";
        }
        {
            let arr = FindTab.searchUserOps(gui.corePatch().ops, []);
            report += arr.length + " user ops ";
            if (arr.length > 0) report += "<a class=\"button-small\" onclick=\"new CABLES.UI.FindTab(gui.mainTabs, ':user');\">find</a>";
            report += "<br/>";
        }
        {
            let arr = FindTab.searchTeamOps(gui.corePatch().ops, []);
            report += arr.length + " team ops ";
            if (arr.length > 0) report += "<a class=\"button-small\" onclick=\"new CABLES.UI.FindTab(gui.mainTabs, ':notcoreops team');\">find</a>";
            report += "<br/>";
        }
        {
            let arr = FindTab.searchExtensionOps(gui.corePatch().ops, []);
            report += arr.length + " extension ops ";
            if (arr.length > 0) report += "<a class=\"button-small\" onclick=\"new CABLES.UI.FindTab(gui.mainTabs, ':notcoreops extension');\">find</a>";
            report += "<br/>";
        }
        {
            let numHidden = 0;
            for (let i = 0; i < patch.ops.length; i++)
            {
                if (patch.ops[i].uiAttribs.hidden)
                    numHidden++;
            }
            report += numHidden + " hidden ops ";
            report += "<br/>";
        }

        report += "<h3>Vars</h3>";
        report += Object.keys(CABLES.patch.getVars()).length + " Variables<br/>";

        report += "<br/>";

        report += "<h3>Most used Ops</h3>";

        let opscountSorted = [];

        for (const i in opsCount) opscountSorted.push({ "name": i, "count": opsCount[i] });
        opscountSorted.sort((b, a) => { return a.count - b.count; });

        report += "<table>";
        for (let i = 0; i < Math.min(25, opscountSorted.length); i++)

            report += "<tr><td>" + opscountSorted[i].name + "</td><td> " + opscountSorted[i].count + "x </td></tr>";
        report += "</table>";

        // ---
        report += "<hr/>";

        report += "<h3>Subpatches</h3>";

        const subpatchNumOps = {};
        for (let i = 0; i < patch.ops.length; i++)
        {
            const key = patch.ops[i].uiAttribs.subPatch || "root";

            subpatchNumOps[key] = subpatchNumOps[key] || 0;
            subpatchNumOps[key]++;
        }

        for (const i in subpatchNumOps) report += subpatchNumOps[i] + " ops in " + i + " <br/>";

        /// /////////////////////////////////////////////////


        const serializeSizes = [];
        for (let i = 0; i < patch.ops.length; i++)
        {
            const str = JSON.stringify(patch.ops[i].getSerialized());
            serializeSizes.push(
                { "name": patch.ops[i].objName,
                    "id": patch.ops[i].id,
                    "size": str.length
                });
        }

        serializeSizes.sort((a, b) =>
        {
            return b.size - a.size;
        });

        report += "<hr/>";
        report += "<h3>Biggest Serialized Ops</h3>";

        report += "<table>";
        for (let i = 0; i < Math.min(25, serializeSizes.length); i++)
        {
            const s = Math.round(serializeSizes[i].size / 1024);
            if (s > 1)
                report += "<tr><td>" + serializeSizes[i].name + "</td><td>" + s + "kb</td></tr>";
        }
        report += "</table>";

        // new ModalDialog({ "html": report, "title": "Stats" });
        // let list = gui.corePatch().loading.getList();
        // let jobs = gui.jobs().getList();

        // for (let i = 0; i < jobs.length; i++)
        // {
        //     jobs[i].name = jobs[i].name || jobs[i].title;
        //     jobs[i].type = "editor";
        //     jobs[i].finished = false || jobs[i].finished;
        //     list.push(jobs[i]);
        // }

        // list.sort((a, b) => { return b.timeStart - a.timeStart; });

        // const html = getHandleBarHtml("tab_jobs", { "user": gui.user, "texts": text.preferences, "list": list });
        this._tab.html(report);
    }
}
