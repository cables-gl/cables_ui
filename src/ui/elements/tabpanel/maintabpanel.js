import { Events } from "cables-shared-client";
import { gui } from "../../gui.js";
import { userSettings } from "../../components/usersettings.js";

/**
 * the maintabpanel on the left side of the patchfield, can be minimized
 *
 * @export
 * @class MainTabPanel
 * @extends {Events}
 */
export default class MainTabPanel extends Events
{
    constructor(tabs)
    {
        super();
        this._tabs = tabs;
        this._tabs.showTabListButton = true;
        this._visible = false;
        this._ele = document.getElementById("maintabs");
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

    show(userInteraction)
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

        if (CABLES.UI.loaded && userInteraction) userSettings.set("maintabsVisible", true);

        gui.setLayout();

        this._tabs.updateSize();
    }

    hide(donotsave)
    {
        this._visible = false;
        document.getElementById("editorminimized").style.display = "block";
        this._ele.style.display = "none";
        if (window.gui)gui.setLayout();

        if (!donotsave && CABLES.UI.loaded) userSettings.set("maintabsVisible", false);
    }

    toggle(userInteraction)
    {
        if (!CABLES.UI.loaded) return;
        if (this._visible)
        {
            this.hide();
            gui.patchView.focus();
        }
        else this.show(userInteraction);
    }
}
