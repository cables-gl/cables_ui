import { ele, Events } from "cables-shared-client";
import TimeLineGui from "../timelinesvg/timeline.js";
import { getHandleBarHtml } from "../../utils/handlebars.js";
import text from "../../text.js";

export default class TabTimeline extends Events
{
    constructor(tabs)
    {
        super();
        this._tabs = tabs;
        this._tab = new CABLES.UI.Tab("Timeline", { "icon": "op", "infotext": "tab_uiattribs", "padding": true, "singleton": "true", });
        this._tabs.addTab(this._tab, true);

        this._tab.html("<div id=\"timing\"></div>");


        ele.byId("timing").innerHTML = getHandleBarHtml("timeline_controler");

        ele.byId("button_toggleTiming").addEventListener("click", () => { gui.toggleTiming(); });


        ele.byId("timelineui").addEventListener("pointerEnter", (e) =>
        {
            gui.showInfo(text.timelineui);
        });

        ele.byId("timelineui").addEventListener("pointerLeave", (e) =>
        {
            CABLES.UI.hideInfo();
        });
    }
}
