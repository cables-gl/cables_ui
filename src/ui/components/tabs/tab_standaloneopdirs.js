import Tab from "../../elements/tabpanel/tab.js";

export default class StandaloneOpDirs
{
    constructor(tabs)
    {
        this._count = 0;
        this._timeout = null;

        this._tab = new Tab("op directories", { "icon": "folder", "singleton": true, "infotext": "tab_profiler", "padding": true });
        tabs.addTab(this._tab, true);
        this.show();
    }

    show()
    {
        CABLESUILOADER.talkerAPI.send("getOpTargetDirs", {}, (err, r) =>
        {
            if (!err && r.data)
            {
                let html = "...";
                html += "<div id=\"dirlist\" class=\"dragList draggable\">";
                r.data.forEach((dirInfo, i) =>
                {
                    html += "  <div class=\"draggable\" data-id=\"" + i + "\"><span class=\"handle icon-grip icon icon-0_75x draggable\"></span>" + dirInfo.dir + "</div>";
                });
                html += "</div>";

                this._tab.html(html);

                new Sortable(ele.byId("dirlist"), {
                    "animation": 150,
                    "handle": ".handle",
                    "ghostClass": "ghost",
                    "dragClass": "dragActive",
                    "onEnd": function (evt)
                    {
                        const list = ele.byQueryAll("#dirlist div");

                        for (let i = 0; i < list.length; i++)
                        {
                            console.log(list[i].dataset.id);
                        }
                    },
                });
            }
        });
    }
}
