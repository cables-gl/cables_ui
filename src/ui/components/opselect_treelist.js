import GlPatch from "../glpatch/glpatch.js";
import { gui } from "../gui.js";
import uiprofiler from "./uiprofiler.js";

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
        this.data = this._serializeOps(window.Ops, "Ops");
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
        if (!item.childs || item.childs.length == 0) return "";
        if (!item) return "";
        html = "";

        for (let i = 0; i < level; i++) html += "&nbsp;&nbsp;&nbsp;";

        const color = GlPatch.getOpNamespaceColor(item.fullname) || [1, 1, 1, 1];

        html += "<a style=\"color:rgba(" + Math.round(color[0] * 255) + "," + Math.round(color[1] * 255) + "," + Math.round(color[2] * 255) + ",1);\" onclick=\"gui.opSelect().tree.searchFor('" + item.fullname + ".')\">";
        html += "" + item.name;
        html += "</a>";

        // if (item.childs && item.childs.length > 0)html += " (" + item.childs.length + ")";
        // if (item.childs.length == 2)console.log(item, item.childs);
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

    /**
     * @param {array} root
     * @param {string} prefix
     */
    _serializeOps(root, prefix)
    {
        let items = [];

        for (const i in root)
        {
            if (i != "Deprecated" && i != "Admin" && i != "Dev")
                items.push(
                    {
                        "name": i,
                        "fullname": prefix + "." + i,
                        "childs": this._serializeOps(root[i], prefix + "." + i)
                    });
        }

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
