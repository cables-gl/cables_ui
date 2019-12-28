CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.Tab = function (title, options)
{
    CABLES.EventTarget.apply(this);
    this.id = CABLES.uuid();
    this.options = options || {};
    if (!options.hasOwnProperty("showTitle")) this.options.showTitle = true;
    if (!options.hasOwnProperty("hideToolbar")) this.options.hideToolbar = false;
    if (!options.hasOwnProperty("closable")) this.options.closable = true;
    if (!options.hasOwnProperty("name")) this.options.name = title;

    this.icon = this.options.icon || null;
    this.title = title;
    this.active = false;
    this.toolbarContainerEle = document.createElement("div");
    this.contentEle = document.createElement("div");
    this.toolbarEle = document.createElement("div");
    this.buttons = [];
};

CABLES.UI.Tab.prototype.initHtml = function (eleContainer)
{
    if (!this.options.hideToolbar)
    {
        this.toolbarContainerEle.id = "toolbar" + this.id;
        this.toolbarContainerEle.classList.add("toolbar");
        this.toolbarContainerEle.innerHTML = CABLES.UI.getHandleBarHtml("tabpanel_toolbar", 
        {
            options: this.options, id: this.id, title: this.title, hideToolbar: true,
        });
        eleContainer.appendChild(this.toolbarContainerEle);
        document.getElementById("toolbarContent" + this.id).appendChild(this.toolbarEle);
    }

    this.contentEle.id = "content" + this.id;
    this.contentEle.classList.add("tabcontent");
    if (this.options.padding) this.contentEle.classList.add("padding");
    this.contentEle.innerHTML = "hello " + this.title + "<br/><br/>the tab " + this.id;
    eleContainer.appendChild(this.contentEle);
};

CABLES.UI.Tab.prototype.addButton = function (title, cb)
{
    var button = document.createElement("a");
    button.innerHTML = title;
    button.addEventListener("click", cb);
    this.toolbarEle.appendChild(button);
    this.buttons.push({ ele: button, cb, title });
};

CABLES.UI.Tab.prototype.getSaveButton = function ()
{
    for (var i = 0; i < this.buttons.length; i++) if (this.buttons[i].title == "save") return this.buttons[i];
};

CABLES.UI.Tab.prototype.remove = function ()
{
    this.emitEvent("onClose", this);
    this.contentEle.remove();
    this.toolbarContainerEle.remove();
};

CABLES.UI.Tab.prototype.html = function (html)
{
    this.contentEle.innerHTML = html;
};

CABLES.UI.Tab.prototype.isVisible = function ()
{
    return this.active;
};

CABLES.UI.Tab.prototype.updateSize = function ()
{
    this.contentEle.style.height=(this.contentEle.parentElement.clientHeight-this.toolbarContainerEle.clientHeight-3)+"px";
}

CABLES.UI.Tab.prototype.activate = function ()
{
    this.active = true;
    this.contentEle.style.display = "block";
    this.toolbarContainerEle.style.display = "block";
    this.updateSize();
    this.emitEvent("onActivate");
};

CABLES.UI.Tab.prototype.deactivate = function ()
{
    this.active = false;
    this.contentEle.style.display = "none";
    this.toolbarContainerEle.style.display = "none";
    this.emitEvent("ondeactivate");
};

// -----------------

CABLES.UI.TabPanel = function (eleId)
{
    CABLES.EventTarget.apply(this);

    this._eleId = eleId;
    this._tabs = [];
    this._eleContentContainer = null;
    this._eleTabPanel = null;

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

    this.on("resize",()=>
    {
        for(var i=0;i<this._tabs.length;i++) this._tabs[i].emitEvent("resize");
    });
};

