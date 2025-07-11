import { Events } from "cables-shared-client";
import { gui } from "../../gui.js";
import { userSettings } from "../../components/usersettings.js";
import TabPanel from "./tabpanel.js";

/**
 * the maintabpanel on the left side of the patchfield, can be minimized
 *
 * @export
 * @class MainTabPanel
 * @extends {Events}
 */
export default class MainTabPanel extends Events
{

    /**
     * @param {TabPanel} tabs
     */
    constructor(tabs)
    {
        super();

        /** @type {TabPanel} */
        this._tabs = tabs;
        this._tabs.showTabListButton = true;
        this._visible = false;
        this._ele = document.getElementById("maintabs");
        this._ele.style.display = "none";

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

    get tabs()
    {
        return this._tabs;
    }

    init()
    {
        const showMainTabs = userSettings.get("maintabsVisible");
        if (showMainTabs) this.show();
        else this.hide(true);
    }

    isVisible()
    {
        return this._visible;
    }

    /**
     * @param {boolean} userInteraction
     */
    show(userInteraction = false)
    {
        if (this._tabs.getNumTabs() == 0)
        {
            this.hide(true);
            return;
        }

        if (!userInteraction)
        {
            if (!userSettings.get("maintabsVisible"))
            {
                return;
            }
        }

        this._visible = true;
        this._ele.style.display = "block";
        document.getElementById("editorminimized").style.display = "none";

        if (gui.finishedLoading() && userInteraction) userSettings.set("maintabsVisible", true);

        gui.setLayout();

        this._tabs.updateSize();
        if (this._tabs.getActiveTab()) this._tabs.getActiveTab().activate();
    }

    /**
     * @param {boolean} donotsave
     */
    hide(donotsave = false)
    {
        this._visible = false;
        document.getElementById("editorminimized").style.display = "block";
        this._ele.style.display = "none";
        gui.setLayout();

        if (!donotsave && gui.finishedLoading()) userSettings.set("maintabsVisible", false);
    }

    /**
     * @param {boolean} userInteraction
     */
    toggle(userInteraction = false)
    {
        if (!gui.finishedLoading()) return;
        gui.patchView.patchRenderer.viewBox.startResize();
        if (this._visible)
        {
            this.hide();
            gui.patchView.focus();
            const actTab = this.tabs.getActiveTab();
            if (actTab) actTab.activate();
        }
        else this.show(userInteraction);
        gui.patchView.patchRenderer.viewBox.endResize();
    }
}
