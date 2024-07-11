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

        html += "<ul id=\"dirlist\" class=\"draggable\">";
        html += "<li class=\"draggable\">hello1</li>";
        html += "<li class=\"draggable\">hello2</li>";
        html += "<li class=\"draggable\">hello3</li>";
        html += "<li class=\"draggable\">hello4</li>";
        html += "</ul>";

        this._tab.html(html);


        console.log(ele.byId("dirlist"));
        new Sortable(ele.byId("dirlist"), {
            // "animation": 150,
            // "ghostClass": "blue-background-class"
        });
    }
}
