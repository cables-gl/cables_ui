import { Events, Logger, ele } from "cables-shared-client";
import { utils } from "cables";
import { getHandleBarHtml } from "../../utils/handlebars.js";
import { notify, notifyError } from "../notification.js";
import { gui } from "../../gui.js";
import { platform } from "../../platform.js";
import { contextMenu } from "../contextmenu.js";
import { editorSession } from "./editor_session.js";
import { userSettings } from "../../components/usersettings.js";
import Tab from "./tab.js";

/**
 * @typedef TabPanelOptions
 * @property {String} [name]
 * @property {boolean} [closable]
 * @property {boolean} [noUserSetting] - does not store last opened tab in userSettings
 */

/**
 * a tab panel, that can contain tabs
 *
 * @export
 * @class TabPanel
 * @extends {Events}
 */
export default class TabPanel extends Events
{

    /** @type {TabPanelOptions} */
    #options;

    /**
     * @param {String} eleId
     * @param {TabPanelOptions} options
     */
    constructor(eleId, options = {})
    {
        super();
        this._log = new Logger("TabPanel " + eleId);

        this.#options = options;
        this.id = utils.uuid();
        this._eleId = eleId;
        this._tabs = [];
        this._eleContentContainer = null;
        this._eleTabPanel = null;
        this.showTabListButton = false;
        this._dynCmds = [];

        this._eleTabPanel = document.createElement("div");
        this._eleTabPanel.classList.add("tabpanel");
        this._eleTabPanel.innerHTML = "";

        const el = ele.byId(this._eleId);
        if (!el)
        {
            this._log.error("could not find ele " + this._eleId);
            return;
        }
        el.appendChild(this._eleTabPanel);

        this._eleContentContainer = document.createElement("div");
        this._eleContentContainer.classList.add("contentcontainer");
        this._eleContentContainer.innerHTML = "";
        el.appendChild(this._eleContentContainer);

        this.on("resize", () =>
        {
            for (let i = 0; i < this._tabs.length; i++) this._tabs[i].emitEvent("resize");
        });
    }

