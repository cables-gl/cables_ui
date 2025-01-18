import { Events } from "cables-shared-client";
import Tab from "../../elements/tabpanel/tab.js";
import { getHandleBarHtml } from "../../utils/handlebars.js";
import text from "../../text.js";
import { gui } from "../../gui.js";
import { logFilter } from "../../utils/logfilter.js";

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
        logFilter.on("initiatorsChanged", this._html.bind(this));

        this._tab.addEventListener(
            "close",
            () =>
            {
                this.closed = true;
                this.emitEvent("close");

                logFilter.off(this._showlogListener);
            },
        );
    }

    _html()
    {
        const html = getHandleBarHtml("tab_logging", { "user": gui.user, "texts": text.preferences, "info": logFilter.getTabInfo() });
        this._tab.html(html);
    }

    _logLine(log, txt, level)
    {
        let html = "<div class=\"logLine logLevel" + level + "\">";
        html += "<span style=\"float:left\">[<span class=\"initiator\">";

        if (log.opInstId)
            html += "<a onclick=\"gui.patchView.centerSelectOp('" + log.opInstId + "');\">";

        html += log.initiator;

        if (log.opInstId)
            html += "</a>";

        html += "</span>]&nbsp;&nbsp;</span> ";
        html += "<div style=\"float:left\">";
        html += txt;
        html += "</div>";
        html += "</div>";

        return html;
    }
}
