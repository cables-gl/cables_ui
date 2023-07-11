
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

            html += "<span class=\"icon icon-op iconhover\"></span>";


            html += "&nbsp;&nbsp;";

            html += "<a id=\"title_" + item.id + "\" data-id=\"" + item.id + "\" class=\"link\" >";
            html += item.title;
            html += "</a>";

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
        console.log(this._clickListenerIds);
        // for (let i = 0; i < this._clickListenerIds.length; i++)
        for (const i in this._clickListenerIds)
        {
            const el = ele.byId(i);
            if (el)
                el.addEventListener("click",
                    (event) =>
                    {
                        const ele = event.target;
                        this.emitEvent("click", this._clickListenerIds[i]);
                    });
            else
                console.log("ele not found", this._clickListenerIds[i]);
        }
    }
}

