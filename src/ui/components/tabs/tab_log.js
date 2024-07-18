import { Events } from "cables-shared-client";
import Tab from "../../elements/tabpanel/tab.js";
import text from "../../text.js";
import userSettings from "../usersettings.js";
import undo from "../../utils/undo.js";


export default class LogTab extends Events
{
    constructor(tabs)
    {
        super();
        this._tabs = tabs;
        this._logs = [];
        this.closed = false;
        this.report = [];

        this._hasError = false;

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

        for (let i = CABLES.UI.logFilter.logs.length - 1; i >= 0; i--)
        {
            const l = CABLES.UI.logFilter.logs[i];
            for (let j = 0; j < l.args.length; j++)
            {
                const arg = l.args[j];

                try
                {
                    ErrorStackParser.parse(arg.error || arg);
                    this._hasError = true;
                }
                catch (e)
                {
                }
            }
        }

        if (this._hasError)
        {
            html += "<div class=\"logLine logLevel" + 99 + "\">";
            html += "  <a class=\"button-small\" id=\"sendErrorReport\">Send error report</a>";
            html += "</div>";
        }

        try
        {
            for (let i = CABLES.UI.logFilter.logs.length - 1; i >= 0; i--)
            {
                const l = CABLES.UI.logFilter.logs[i];
                let currentLine = "";

                if (!CABLES.UI.logFilter.shouldPrint(l)) continue;

                for (let j = 0; j < l.args.length; j++)
                {
                    const arg = l.args[j];

                    let errorStack = null;
                    try
                    {
                        errorStack = ErrorStackParser.parse(arg.error || arg);
                    }
                    catch (e)
                    {
                        errorStack = null;
                    }
                    if (errorStack)
                    {
                        l.errorStack = errorStack;
                        if (errorStack && errorStack.length > 0)
                        {
                            let stackHtml = "<table>";
                            for (let k = 0; k < errorStack.length; k++)
                            {
                                stackHtml += "<tr>";
                                stackHtml += "  <td>" + errorStack[k].functionName + "</td>";
                                stackHtml += "  <td>";
                                stackHtml += "  <a onclick=\"new CABLES.UI.ModalSourceCode({url:'" + errorStack[k].fileName + "',line:" + errorStack[k].lineNumber + "});\">";
                                stackHtml += errorStack[k].fileName;
                                stackHtml += "  </a>";
                                stackHtml += "  </td>";
                                stackHtml += "  <td>" + errorStack[k].lineNumber + ":" + errorStack[k].columnNumber + "</td>";
                                stackHtml += "</tr>";
                            }
                            stackHtml += "</table>";

                            html += this._logLine(l, stackHtml, l.level);

                            let txt = "[" + arg.constructor.name + "] ";

                            if (arg.error)txt += " " + arg.error.message;
                            html += this._logLine(l, txt, l.level);
                        }
                        else
                        {
                            currentLine += "??? " + arg.constructor.name;
                            console.log("what is this", arg);
                        }
                    }
                    else
                    {
                        if (arg.constructor.name == "Op")
                        {
                            currentLine += " <a onclick=\"gui.patchView.centerSelectOp('" + arg.id + "');\">op: " + arg.shortName + "</a>";
                        }
                        else
                        if (typeof arg == "string")
                        {
                            currentLine += arg;
                        }
                        else
                        {
                            console.log("unknown log thiung", arg);
                        }
                    }
                }
                if (currentLine) html += this._logLine(l, currentLine, l.level);
            }
        }
        catch (e)
        {
            console.log("error in error");
        }

        const el = ele.byId("loggingHtmlId123");
        if (el)el.innerHTML = html;

        if (ele.byId("sendErrorReport"))
        {
            ele.byId("sendErrorReport").addEventListener("click", () =>
            {
                console.log("click button");

                CABLES.api.sendErrorReport(this.createReport(), true);
            });
        }
    }

    createReport()
    {
        const report = {};

        const log = [];
        for (let i = CABLES.UI.logFilter.logs.length - 1; i >= 0; i--)
        {
            const l = CABLES.UI.logFilter.logs[i];
            let newLine = {
                "initiator": l.initiator,
                "errorStack": l.errorStack,
                "args": [],
                "level": l.level
            };

            log.push(newLine);

            for (let j = 0; j < l.args.length; j++)
            {
                const arg = l.args[j];
                let neewArg = "";

                try
                {
                    neewArg = JSON.parse(JSON.stringify(arg));
                }
                catch (e)
                {
                    if (arg.constructor.name == "Op")
                    {
                        neewArg = { "objName": arg.objName, "id": arg.id, "opId": arg.opId };
                    }
                    else if (arg.getSerialized)
                    {
                        neewArg = arg.getSerialized();
                    }
                    else if (arg.serialize)
                    {
                        neewArg = arg.serialize();
                    }
                    else
                    {
                        neewArg = " unknow, could not serialize:" + arg.constructor.name;
                    }
                }
                newLine.args.push(neewArg);
            }
        }

        report.log = log;

        let history = [];
        if (undo) history = undo.getCommands();
        history = history.slice(-10);


        report.time = Date.now();
        report.history = history;

        report.url = document.location.href;
        report.infoLanguage = navigator.language;

        if (window.gui)
        {
            if (gui.project()) report.projectId = gui.project()._id;
            if (gui.user)
            {
                report.username = gui.user.username;
                report.userId = gui.user.id;
            }

            try
            {
                const dbgRenderInfo = gui.corePatch().cgl.gl.getExtension("WEBGL_debug_renderer_info");
                report.glRenderer = gui.corePatch().cgl.gl.getParameter(dbgRenderInfo.UNMASKED_RENDERER_WEBGL);
            }
            catch (e)
            {
                this._log.log(e);
            }
        }

        return report;
    }
}

