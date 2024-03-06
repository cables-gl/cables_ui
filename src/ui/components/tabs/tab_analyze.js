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
        report += "<div style=\"overflow:scroll;width:100%;height:100%\">";
        report += "<h2>Ops</h2>";

        const opsCount = {};
        for (let i = 0; i < patch.ops.length; i++)
        {
            opsCount[patch.ops[i].objName] = opsCount[patch.ops[i].objName] || 0;
            opsCount[patch.ops[i].objName]++;
        }

        report += patch.ops.length + " Ops total<br/>";
        report += Object.keys(opsCount).length + " unique ops<br/>";


        report += "<hr/>";
        report += "<h2>Op Types</h2>";


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

        report += "<hr/>";
        report += "<h2>Vars</h2>";
        report += Object.keys(CABLES.patch.getVars()).length + " Variables<br/>";


        report += "<hr/>";
        report += "<h2>Most used Ops</h2>";

        let opscountSorted = [];

        for (const i in opsCount) opscountSorted.push({ "name": i, "count": opsCount[i] });
        opscountSorted.sort((b, a) => { return a.count - b.count; });

        report += "<table>";
        for (let i = 0; i < Math.min(25, opscountSorted.length); i++)

            report += "<tr><td>" + opscountSorted[i].name + "</td><td> " + opscountSorted[i].count + "x </td></tr>";
        report += "</table>";

        // ---

        report += "<hr/>";
        report += "<h2>Subpatches</h2>";

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
        report += "<h2>Biggest Serialized Ops</h2>";

        report += "<table>";
        for (let i = 0; i < Math.min(25, serializeSizes.length); i++)
        {
            const s = Math.round(serializeSizes[i].size / 1024);
            if (s > 1)
                report += "<tr><td>" + serializeSizes[i].name + "</td><td>" + s + "kb</td></tr>";
        }
        report += "</table>";

        report += "</div>";

        this._tab.html(report);
    }
}