    /**
     * @param {string} title
     * @returns {string}
     */
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
            this._log.warn("no editortabList?!?");
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
                "pointerdown",
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
                    contextMenu.show(
                        {
                            "items": items
                        }, e.target);
                },
            );
        }

        for (let i = 0; i < this._dynCmds.length; i++) gui.cmdPalette.removeDynamic(this._dynCmds[i]);

        for (let i = 0; i < this._tabs.length; i++)
        {
            if (window.gui && this._eleId == "maintabs")
            {
                const t = this._tabs[i];

                const cmd = gui.cmdPalette.addDynamic("tab", "Tab " + t.title, () =>
                {
                    gui.maintabPanel.show(true);

                    this.activateTab(t.id, true);
                }, t.icon || "edit");
                this._dynCmds.push(cmd);
            }

            // ----------------

            ele.clickable(ele.byId("editortab" + this._tabs[i].id), (e) =>
            {
                if (e.target.dataset.id) this.activateTab(e.target.dataset.id, true);
            });

            if (this._tabs[i].options.closable)
            {
                document.getElementById("editortab" + this._tabs[i].id).addEventListener(
                    "pointerdown",
                    function (e)
                    {
                        if (e.button == 1) if (e.target.dataset.id) this.closeTab(e.target.dataset.id);
                    }.bind(this),
                );
            }

            if (document.getElementById("closetab" + this._tabs[i].id))
            {
                document.getElementById("closetab" + this._tabs[i].id).addEventListener(
                    "pointerdown",
                    function (e)
                    {
                        this.closeTab(e.target.dataset.id);
                    }.bind(this),
                );
            }
        }

        this.scrollToActiveTab();
    }

    /**
     * @param {string} name
     */
    activateTabByName(name)
    {
        name = name || "";
        let found = false;
        let tab = null;
        for (let i = 0; i < this._tabs.length; i++)
        {
            if (this._tabs[i].title.toLowerCase() === name.toLowerCase() ||
                (this._tabs[i].options.name || "").toLowerCase() === name.toLowerCase())
            {
                tab = this._tabs[i];
                this.activateTab(tab.id);
                found = true;
            }
            else this._tabs[i].deactivate();
        }

        if (!found) this._log.log("[activateTabByName] could not find tab", name);

        this.updateHtml();
        return tab;
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

    /**
     * @param {string} id
     */
    activateTab(id)
    {
        let found = null;
        for (let i = 0; i < this._tabs.length; i++)
        {
            if (this._tabs[i].id === id)
            {
                found = this._tabs[i];
                this.emitEvent("onTabActivated", this._tabs[i]);
                this._tabs[i].activate();
            }
        }

        if (found)
            for (let i = 0; i < this._tabs.length; i++)
                if (this._tabs[i].id != id)
                    this._tabs[i].deactivate();

        this.updateHtml();

        if (editorSession && editorSession.loaded() && gui.finishedLoading()) this.saveCurrentTabUsersettings();
        return found;
    }

    loadCurrentTabUsersettings()
    {
        if (this.#options.noUserSetting) return;
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
    }

    saveCurrentTabUsersettings()
    {
        if (this.#options.noUserSetting) return;
        const activeTab = this.getActiveTab();

        if (!activeTab) return;
        userSettings.set("tabsLastTitle_" + this._eleId, activeTab.title);
    }

    /**
     * @param {string} dataId
     */
    getTabByDataId(dataId)
    {
        for (let i = 0; i < this._tabs.length; i++) if (this._tabs[i].dataId == dataId) return this._tabs[i];
    }

    /**
     * @param {string} title
     */
    getTabByTitle(title)
    {
        for (let i = 0; i < this._tabs.length; i++) if (this._tabs[i].title == title) return this._tabs[i];
    }

    /**
     * @param {string} id
     */
    getTabById(id)
    {
        for (let i = 0; i < this._tabs.length; i++) if (this._tabs[i].id == id) return this._tabs[i];
    }

    closeAllTabs()
    {
        while (this._tabs.length) this.closeTab(this._tabs[0].id);
    }

    /**
     * @param {string} id
     */
    closeTab(id)
    {
        let tab = null;
        let idx = 0;
        for (let i = 0; i < this._tabs.length; i++)
        {
            if (this._tabs[i].id == id)
            {
                tab = this._tabs[i];
                // tab.emitEvent("close");
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

    /**
     * @param {string} id
     * @param {boolean} changed
     */
    setChanged(id, changed)
    {
        if (this.getTabById(id)) this.getTabById(id).options.wasChanged = changed;
        this.updateHtml();
    }

    /**
     * @param {number} num
     */
    setTabNum(num)
    {
        const tab = this._tabs[Math.min(this._tabs.length, num)];
        this.activateTab(tab.id);
    }

    /**
     * @returns {number}
     */
    getNumTabs()
    {
        return this._tabs.length;
    }

    /**
     * @returns {Tab}
     */
    cycleActiveTab()
    {
        if (this._tabs.length <= 1) return;

        for (let i = 1; i < this._tabs.length; i++)
            if (this._tabs[i - 1].active)
                return this.activateTab(this._tabs[i].id);

        return this.activateTab(this._tabs[0].id);
    }

    /**
     * @returns {Tab}
     */
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

    /**
     * @param {Tab} tab
     * @param {boolean} [activate]
     * @returns {Tab}
     */
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

        this.updateHtml();
        this.emitEvent("onTabAdded", tab, false);

        return tab;
    }

    /**
     * @param {String} title
     * @param {String} url
     * @param {Object} options
     * @param {boolean} userInteraction
     * @returns {Tab}
     */
    addIframeTab(title, url, options, userInteraction)
    {
        const iframeTab = this.addTab(new CABLES.UI.Tab(title, options));
        const id = utils.uuid();

        const html = "<div class=\"loading\" id=\"loading" + id + "\" style=\"position:absolute;left:45%;top:34%\"></div><iframe id=\"iframe" + id + "\" allow=\"clipboard-write\" style=\"border:none;width:100%;height:100%\" src=\"" + url + "\" onload=\"document.getElementById('loading" + id + "').style.display='none';\"></iframe";
        iframeTab.contentEle.innerHTML = html;
        iframeTab.contentEle.style.padding = "0px";
        let buttons = "";
        let uri = url;
        if (options.gotoUrl)uri = options.gotoUrl;

        buttons += "<a class=\"button-small \" href=\"" + uri + "\" target=\"_blank\"><span class=\"icon nomargin icon-external\"></span></a>&nbsp;";
        buttons += "<a class=\"button-small \" id=\"refresh" + id + "\"><span class=\"icon nomargin icon-refresh\"></span></a>";

        iframeTab.toolbarEle.innerHTML = buttons;
        ele.clickable(ele.byId("refresh" + id), () =>
        {
            ele.byId("iframe" + id).src += "";

        });

        const frame = document.getElementById("iframe" + id);

        const talkerAPI = new CABLESUILOADER.TalkerAPI(frame.contentWindow);

        talkerAPI.on("setSavedState", (opts) =>
        {
            if (opts.state)
            {
                gui.savedState.setSaved("talkerAPI", opts.subpatch);
            }
            else
            {
                gui.savedState.setUnSaved("talkerAPI", opts.subpatch);
            }
        });

        talkerAPI.on("manualScreenshot", (opts, next) =>
        {
            platform.setManualScreenshot(opts.manualScreenshot);

            if (opts.manualScreenshot)
            {
                gui.patchView.store.saveScreenshot(true, () =>
                {
                    talkerAPI.send("screenshotSaved");
                });
            }
        });

        talkerAPI.on("notify", (opts, next) =>
        {
            notify(opts.msg, opts.text, opts.options);
        });

        talkerAPI.on("notifyError", (opts, next) =>
        {
            notifyError(opts.msg, opts.text, opts.options);
        });

        talkerAPI.on("updatePatchName", (opts, next) =>
        {
            gui.setProjectName(opts.name);
            platform.talkerAPI.send("updatePatchName", opts, (err, r) => {});
        });

        talkerAPI.on("updatePatchSummary", (opts, next) =>
        {
            gui.project().summary = opts;
            gui.patchParamPanel.show(true);
        });

        talkerAPI.on("opsDeleted", (opts, next) =>
        {
            const opdocs = gui.opDocs.getAll();
            const deletedOps = opts.ops || [];
            for (let i = 0; i < deletedOps.length; i++)
            {
                const deletedOp = deletedOps[i];
                const opDocToDelete = opdocs.findIndex((opDoc) => { return opDoc.id === deletedOp.id; });
                if (opDocToDelete) opdocs.splice(opDocToDelete, 1);
                gui.opSelect().reload();
            }
            let plural = deletedOps.length > 1 ? "s" : "";
            if (deletedOps.length > 0) notify("deleted " + deletedOps.length + " op" + plural);
            this.closeTab(iframeTab.id);
        });

        this.activateTab(iframeTab.id);
        gui.maintabPanel.show(userInteraction);
        return iframeTab;
    }
}
