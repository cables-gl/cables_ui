import Tab from "../../elements/tabpanel/tab.js";
import TabPanel from "../../elements/tabpanel/tabpanel.js";
import glTimelineCanvas from "../../gltimeline/gltimelinecanvas.js";
import { gui } from "../../gui.js";
import { userSettings } from "../usersettings.js";

export default class GlTimelineTab
{

    /**
     * @param {TabPanel} tabs
     */
    constructor(tabs)
    {
        this._tab = new Tab("gl timeline", { "icon": "timeline", "infotext": "gl timeline" });
        tabs.addTab(this._tab, true);
        gui.maintabPanel.show();
        this._tab.contentEle.innerHTML = "";
        const a = new glTimelineCanvas(CABLES.patch, this._tab.contentEle);

        a.parentResized();
        userSettings.set("glTimelineOpened", true);

        this._tab.on("onActivate", () =>
        {
            a.parentResized();
        });

        this._tab.addButton("rewind", () =>
        {
            gui.corePatch().timer.setTime(0);
        });

        this._tab.addButton("rr", () =>
        {
            gui.corePatch().timer.setTime(gui.corePatch().timer.getTime() - 1);
        });

        const buttonPlay = this._tab.addButton("playpause", () =>
        {
            gui.corePatch().timer.togglePlay();

            if (gui.corePatch().timer.isPlaying())buttonPlay.innerHTML = "pause";
            else buttonPlay.innerHTML = "play";
        });

        this._tab.addButton("ff", () =>
        {
            gui.corePatch().timer.setTime(gui.corePatch().timer.getTime() + 1);
        });

        this._tab.on("resize", () =>
        {
            a.parentResized();
        });

        this._tab.on("closed", () =>
        {
            userSettings.set("glTimelineOpened", false);
        });

    }
}
