import { Events } from "cables-shared-client";
import { gui } from "../../gui.js";
import { userSettings } from "../../components/usersettings.js";

export default class BottomTabPanel extends Events
{
    constructor(tabs)
    {
        super();
        this._tabs = tabs;
        this._tabs.showTabListButton = false;
        this._visible = false;
        this._ele = document.getElementById("bottomtabs");
        this._ele.style.display = "none";

        this._tabs.addEventListener("onTabAdded", (tab, existedBefore) =>
        {
            const wasVisible = this._visible;
            if (!existedBefore) this.show();

            tabs.activateTab("");
            tabs.activateTab(tab.id);

            if (!wasVisible && window.gui) gui.setLayout();
        });

        this._tabs.addEventListener("onTabRemoved", (tab) =>
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

    show(userInteraction)
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
        document.getElementById("editorminimized").style.display = "none";

        if (gui.finishedLoading() && userInteraction) userSettings.set("bottomTabsVisible", true);

        gui.setLayout();

        this._tabs.updateSize();
    }

    hide(donotsave)
    {
        userSettings.set("bottomTabsOpened", false);

        this._visible = false;
        document.getElementById("editorminimized").style.display = "block";
        this._ele.style.display = "none";
        if (window.gui)gui.setLayout();

        if (!donotsave && gui.finishedLoading()) userSettings.set("bottomTabsVisible", false);
    }

    toggle(userInteraction)
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
