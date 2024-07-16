import Tab from "../../elements/tabpanel/tab.js";
import { getHandleBarHtml } from "../../utils/handlebars.js";

export default class StandaloneOpDirs
{
    constructor(tabs)
    {
        this._count = 0;
        this._timeout = null;

        this._tab = new Tab("op directories", { "icon": "folder", "singleton": true, "infotext": "tab_profiler", "padding": true });
        tabs.addTab(this._tab, true);
        this.show();

        CABLESUILOADER.talkerAPI.addEventListener("addedProjectOpDir", (err, res) =>
        {
            this.show();
        });
    }

    show()
    {
        CABLESUILOADER.talkerAPI.send("getOpTargetDirs", {}, (err, r) =>
        {
            if (!err && r.data)
            {
                const html = getHandleBarHtml("tab_standalone_opdirs", { "dirs": r.data });
                this._tab.html(html);

                new Sortable(ele.byId("dirlist"), {
                    "animation": 150,
                    "handle": ".handle",
                    "ghostClass": "ghost",
                    "dragClass": "dragActive"
                });
            }
        });
    }
}
