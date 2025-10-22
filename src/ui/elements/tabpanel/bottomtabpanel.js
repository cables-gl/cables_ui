import { Events, ele } from "cables-shared-client";
import Gui, { gui } from "../../gui.js";
import { userSettings } from "../../components/usersettings.js";
import uiconfig from "../../uiconfig.js";
import TabPanel from "./tabpanel.js";

export default class BottomTabPanel extends Events
{
    static USERSETTINGS_VISIBLE = "bottomTabsVisible";

    _visible = false;
    _toBottomPanel = null;
    #tabPanel;

    /**
     * @param {TabPanel} tabs
     */
    constructor(tabs)
    {
        super();

        this.#tabPanel = tabs;
        this.#tabPanel.showTabListButton = false;
        this._ele = document.getElementById("bottomtabs");
        this._ele.style.display = "none";
        this.height = userSettings.get(Gui.PREF_LAYOUT_BOTTOM_PANEL_HEIGHT) || uiconfig.timingPanelHeight;

        this.#tabPanel.on("onTabAdded", (tab, existedBefore) =>
        {
            const wasVisible = this._visible;
            if (!existedBefore) this.show();

            tabs.activateTab("");
            tabs.activateTab(tab.id);

            if (!wasVisible && window.gui) gui.setLayout();
        });

        this.#tabPanel.on("onTabRemoved", (_tab) =>
        {
            if (this.#tabPanel.getNumTabs() == 0)
            {
                this.hide();
                gui.setLayout();
            }
        });
        this.fixHeight();
    }

    init()
    {
        const showtabs = userSettings.get(BottomTabPanel.USERSETTINGS_VISIBLE);
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
        if (gui.unload) return;
        this.#tabPanel.emitEvent("resize");

        if (this.#tabPanel.getNumTabs() == 0)
        {
            this.hide(true);
            return;
        }

        if (!userInteraction)
        {
            if (!userSettings.get(BottomTabPanel.USERSETTINGS_VISIBLE))
            {
                return;
            }
        }

        this._visible = true;
        this._ele.style.display = "block";

        ele.byId("splitterBottomTabs").style.display = "block";

        document.getElementById("editorminimized").style.display = "none";

        if (gui.finishedLoading() && userInteraction) userSettings.set(BottomTabPanel.USERSETTINGS_VISIBLE, true);

        gui.setLayout();

    }

    getHeight()
    {
        if (!this._visible) return 0;
        return this.height;
    }

    fixHeight()
    {
        this.height = Math.min(this.height, window.innerHeight * 0.7);
        this.height = Math.max(150, this.height);
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
            this.fixHeight();
            userSettings.set(Gui.PREF_LAYOUT_BOTTOM_PANEL_HEIGHT, this.height);
        }, 100);
        gui.setLayout();

        this.#tabPanel.emitEvent("resize");
        gui.maintabPanel.emitEvent("resize");
    }

    /**
     * @param {boolean} donotsave
     */
    hide(donotsave = false)
    {
        ele.byId("splitterBottomTabs").style.display = "none";

        this.#tabPanel.emitEvent("resize");

        this._visible = false;
        document.getElementById("editorminimized").style.display = "block";
        this._ele.style.display = "none";
        gui.setLayout();
        gui.maintabPanel.resize();

        if (!donotsave && gui.finishedLoading()) userSettings.set(BottomTabPanel.USERSETTINGS_VISIBLE, false);
    }

    /**
     * @param {boolean} userInteraction
     */
    toggle(userInteraction = false)
    {
        if (!gui.finishedLoading()) return;
        console.log("toggle", this._visible);
        if (this._visible)
        {
            this.hide();
            gui.patchView.focus();
            this._visible = false;
        }
        else this.show(userInteraction);

    }

    isMinimized()
    {
        return !this._visible;
    }
}
