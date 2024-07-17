import { Events } from "cables-shared-client";
import Tab from "../../elements/tabpanel/tab.js";
import text from "../../text.js";
import userSettings from "../usersettings.js";


export default class LogTab extends Events
{
    constructor(tabs)
    {
        super();
        this._tabs = tabs;
        this._logs = [];
        this.closed = false;

        this._tab = new Tab("Log", { "icon": "list", "infotext": "tab_logging", "padding": true, "singleton": "true", });
        this._tabs.addTab(this._tab, true);

        this.data = { "cells": this.cells, "colNames": this.colNames };

        this._html();
        CABLES.UI.logFilter.on("initiatorsChanged", this._html.bind(this));

        this._showlogListener = CABLES.UI.logFilter.on("logAdded", this._showLog.bind(this));


        userSettings.set("loggingOpened", true);

        this._tabs.on("resize", () =>
        {
            console.log(this._tab.contentEle, this._tab.contentEle.getBoundingClientRect());
        });

        const b = this._tab.addButton("Filter Logs", () => { CABLES.CMD.DEBUG.logging(); });


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
        const html = "<div id=\"loggingHtmlId123\" class=\"logList\"></div>";
        this._tab.html(html);
        this._showLog();
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

        html += "</span>]&nbsp;</span>";
        html += "<div style=\"float:left\">";
        html += txt;
        html += "</div>";
        html += "</div>";

        return html;
    }

    _showLog()
    {
        if (this.closed) return;
        let html = "";

        const startTime = performance.now();



        try
        {
            for (let i = CABLES.UI.logFilter.logs.length - 1; i >= 0; i--)
            {
                const l = CABLES.UI.logFilter.logs[i];

                if (!CABLES.UI.logFilter.shouldPrint(l)) continue;


                let currentLine = "";

                for (let j = 0; j < l.args.length; j++)
                {
                    if (l.args[j] &&
                    (
                        (l.args[j].constructor && l.args[j].constructor.name.indexOf("Error") > -1)
                    ))
                    {
                        console.log("stack1", performance.now() - startTime);


                        const ee = l.args[j];
                        const info = ErrorStackParser.parse(ee.error || ee);

                        console.log("ErrorStackParser", info);



                        console.log("stack2", performance.now() - startTime);
                        if (info && info.length > 0)
                        {
                            console.log("stack3", performance.now() - startTime);
                            console.log(info);

                            let stackHtml = "<table>";
                            for (let k = 0; k < info.length; k++)
                            {
                                stackHtml += "<tr>";
                                stackHtml += "  <td>" + info[k].functionName + "</td>";
                                stackHtml += "  <td>";
                                stackHtml += "  <a onclick=\"new CABLES.UI.ModalSourceCode({url:'" + info[k].fileName + "',line:" + info[k].lineNumber + "});\">";
                                stackHtml += info[k].fileName;
                                stackHtml += "  </a>";
                                stackHtml += "  </td>";
                                stackHtml += "  <td>" + info[k].lineNumber + ":" + info[k].columnNumber + "</td>";
                                stackHtml += "</tr>";
                            }
                            stackHtml += "</table>";

                            console.log("stack31", performance.now() - startTime);
                            html += this._logLine(l, stackHtml, l.level);

                            let txt = "[" + l.args[j].constructor.name + "] ";

                            if (ee.error)txt += " " + ee.error.message;
                            console.log("stack4", performance.now() - startTime);
                            html += this._logLine(l, txt, l.level);
                            console.log("stack5", performance.now() - startTime);
                        }
                        else
                        {
                            currentLine += "??? " + l.args[j].constructor.name;
                            console.log("what is this", l.args[j]);
                        }
                    }
                    else
                    {
                        console.log("else1", performance.now() - startTime);
                        if (l.args[j].constructor.name == "Op")
                        {
                            currentLine += "<a onclick=\"gui.patchView.centerSelectOp('" + l.args[j].id + "');\">op: " + l.args[j].shortName + "</a>";
                        }
                        else
                        if (typeof l.args[j] == "string") currentLine += l.args[j];
                        else
                        {
                            console.log("unknown log thiung", l.args[j]);
                        }
                        console.log("else2", performance.now() - startTime);
                    }
                }
                if (currentLine)html += this._logLine(l, currentLine, l.level);
            }
        }
        catch (e)
        {
            console.log("error in error");
        }

        const el = ele.byId("loggingHtmlId123");
        if (el)el.innerHTML = html;
    }
}

