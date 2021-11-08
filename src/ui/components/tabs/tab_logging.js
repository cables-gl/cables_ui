import ele from "../../utils/ele";

export default class LoggingTab extends CABLES.EventTarget
{
    constructor(tabs)
    {
        super();
        this._tabs = tabs;

        this._tab = new CABLES.UI.Tab("Logging", { "icon": "list", "infotext": "tab_logging", "padding": true, "singleton": "true", });
        this._tabs.addTab(this._tab, true);

        this.data = { "cells": this.cells, "colNames": this.colNames };


        this._html();
        CABLES.UI.logFilter.on("initiatorsChanged", this._html.bind(this));
    }

    _html()
    {
        const html = CABLES.UI.getHandleBarHtml("tab_logging", { "user": gui.user, "texts": CABLES.UI.TEXTS.preferences, "info": CABLES.UI.logFilter.getTabInfo() });
        this._tab.html(html);
    }
}
