import userSettings from "../../components/usersettings";
import { getHandleBarHtml } from "../../utils/handlebars";

export default class TabPanel extends CABLES.EventTarget
{
    constructor(eleId)
    {
        super();
        this.id = CABLES.uuid();
        this._eleId = eleId;
        this._tabs = [];
        this._eleContentContainer = null;
        this._eleTabPanel = null;
        this.showTabListButton = false;
        this._dynCmds = [];

        if (!this._eleTabPanel)
        {
            this._eleTabPanel = document.createElement("div");
            this._eleTabPanel.classList.add("tabpanel");
            this._eleTabPanel.innerHTML = "";

            const ele = document.querySelector("#" + this._eleId);
            ele.appendChild(this._eleTabPanel);

            this._eleContentContainer = document.createElement("div");
            this._eleContentContainer.classList.add("contentcontainer");
            this._eleContentContainer.innerHTML = "";
            ele.appendChild(this._eleContentContainer);
        }

        this.on("resize", () =>
        {
            for (let i = 0; i < this._tabs.length; i++) this._tabs[i].emitEvent("resize");
        });
    }


    getUniqueTitle(title)
    {
        const existingTab = this.getTabByTitle(title);
        let count = 0;
        while (existingTab)
        {
            count++;
            if (!this.getTabByTitle(title + " (" + count + ")")) break;
        }

        if (count > 0)
            title = title + " (" + count + ")";

        return title;
    }

    updateHtml()
    {
        let html = "";
        html += getHandleBarHtml("tabpanel_bar", { "id": this.id, "tabs": this._tabs });
        this._eleTabPanel.innerHTML = html;

        const editortabList = document.getElementById("editortabList" + this.id);
        if (!editortabList)
        {
            console.warn("no editortabList?!?");
            return;
        }
        if (!this.showTabListButton)
        {
            editortabList.style.display = "none";
            editortabList.parentElement.style["padding-left"] = "0";
        }
        else
        {
            editortabList.parentElement.style["padding-left"] = "34px";

            editortabList.style.display = "block";
            editortabList.addEventListener(
                "mousedown",
                (e) =>
                {
                    const items = [];
                    for (let i = 0; i < this._tabs.length; i++)
                    {
                        const tab = this._tabs[i];
                        items.push({
                            "title": tab.options.name,
                            "func": () => { this.activateTab(tab.id); }
                        });
                    }
                    CABLES.contextMenu.show(
                        {
                            "items": items
                        }, e.target);
                },
            );
        }


        for (let i = 0; i < this._dynCmds.length; i++) gui.cmdPallet.removeDynamic(this._dynCmds[i]);

        for (let i = 0; i < this._tabs.length; i++)
        {
            if (window.gui && this._eleId == "maintabs")
            {
                console.log(this);

                const t = this._tabs[i];
                console.log("TAB", t.title);

                const cmd = gui.cmdPallet.addDynamic("tab", "" + t.title,
                    () =>
                    {
                        gui.maintabPanel.show(true);

                        this.activateTab(t.id, true);
                    }, t.icon || "edit");
                this._dynCmds.push(cmd);
            }

            // ----------------


            document.getElementById("editortab" + this._tabs[i].id).addEventListener(
                "mousedown",
                function (e)
                {
                    if (e.target.dataset.id) this.activateTab(e.target.dataset.id, true);
                }.bind(this),
            );

            if (this._tabs[i].options.closable)
            {
                document.getElementById("editortab" + this._tabs[i].id).addEventListener(
                    "mousedown",
                    function (e)
                    {
                        if (e.button == 1) if (e.target.dataset.id) this.closeTab(e.target.dataset.id);
                    }.bind(this),
                );
            }

            if (document.getElementById("closetab" + this._tabs[i].id))
            {
                document.getElementById("closetab" + this._tabs[i].id).addEventListener(
                    "mousedown",
                    function (e)
                    {
                        this.closeTab(e.target.dataset.id);
                    }.bind(this),
                );
            }
        }

        this.scrollToActiveTab();
    }

    activateTabByName(name)
    {
        let found = false;
        for (let i = 0; i < this._tabs.length; i++)
        {
            if (this._tabs[i].options.name == name)
            {
                this.activateTab(this._tabs[i].id);
                found = true;
            }
            else this._tabs[i].deactivate();
        }

        if (!found)
        {
            console.warn("[activateTabByName] could not find tab", name);
        }

        this.updateHtml();
    }

    scrollToActiveTab()
    {
        const tab = this.getActiveTab();
        const w = this._eleTabPanel.clientWidth;
        if (!tab) return;
        let left = document.getElementById("editortab" + tab.id).offsetLeft;
        left += document.getElementById("editortab" + tab.id).clientWidth;
        left += 25;

        const tabContainer = document.querySelector("#maintabs .tabs");
        if (tabContainer && left > w) tabContainer.scrollLeft = left;
    }

    activateTab(id)
    {
        let found = false;
        for (let i = 0; i < this._tabs.length; i++)
        {
            if (this._tabs[i].id === id)
            {
                found = true;
                this.emitEvent("onTabActivated", this._tabs[i]);
                this._tabs[i].activate();
            }
        }

        if (found)
            for (let i = 0; i < this._tabs.length; i++)
                if (this._tabs[i].id != id)
                    this._tabs[i].deactivate();

        this.updateHtml();

        if (!found)
        {
            // console.log("could not find tab", id);
        }

        // console.log("CABLES.editorSession", CABLES.editorSession);
        if (CABLES.editorSession && CABLES.editorSession.loaded() && CABLES.UI.loaded) this.saveCurrentTabUsersettings();
    }

