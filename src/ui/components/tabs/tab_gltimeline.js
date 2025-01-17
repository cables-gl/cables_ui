import Tab from "../../elements/tabpanel/tab.js";
import glTimelineCanvas from "../../gltimeline/gltimelinecanvas.js";
import { gui } from "../../gui.js";
import { userSettings } from "../usersettings.js";


export default class GlTimelineTab
{
    constructor(tabs)
    {
        this._tab = new Tab("gl timeline", { "icon": "timeline", "infotext": "gl timeline" });
        tabs.addTab(this._tab, true);
        gui.maintabPanel.show();
        this._tab.contentEle.innerHTML = "";
        const a = new glTimelineCanvas(CABLES.patch, this._tab.contentEle);

        a.parentResized();
        userSettings.set("glTimelineOpened", true);

        this._tab.on("resize", () =>
        {
            a.parentResized();
        });

        this._tab.on("closed", () =>
        {
            userSettings.set("glTimelineOpened", false);
        });

        // tabs.show(true);
    }
}
