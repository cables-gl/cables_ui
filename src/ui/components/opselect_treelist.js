import GlPatch from "../glpatch/glpatch.js";
import { gui } from "../gui.js";

/**
 * tree view for namespaces in op select dialog
 *
 * @export
 * @class OpTreeList
 */
export default class OpTreeList
{
    constructor()
    {
        this.data = this._serializeOps();
    }

    /**
     * @param {string} txt
     */
    searchFor(txt)
    {
        const opSearch = document.getElementById("opsearch");
        opSearch.value = txt;

        const event = new Event("input", {
            "bubbles": true,
            "cancelable": true,
        });

        opSearch.dispatchEvent(event);
    }

    /**
     * Description
     * @param {object} item
     * @param {string} html
     * @param {number} level
     */
    itemHtml(item, html, level)
    {
        if (!item) return "";
        html = "";

        for (let i = 0; i < level; i++) html += "&nbsp;&nbsp;&nbsp;";

        const color = GlPatch.getOpNamespaceColor(item.fullname) || [1, 1, 1, 1];

        html += "<a style=\"color:rgba(" + Math.round(color[0] * 255) + "," + Math.round(color[1] * 255) + "," + Math.round(color[2] * 255) + ",1);\" onclick=\"gui.opSelect().tree.searchFor('" + item.fullname + ".')\">";
        html += "" + item.name;
        html += "</a>";

        html += "<br/>";

        if (item.childs)
            for (let i = 0; i < item.childs.length; i++)
                html += this.itemHtml(item.childs[i], html, level + 1);

        return html;
    }

    html()
    {
        const perf = gui.uiProfiler.start("opselect.treelist");

        let html = "";
        for (let i = 0; i < this.data.length; i++)
            html += this.itemHtml(this.data[i], html, 0);

        perf.finish();

        return html;
    }

    _serOpRec(root, prefix)
    {
        let items = [];

        for (const i in root)
        {

            if (i != "Deprecated" && i != "Admin" && i != "Dev")
            {

                items.push(
                    {
                        "name": i,
                        "fullname": prefix + "." + i,
                        "childs": this._serOpRec(root[i], prefix + "." + i)
                    });
            }
        }
        return items;

    }

    _serializeOps()
    {
        const ns = { "Ops": {} };

        for (let i in CABLES.OPS)
        {
            const parts = CABLES.OPS[i].objName.split(".");

            parts.length -= 1;

            if (parts.length >= 2) ns[parts[0]][parts[1]] = ns[parts[0]][parts[1]] || {};
            if (parts.length >= 3) ns[parts[0]][parts[1]][parts[2]] = ns[parts[0]][parts[1]][parts[2]] || {};
            if (parts.length >= 4) ns[parts[0]][parts[1]][parts[2]][parts[3]] = ns[parts[0]][parts[1]][parts[2]][parts[3]] || {};
            if (parts.length >= 5) ns[parts[0]][parts[1]][parts[2]][parts[3]][parts[4]] = ns[parts[0]][parts[1]][parts[2]][parts[3]][parts[4]] || {};
            if (parts.length >= 6) ns[parts[0]][parts[1]][parts[2]][parts[3]][parts[4]][parts[5]] = ns[parts[0]][parts[1]][parts[2]][parts[3]][parts[4]][parts[5]] || {};
            if (parts.length > 6) ns[parts[0]][parts[1]][parts[2]][parts[3]][parts[4]][parts[5]][parts[6]] = ns[parts[0]][parts[1]][parts[2]][parts[3]][parts[4]][parts[5]][parts[6]] || {};
        }

        let items = this._serOpRec(ns.Ops, "Ops");

        items = items.sort(
            function (a, b)
            {
                if (a.name < b.name) return -1;
                if (a.name > b.name) return 1;
                return 0;
            });
        return items;
    }
}
