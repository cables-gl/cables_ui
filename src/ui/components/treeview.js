
export default class TreeView extends CABLES.EventTarget
{
    constructor()
    {
        super();

        this._clickListenerIds = [];
    }


    insert(ele, data)
    {
        this._clickListenerIds = [];

        this._data = data;
        ele.innerHTML = this._html(data);
        this._bindListeners();
    }


    _html(data = [], level = 0, html = "")
    {
        if (level == 0)
        {
            html = " <table class=\"table treetable\">";
        }

        for (let i = 0; i < data.length; i++)
        {
            const item = data[i];
            html += "<tr>";
            html += "<td>";

            for (let j = 0; j < level; j++)
            {
                html += "<span style=\"border-right:2px solid #555;margin-right:9px;width:8px;display:block;float:left;height:20px;;\"></span>";

                if (level == j + 1)
                    if (item.hasOwnProperty("childs") && item.childs.length > 0) html += "<span class=\"icon icon-chevron-down\" style=\"margin-right:3px;\"></span>";
                    else html += "<span style=\"border-right:2px solid #555;margin-right:9px;width:8px;display:block;float:left;height:20px;;\"></span>";
            }

            // const icon = "op";
            const icon = data[i].icon || "empty";

            html += "<span id=\"icon_" + item.id + "\" data-eletype=\"icon\" class=\"icon icon-" + icon + " iconhover\"></span>";

            html += "&nbsp;&nbsp;";

            html += "<a id=\"title_" + item.id + "\" data-eletype=\"title\" class=\"link\" >";
            html += item.title;
            html += "</a>";

            this._clickListenerIds["icon_" + item.id] = data[i];
            this._clickListenerIds["title_" + item.id] = data[i];

            html += "</td>";
            html += "<td>";
            html += "<span class=\"icon icon-three-dots iconhover\"></span>";
            html += "</td>";
            html += "</tr>";

            if (item.hasOwnProperty("childs") && item.childs.length > 0)
            {
                html += this._html(item.childs, level + 1);
            }
        }

        if (level == 0)
        {
            html += "</table>";
        }

        return html;
    }

    _bindListeners()
    {
        for (const i in this._clickListenerIds)
        {
            const el = ele.byId(i);
            if (el)
                el.addEventListener("click",
                    (event) =>
                    {
                        const ele = event.target;
                        const eletype = ele.dataset.eletype;
                        this.emitEvent(eletype + "_click", this._clickListenerIds[i]);
                    });
            else
                console.log("ele not found", this._clickListenerIds[i]);
        }
    }
}