CABLES.UI.TabPanel.prototype.updateHtml = function ()
{
    var html = "";
    html += CABLES.UI.getHandleBarHtml("tabpanel_bar", { tabs: this._tabs });
    this._eleTabPanel.innerHTML = html;

    for (var i = 0; i < this._tabs.length; i++)
    {
        document.getElementById("editortab" + this._tabs[i].id).addEventListener(
            "mousedown",
            function (e)
            {
                if (e.target.dataset.id) this.activateTab(e.target.dataset.id);
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
};

CABLES.UI.TabPanel.prototype.activateTabByName = function (name)
{
    var found=false;
    for (var i = 0; i < this._tabs.length; i++)
    {
        if (this._tabs[i].options.name == name)
        {
            this.activateTab(this._tabs[i].id);
            found=true;
        }
        else this._tabs[i].deactivate();
    }

    if(!found) console.log("[activateTabByName] could not find tab",name);

    this.updateHtml();
};

CABLES.UI.TabPanel.prototype.scrollToActiveTab = function ()
{
    const tab = this.getActiveTab();
    const w = this._eleTabPanel.clientWidth;
    if (!tab) return;
    var left = document.getElementById("editortab" + tab.id).offsetLeft;
    left += document.getElementById("editortab" + tab.id).clientWidth;
    left += 25;

    const tabContainer = document.querySelector("#maintabs .tabs");
    if (tabContainer && left > w) tabContainer.scrollLeft = left;
};

CABLES.UI.TabPanel.prototype.activateTab = function (id)
{
    for (var i = 0; i < this._tabs.length; i++)
    {
        if (this._tabs[i].id === id)
        {
            this.emitEvent("onTabActivated", this._tabs[i]);
            this._tabs[i].activate();
            CABLES.UI.userSettings.set("tabsLastTitle_" + this._eleId, this._tabs[i].title);
        }
        else this._tabs[i].deactivate();
    }
    this.updateHtml();
};

CABLES.UI.TabPanel.prototype.getTabByTitle = function (title)
{
    for (var i = 0; i < this._tabs.length; i++) if (this._tabs[i].title == title) return this._tabs[i];
};

CABLES.UI.TabPanel.prototype.getTabById = function (id)
{
    for (var i = 0; i < this._tabs.length; i++) if (this._tabs[i].id == id) return this._tabs[i];
};

CABLES.UI.TabPanel.prototype.closeTab = function (id)
{
    var tab = null;
    var idx = 0;
    for (var i = 0; i < this._tabs.length; i++)
    {
        if (this._tabs[i].id == id)
        {
            tab = this._tabs[i];
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
};

CABLES.UI.TabPanel.prototype.setChanged = function (id, changed)
{
    this.getTabById(id).options.wasChanged = changed;
    this.updateHtml();
};

CABLES.UI.TabPanel.prototype.setTabNum = function (num)
{
    var tab = this._tabs[Math.min(this._tabs.length, num)];
    this.activateTab(tab.id);
};

CABLES.UI.TabPanel.prototype.getNumTabs = function ()
{
    return this._tabs.length;
};

CABLES.UI.TabPanel.prototype.getActiveTab = function ()
{
    for (var i = 0; i < this._tabs.length; i++) if (this._tabs[i].active) return this._tabs[i];
};

CABLES.UI.TabPanel.prototype.updateSize = function ()
{
    for (var i = 0; i < this._tabs.length; i++) this._tabs[i].updateSize();
};

CABLES.UI.TabPanel.prototype.getSaveButton = function ()
{
    var t = this.getActiveTab();
    if (!t) return;

    var b = t.getSaveButton();
    if (b) return b;
};

CABLES.UI.TabPanel.prototype.addTab = function (tab, activate)
{
    if (tab.options.singleton)
    {
        var t = this.getTabByTitle(tab.title);
        if (t)
        {
            this.activateTab(t.id);
            this.emitEvent("onTabAdded", t);

            if (activate) this.activateTab(t.id);

            return t;
        }
    }

    tab.initHtml(this._eleContentContainer);
    this._tabs.push(tab);

    if (activate) this.activateTab(tab.id);
    else
    {
        for (var i = 0; i < this._tabs.length; i++)
        {
            if (CABLES.UI.userSettings.get("tabsLastTitle_" + this._eleId) == this._tabs[i].title)
            {
                this.activateTab(this._tabs[i].id);
            }
            else
            {
                this._tabs[i].deactivate();
            }
        }
    }

    // var tabEl=document.getElementById("editortab"+tab.id)

    this.updateHtml();
    this.emitEvent("onTabAdded", tab);

    return tab;
};

CABLES.UI.TabPanel.prototype.addIframeTab = function (title, url, options)
{
    var iframeTab = this.addTab(new CABLES.UI.Tab(title, options));
    const id = CABLES.uuid();

    var html = "<div class=\"loading\" id=\"loading" + id + "\" style=\"position:absolute;left:45%;top:35%\"></div><iframe id=\"iframe" + id + "\"  style=\"border:none;width:100%;height:100%\" src=\"" + url + "\" onload=\"document.getElementById('loading" + id + "').style.display='none';\"></iframe";
    iframeTab.contentEle.innerHTML = html;
    iframeTab.contentEle.style.padding = "0px";
    iframeTab.toolbarEle.innerHTML = "<a href=\"" + url + "\" target=\"_blank\">open this in a new browser window</a>";

    var frame = document.getElementById("iframe" + id);
    var talkerAPI = new CABLESUILOADER.TalkerAPI(frame.contentWindow);

    talkerAPI.addEventListener("notify", (options, next) =>
    {
        CABLES.UI.notify(options.msg);
    });

    talkerAPI.addEventListener("notifyError", (options, next) =>
    {
        CABLES.UI.notifyError(options.msg);
    });

    talkerAPI.addEventListener("updatePatchName", (options, next) =>
    {
        gui.setProjectName(options.name);
    });

    this.activateTab(iframeTab.id);
    gui.maintabPanel.show();
    return iframeTab;
};
