import { Events } from "cables-shared-client";
import Tab from "../../elements/tabpanel/tab.js";
import FindTab from "./tab_find.js";
import { gui } from "../../gui.js";
/**
 * tab panel analyze patch shows information and statistics about the current patch
 */
export default class AnalyzePatchTab extends Events
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
        let report = "<h1>Analyze Patch</h1>";
        const patch = gui.corePatch();
        report += "<div style=\"overflow:scroll;width:100%;height:100%\">";
        report += "<h2>Ops</h2>";

        const opsCount = {};
        const opDirs = {};
        const hasOpDirs = CABLES.platform.frontendOptions.hasOpDirectories;

        for (let i = 0; i < patch.ops.length; i++)
        {
            const opName = patch.ops[i].objName;
            opsCount[opName] = opsCount[opName] || 0;
            opsCount[opName]++;
            if (hasOpDirs)
            {
                const doc = gui.opDocs.getOpDocByName(opName);
                const opDir = doc ? doc.opDir : null;
                if (opDir)
                {
                    opDirs[opDir] = opDirs[opDir] || 0;
                    opDirs[opDir]++;
                }
            }
        }

        report += patch.ops.length + " Ops total<br/>";
        report += Object.keys(opsCount).length + " unique ops<br/>";

        if (hasOpDirs)
        {
            report += "<hr/>";
            report += "<h2>Used Op Directories</h2>";
            Object.keys(opDirs).forEach((opDir) =>
            {
                report += opDirs[opDir] + " ops from " + opDir;
                report += "&nbsp;<a class=\"icon icon-folder icon-0_75x\" onClick=\"CABLESUILOADER.talkerAPI.send('openDir', { 'dir': '" + opDir + "'});\"></a>";
                report += "<br>";
            });
        }

        if (CABLES.platform.frontendOptions.hasAssetDirectories)
        {
            const ops = gui.corePatch().ops;
            const assets = {};
            let assetCount = 0;
            for (let i = 0; i < ops.length; i++)
            {
                for (let j = 0; j < ops[i].portsIn.length; j++)
                {
                    if (ops[i].portsIn[j].uiAttribs && ops[i].portsIn[j].uiAttribs.display && ops[i].portsIn[j].uiAttribs.display === "file")
                    {
                        const asset = ops[i].portsIn[j].get();
                        if (asset)
                        {
                            assets[asset] = assets[asset] || 0;
                            assets[asset]++;
                            assetCount++;
                        }
                    }
                }
            }

            report += "<hr/>";
            report += "<h2>Used Assets</h2>";

            report += assetCount + " Assets total<br/>";
            report += Object.keys(assets).length + " unique assets<br/>";
        }

        report += "<hr/>";
        report += "<h2>Op Types</h2>";

        {
            let arr = FindTab.searchOutDated(gui.corePatch().ops, []);
            if (arr.length > 0) report += "<a class=\"link\" onclick=\"new CABLES.UI.FindTab(gui.mainTabs, ':outdated');\">" + arr.length + " outdated ops </a><br/>";
        }
        {
            let arr = FindTab.searchPatchOps(gui.corePatch().ops, []);
            if (arr.length > 0) report += "<a class=\"link\" onclick=\"new CABLES.UI.FindTab(gui.mainTabs, ':notcoreops patch');\">" + arr.length + " patch ops </a><br/>";
        }
        {
            let arr = FindTab.searchUserOps(gui.corePatch().ops, []);
            if (arr.length > 0) report += "<a class=\"link\" onclick=\"new CABLES.UI.FindTab(gui.mainTabs, ':user');\">" + arr.length + " user ops </a><br/>";
        }
        {
            let arr = FindTab.searchTeamOps(gui.corePatch().ops, []);
            if (arr.length > 0) report += "<a class=\"link\" onclick=\"new CABLES.UI.FindTab(gui.mainTabs, ':notcoreops team');\">" + arr.length + " team ops </a><br/>";
        }
        {
            let arr = FindTab.searchExtensionOps(gui.corePatch().ops, []);
            if (arr.length > 0) report += "<a class=\"link\" onclick=\"new CABLES.UI.FindTab(gui.mainTabs, ':notcoreops extension');\">" + arr.length + " extension ops </a><br/>";
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
            report += "<tr><td> " + opscountSorted[i].count + "x </td><td><a class=\"link\" onclick=\"new CABLES.UI.FindTab(gui.mainTabs, '" + opscountSorted[i].name + "');\">" + opscountSorted[i].name + "</td></tr>";

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
                report += "<tr><td>" + s + "kb</td><td><a class=\"link\" onclick=\"console.log(456);gui.patchView.centerSelectOp('" + serializeSizes[i].id + "')\">" + serializeSizes[i].name + "</a></td></tr>";
        }
        report += "</table>";

        report += "</div>";

        this._tab.html(report);
    }
}
