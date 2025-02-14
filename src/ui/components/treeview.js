import { Events, ele } from "cables-shared-client";

/**
 * treeview, e.g. for patch outline
 *
 * @export
 * @class TreeView
 * @extends {Events}
 */
export default class TreeView extends Events
{
    constructor()
    {
        super();
        this._clickListenerIds = [];
    }

    html(data)
    {
        this._clickListenerIds = [];
        this._data = data;
        return this._html(data);
    }

    _html(data = [], level = 0, html = "")
    {
        if (level == 0)
            html = " <table class=\"table treetable\">";

        data.sort((a, b) => { return a.order.localeCompare(b.order, "en", { "sensitivity": "base" }); });

        for (let i = 0; i < data.length; i++)
        {
            if (!data[i]) continue;
            const item = data[i];
            html += "<tr class=\"" + (data[i].rowClass || "") + "\">";
            html += "<td>";

            for (let j = 0; j < level; j++)
            {
                html += "<span style=\"border-right:2px solid #555;margin-right:9px;width:8px;display:block;float:left;height:20px;;\"></span>";

                if (level == j)
                    if (item.hasOwnProperty("childs") && item.childs.length > 0) html += "<span class=\"icon icon-chevron-down\" style=\"margin-right:3px;\"></span>";
                    else html += "<span style=\"border-right:2px solid #555;margin-right:9px;width:8px;display:block;float:left;height:20px;\"></span>";
            }

            const icon = data[i].icon || "empty";

            let style = "";
            if (data[i].iconBgColor)style = "background-color:" + data[i].iconBgColor;

            html += "<span id=\"icon_" + item.id + "\" data-eletype=\"icon\" class=\"icon icon-" + icon + " iconhover\" style=\"" + style + "\"></span>";

            html += "&nbsp;&nbsp;";

            html += "<a id=\"title_" + item.id + "\" data-eletype=\"title\" class=\"\">";
            html += item.title;
            html += "</a>";

            html += "</td>";

            html += "<td>";

            html += "  <span id=\"threedots_" + item.id + "\" data-eletype=\"threedots\" class=\"icon icon-three-dots iconhover\"></span>";
            html += "</td>";
            html += "</tr>";

            if (item.hasOwnProperty("childs") && item.childs.length > 0) html += this._html(item.childs, level + 1);

            this._clickListenerIds["icon_" + item.id] = data[i];
            this._clickListenerIds["title_" + item.id] = data[i];
            this._clickListenerIds["threedots_" + item.id] = data[i];
        }

        if (level == 0)
            html += "</table>";

        return html;
    }

    bindListeners()
    {
        for (const i in this._clickListenerIds)
        {
            const el = ele.byId(i);
            if (el)
            {
                el.addEventListener("click",
                    (event) =>
                    {
                        const el2 = event.target;
                        const eletype = el2.dataset.eletype;
                        this.emitEvent(eletype + "_click", this._clickListenerIds[i], el2, event);
                    });

                el.addEventListener("dblclick",
                    (event) =>
                    {
                        const el2 = event.target;
                        const eletype = el2.dataset.eletype;
                        this.emitEvent(eletype + "_dblclick", this._clickListenerIds[i], el2, event);
                    });
            }
            else
                console.log("ele not found", this._clickListenerIds[i]);
        }
    }
}