    loadCurrentTabUsersettings()
    {
        let found = false;
        for (let i = 0; i < this._tabs.length; i++)
        {
            if (userSettings.get("tabsLastTitle_" + this._eleId) == this._tabs[i].title)
            {
                this.activateTab(this._tabs[i].id);
                found = true;
                break;
            }
        }

        // if (!found) console.log("tab usersettings not found...", this._eleId, userSettings.get("tabsLastTitle_" + this._eleId));
    }

    saveCurrentTabUsersettings()
    {
        const activeTab = this.getActiveTab();

        if (!activeTab) return;
        userSettings.set("tabsLastTitle_" + this._eleId, activeTab.title);
    }

    getTabByDataId(dataId)
    {
        for (let i = 0; i < this._tabs.length; i++) if (this._tabs[i].dataId == dataId) return this._tabs[i];
    }

    getTabByTitle(title)
    {
        for (let i = 0; i < this._tabs.length; i++) if (this._tabs[i].title == title) return this._tabs[i];
    }

    getTabById(id)
    {
        for (let i = 0; i < this._tabs.length; i++) if (this._tabs[i].id == id) return this._tabs[i];
    }

    closeTab(id)
    {
        let tab = null;
        let idx = 0;
        for (let i = 0; i < this._tabs.length; i++)
        {
            if (this._tabs[i].id == id)
            {
                tab = this._tabs[i];
                tab.emitEvent("close");
                this._tabs.splice(i, 1);
                idx = i;
                break;
            }
        }
        if (!tab) return;

        this.emitEvent("onTabRemoved", tab);
        tab.remove();

        if (idx > this._tabs.length - 1) idx = this._tabs.length - 1;
        if (this._tabs[idx]) this.activateTab(this._tabs[idx].id);

        this.updateHtml();
    }

    setChanged(id, changed)
    {
        if (this.getTabById(id)) this.getTabById(id).options.wasChanged = changed;
        this.updateHtml();
    }

    setTabNum(num)
    {
        const tab = this._tabs[Math.min(this._tabs.length, num)];
        this.activateTab(tab.id);
    }

    getNumTabs()
    {
        return this._tabs.length;
    }

    getActiveTab()
    {
        for (let i = 0; i < this._tabs.length; i++) if (this._tabs[i].active) return this._tabs[i];
    }

    updateSize()
    {
        for (let i = 0; i < this._tabs.length; i++) this._tabs[i].updateSize();
    }

    getSaveButton()
    {
        const t = this.getActiveTab();
        if (!t) return;

        const b = t.getSaveButton();
        if (b) return b;
    }

    addTab(tab, activate)
    {
        if (tab.options.singleton)
        {
            const t = this.getTabByTitle(tab.title);
            if (t)
            {
                this.activateTab(t.id);
                this.emitEvent("onTabAdded", t, true);

                if (activate) this.activateTab(t.id);
                return t;
            }
        }

        tab.initHtml(this._eleContentContainer);
        this._tabs.push(tab);

        if (activate) this.activateTab(tab.id);

        // var tabEl=document.getElementById("editortab"+tab.id)

        this.updateHtml();
        this.emitEvent("onTabAdded", tab, false);

        // setTimeout(() => { this.updateSize(); console.log("update size of tab"); }, 200);
        return tab;
    }

    addIframeTab(title, url, options, userInteraction)
    {
        const iframeTab = this.addTab(new CABLES.UI.Tab(title, options));
        const id = CABLES.uuid();

        const html = "<div class=\"loading\" id=\"loading" + id + "\" style=\"position:absolute;left:45%;top:34%\"></div><iframe id=\"iframe" + id + "\"  style=\"border:none;width:100%;height:100%\" src=\"" + url + "\" onload=\"document.getElementById('loading" + id + "').style.display='none';\"></iframe";
        iframeTab.contentEle.innerHTML = html;
        iframeTab.contentEle.style.padding = "0px";
        if (options.gotoUrl)
        {
            iframeTab.toolbarEle.innerHTML = "<a class=\"button-small\" href=\"" + options.gotoUrl + "\" target=\"_blank\">Open in new tab</a>";
        }
        else
        {
            iframeTab.toolbarEle.innerHTML = "<a class=\"button-small\" href=\"" + url + "\" target=\"_blank\">Open in new tab</a>";
        }

        const frame = document.getElementById("iframe" + id);
        const talkerAPI = new CABLESUILOADER.TalkerAPI(frame.contentWindow);


        talkerAPI.addEventListener("manualScreenshot", (opts, next) =>
        {
            CABLES.sandbox.setManualScreenshot(opts.manualScreenshot);

            if (opts.manualScreenshot)
            {
                gui.patchView.store.saveScreenshot(true, () =>
                {
                    talkerAPI.send("screenshotSaved");
                });
            }
        });

        talkerAPI.addEventListener("notify", (opts, next) =>
        {
            CABLES.UI.notify(opts.msg);
        });

        talkerAPI.addEventListener("notifyError", (opts, next) =>
        {
            CABLES.UI.notifyError(opts.msg);
        });

        talkerAPI.addEventListener("updatePatchName", (opts, next) =>
        {
            gui.setProjectName(opts.name);

            CABLESUILOADER.talkerAPI.send("updatePatchName", opts, (err, r) => {});
        });

        this.activateTab(iframeTab.id);
        gui.maintabPanel.show(userInteraction);
        return iframeTab;
    }
}
