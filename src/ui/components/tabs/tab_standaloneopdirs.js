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
        let html = "...";

        html += "<div id=\"dirlist\" class=\"dragList draggable\">";
        html += "  <div class=\"draggable\" data-id=\"1\"><span class=\"handle icon-grip icon icon-0_75x draggable\"></span>hello1</div>";
        html += "  <div class=\"draggable\" data-id=\"2\"><span class=\"handle icon-grip icon icon-0_75x draggable\"></span>hello2</div>";
        html += "  <div class=\"draggable\" data-id=\"3\"><span class=\"handle icon-grip icon icon-0_75x draggable\"></span>hello3</div>";
        html += "  <div class=\"draggable\" data-id=\"4\"><span class=\"handle icon-grip icon icon-0_75x draggable\"></span>hello4</div>";
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
}
