import { Events } from "cables-shared-client";
import Tab from "../../elements/tabpanel/tab.js";
import { getHandleBarHtml } from "../../utils/handlebars.js";
import text from "../../text.js";
import userSettings from "../usersettings.js";

export default class LoggingTab extends Events
{
    constructor(tabs)
    {
        super();
        this._tabs = tabs;
        this._logs = [];

        this.closed = false;

        this._tab = new Tab("Logging", { "icon": "list", "infotext": "tab_logging", "padding": true, "singleton": "true", });
        this._tabs.addTab(this._tab, true);
        this.data = { "cells": this.cells, "colNames": this.colNames };

        this._html();
        CABLES.UI.logFilter.on("initiatorsChanged", this._html.bind(this));
        // this._showlogListener = CABLES.UI.logFilter.on("logAdded", this._showLog.bind(this));

        this._showlogListener = CABLES.UI.logFilter.on("logAdded", this._showLog.bind(this));

        // window.gui.on("coreLogEvent", this.initiator, "warn", arguments);

        // coreLogEvent;

        userSettings.set("loggingOpened", true);

        this._tab.addEventListener(
            "close",
            () =>
            {
                this.closed = true;
                this.emitEvent("close");
                userSettings.set("loggingOpened", false);


                CABLES.UI.logFilter.off(this._showlogListener);
            },
        );
    }



    _html()
    {
        const html = getHandleBarHtml("tab_logging", { "user": gui.user, "texts": text.preferences, "info": CABLES.UI.logFilter.getTabInfo() });
        this._tab.html(html);
        this._showLog();
    }

    _showLog()
    {
        if (this.closed) return;
        let html = "";

        for (let i = CABLES.UI.logFilter.logs.length - 1; i >= 0; i--)
        {
            const l = CABLES.UI.logFilter.logs[i];
            html += "<div class=\"logLine logLevel" + l.level + "\">";
            html += "<span>[" + l.initiator + "]</span> ";
            html += l.txt;
            html += "</div>";
        }

        ele.byId("loggingHtmlId").innerHTML = html;
    }
}

