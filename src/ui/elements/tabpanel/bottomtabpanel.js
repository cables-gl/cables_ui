import { Events, ele } from "cables-shared-client";
import { gui } from "../../gui.js";
import { userSettings } from "../../components/usersettings.js";
import uiconfig from "../../uiconfig.js";
import TabPanel from "./tabpanel.js";

export default class BottomTabPanel extends Events
{

    /**
     * @param {TabPanel} tabs
     */
    constructor(tabs)
    {
        super();
        this._tabs = tabs;
        this._tabs.showTabListButton = false;
        this._visible = false;
        this._ele = document.getElementById("bottomtabs");
        this._ele.style.display = "none";
        this.height = userSettings.get("bottomPanelHeight") || uiconfig.timingPanelHeight;
        this._toBottomPanel = null;

        this._tabs.on("onTabAdded", (tab, existedBefore) =>
        {
            const wasVisible = this._visible;
            if (!existedBefore) this.show();

            tabs.activateTab("");
            tabs.activateTab(tab.id);

            if (!wasVisible && window.gui) gui.setLayout();
        });

        this._tabs.on("onTabRemoved", (tab) =>
        {
            if (this._tabs.getNumTabs() == 0)
            {
                this.hide();
                gui.setLayout();
            }
        });
    }

    init()
    {
        const showtabs = userSettings.get("bottomTabsVisible");
        if (showtabs) this.show();
        else this.hide(true);
    }

    isVisible()
    {
        return this._visible;
    }

    /**
     * @param {Boolean} userInteraction
     */
    show(userInteraction = false)
    {
        userSettings.set("bottomTabsOpened", true);

        if (this._tabs.getNumTabs() == 0)
        {
            this.hide(true);
            return;
        }

        if (!userInteraction)
        {
            if (!userSettings.get("bottomTabsVisible"))
            {
                return;
            }
        }

        this._visible = true;
        this._ele.style.display = "block";

        ele.byId("splitterBottomTabs").style.display = "block";

        document.getElementById("editorminimized").style.display = "none";

        if (gui.finishedLoading() && userInteraction) userSettings.set("bottomTabsVisible", true);

        gui.setLayout();

    }

    getHeight()
    {
        if (!this._visible) return 0;
        return this.height;
    }

    /**
     * @param {number} h
     */
    setHeight(h)
    {
        this.height = h;

        clearTimeout(this._toBottomPanel);
        this._toBottomPanel = setTimeout(() =>
        {
            userSettings.set("bottomPanelHeight", this.height);
        }, 100);
        gui.setLayout();

        this._tabs.emitEvent("resize");
    }

    /**
     * @param {boolean} donotsave
     */
    hide(donotsave = false)
    {
        ele.byId("splitterBottomTabs").style.display = "none";

        userSettings.set("bottomTabsOpened", false);

        this._visible = false;
        document.getElementById("editorminimized").style.display = "block";
        this._ele.style.display = "none";
        if (window.gui)gui.setLayout();

        if (!donotsave && gui.finishedLoading()) userSettings.set("bottomTabsVisible", false);
    }

    /**
     * @param {boolean} userInteraction
     */
    toggle(userInteraction = false)
    {
        if (!gui.finishedLoading()) return;
        if (this._visible)
        {
            this.hide();
            gui.patchView.focus();
        }
        else this.show(userInteraction);
    }
}
