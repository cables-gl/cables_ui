import Tab from "../../elements/tabpanel/tab";
import { getHandleBarHtml } from "../../utils/handlebars";
import text from "../../text";

export default class JobsTab extends CABLES.EventTarget
{
    constructor(tabs)
    {
        super();
        this._tabs = tabs;

        this._tab = new Tab("Jobs", { "icon": "list", "infotext": "tab_logging", "padding": true, "singleton": "true", });
        this._tabs.addTab(this._tab, true);
        this.data = { "cells": this.cells, "colNames": this.colNames };

        this._html();

        gui.corePatch().loading.on("finishedTask", this._html.bind(this));
        gui.corePatch().loading.on("addTask", this._html.bind(this));
        gui.corePatch().loading.on("startTask", this._html.bind(this));
    }

    _html()
    {
        let list = gui.corePatch().loading.getList();
        console.log(list);
        const html = getHandleBarHtml("tab_jobs", { "user": gui.user, "texts": text.preferences, "list": list });
        this._tab.html(html);
    }
}
