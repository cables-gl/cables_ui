import { Events, Logger, ele } from "cables-shared-client";
import ErrorStackParser from "error-stack-parser";
import { utils } from "cables";
import Tab from "../../elements/tabpanel/tab.js";
import undo from "../../utils/undo.js";
import { gui } from "../../gui.js";
import { platform } from "../../platform.js";
import { userSettings } from "../usersettings.js";
import { logFilter } from "../../utils/logfilter.js";

/**
 * Tab panel to display logging of cables logger
 *
 * @export
 * @class LogTab
 * @extends {Events}
 */
export default class LogTab extends Events
{
    constructor(tabs)
    {
        super();
        this._tabs = tabs;
        this._log = new Logger("LogTab");
        this._logs = [];
        this.closed = false;
        this.report = [];
        this.lastErrorSrc = [];
        this._hasError = false;
        this.lastErrorMsg = null;
        this.sentAutoReport = false;
        this.hasErrorButton = false;

        this._tab = new Tab("Log", { "icon": "list", "infotext": "tab_logging", "padding": true, "singleton": "true", });
        this._tabs.addTab(this._tab, true);

        this.data = { "cells": this.cells, "colNames": this.colNames };

        this._html();
        logFilter.on("initiatorsChanged", this._html.bind(this));

        this._showlogListener = logFilter.on("logAdded", this._showLog.bind(this));

        const b = this._tab.addButton("Filter Logs", () => { CABLES.CMD.DEBUG.logging(); });

        const alwaysOpenButton = this._tab.addButton("Always open: " + (userSettings.get("openLogTab") || false), () =>
        {
            userSettings.set("openLogTab", !userSettings.get("openLogTab"));
            alwaysOpenButton.innerHTML = "Always open: " + (userSettings.get("openLogTab") || false);
        });

        this._tab.addButton("Clear", () =>
        {
            logFilter.logs.length = 0; this._html();
        });

        this._tab.addButton("Copy to clipboard", () =>
        {
            const el = ele.byId("loggingHtmlId123");
            let txt = el.innerText;
            txt = txt.replaceAll("] \n", "] ");
            let lines = txt.split("\n");
            lines = lines.reverse();
            txt = lines.join("\n");
            navigator.clipboard.writeText(txt);
        });

        this._tab.addEventListener(
            "close",
            () =>
            {
                this.close();
            });
    }

    close()
    {
        this.closed = true;
        logFilter.off(this._showlogListener);
        this.emitEvent("close");
        gui.hideBottomTabs();
        gui.logTab = null;
    }

    _html()
    {
        const html = "<div id=\"loggingHtmlId123\" class=\"logList\"></div>";
        this._tab.html(html);
        this._showLog();
    }

    _logLine(log, txt, level, timediff)
    {
        let spacerClass = "";

        if (Math.abs(timediff) > 300)spacerClass = "loglineSpacer";
        let html = "<div class=\"logLine " + spacerClass + " logLevel" + level + "\">";
        html += "<span style=\"float:left\" class=\"outerInitiator\">[<span class=\"initiator\">";

        if (log.opInstId)
            html += "<a onclick=\"gui.patchView.centerSelectOp('" + log.opInstId + "');\">";

        html += log.initiator;

        if (log.opInstId) html += "</a>";

        html += "</span>]&nbsp;</span>";
        html += "<div style=\"float:left\" class=\"initiator_" + log.initiator + "\">";
        html += txt;
        html += "</div>";
        html += "</div>";

        if (html.indexOf("`") > -1)
        {
            const parts = html.split("`");

            parts.splice(1, 0, "<span class=\"logLineCode\">");
            parts.splice(3, 0, "</span>");

            html = parts.join("");
        }

        return html;
    }

    _showLog()
    {
        if (this.closed) return;
        let html = "";

        if (gui.isRemoteClient)
        {
            const el = ele.byId("bottomtabs");
            if (el)el.style.zIndex = 1111111;
        }

        for (let i = logFilter.logs.length - 1; i >= 0; i--)
        {
            const l = logFilter.logs[i];
            for (let j = 0; j < l.args.length; j++)
            {
                const arg = l.args[j];

                if (!arg) continue;
                if (arg.constructor && arg.constructor.name.indexOf("Error") > -1) this._hasError = true;

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

        if (this._hasError && !this.hasErrorButton)
        {
            this.hasErrorButton = true;
            this._tab.addButton("Send Error Report", () =>
            {
                const errorReport = gui.patchView.store.createErrorReport(this.lastErrorMsg);
                gui.patchView.store.sendErrorReport(errorReport, true);
            });
        }

        try
        {
            let lastTime = 0;
            for (let i = logFilter.logs.length - 1; i >= 0; i--)
            {
                const l = logFilter.logs[i];
                let currentLine = "";
                const timediff = l.time - lastTime;
                lastTime = l.time;

                if (!logFilter.shouldPrint(l)) continue;

                for (let j = 0; j < l.args.length; j++)
                {
                    const arg = l.args[j];

                    let errorStack = null;
                    try
                    {
                        errorStack = ErrorStackParser.parse(arg.error || arg.reason || arg);
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
                            for (let k = 0; k < Math.min(2, errorStack.length); k++)
                            {
                                if (k === 0 && i == logFilter.logs.length - 1)
                                    this._logErrorSrcCodeLine(l, errorStack[k].fileName, errorStack[k].lineNumber - 1);

                                errorStack[k].fileName = errorStack[k].fileName || null;

                                if (errorStack[k].fileName)
                                {
                                    const shortFilename = errorStack[k].fileName.replaceAll("https://", "");
                                    if (errorStack[k].functionName)stackHtml += "  <td>" + errorStack[k].functionName + "</td>";
                                    stackHtml += "  <td>";

                                    if (errorStack[k].fileName.indexOf("https://") == 0 || errorStack[k].fileName.indexOf("http://") == 0 || errorStack[k].fileName.indexOf("file://") == 0 || errorStack[k].fileName.indexOf("cables://") == 0)
                                        stackHtml += "  <a onclick=\"new CABLES.UI.ModalSourceCode({url:'" + errorStack[k].fileName + "',line:" + errorStack[k].lineNumber + "});\">";
                                    else stackHtml += errorStack[k].fileName + ":" + errorStack[k].lineNumber + "";

                                    stackHtml += shortFilename;
                                    stackHtml += "@" + errorStack[k].lineNumber + ":" + errorStack[k].columnNumber + "</a></td>";
                                }
                                stackHtml += "</tr>";
                            }
                            stackHtml += "</table>";

                            html += this._logLine(l, stackHtml, l.level, timediff);

                            let txt = "[" + arg.constructor.name + "] ";
                            let msg = "";

                            if (arg.message)msg = arg.message;
                            if (arg.error)msg = arg.error.message;
                            if (arg.reason)msg = arg.reason.message;

                            this.lastErrorMsg = "";
                            if (errorStack && errorStack[0] && errorStack[0].functionName) this.lastErrorMsg += CABLES.basename(errorStack[0].fileName) + ": " + errorStack[0].functionName + ": ";
                            if (msg) this.lastErrorMsg += msg;
                            txt += " " + msg;

                            html += this._logLine(l, txt, l.level);
                        }
                        else
                        {
                            currentLine += "??? " + arg.constructor.name;
                            this._log.log("what is this", arg);
                        }
                    }
                    else
                    {
                        if (arg)
                        {
                            if (arg.constructor.name.indexOf("Error") > -1 && (arg.hasOwnProperty("message") || arg.message))
                            {
                                let txt = "[<b>" + arg.constructor.name + "</b>]";
                                if (arg.message)txt += ": " + arg.message.replaceAll("\n", "<br/>").replaceAll("  ", "&nbsp;&nbsp;");

                                currentLine = txt;
                            }
                            else if (arg.constructor.name == "Op")
                            {
                                currentLine += " <a onclick=\"gui.patchView.centerSelectOp('" + arg.id + "');\">op: " + arg.shortName + "</a>";
                            }
                            else if (typeof arg == "string")
                            {
                                let _arg = arg.replaceAll("\n", "<br/>");
                                if (arg.startsWith("https://"))
                                {
                                    _arg = "<a href=\"" + arg + "\" target=\"_blank\">" + arg + "</a>";
                                }
                                currentLine += _arg + " ";
                            }
                            else if (typeof arg == "number")
                            {
                                currentLine += String(arg) + " ";
                            }
                            else if (arg.constructor.name == "PromiseRejectionEvent")
                            {
                                if (arg.reason && arg.reason.message)
                                    currentLine += arg.constructor.name + ": " + arg.reason.message;
                            }
                            else
                            {
                                currentLine += "<br/>";
                                currentLine += "Log Object Arg " + j + ": [<b>" + arg.constructor.name + "</b>]<br/>";
                                currentLine += "{<br/>";

                                for (let oi in arg)
                                {
                                    if (arg[oi] && arg[oi].constructor)
                                    {
                                        currentLine += "&nbsp;&nbsp;&nbsp;&nbsp;\"" + oi + "\": <b>";

                                        if (arg[oi].constructor.name == "Number" || arg[oi].constructor.name == "String" || arg[oi].constructor.name == "Boolean")
                                        {
                                            if (arg[oi].constructor.name == "String")currentLine += "\"";
                                            currentLine += arg[oi];
                                            if (arg[oi].constructor.name == "String")currentLine += "\"";
                                        }
                                        else
                                        {
                                            currentLine += "[" + arg[oi].constructor.name + "]";
                                        }
                                        currentLine += "</b>,<br/>";
                                    }
                                }
                                currentLine += "}<br/>";
                            }
                        }
                    }
                }
                if (currentLine) html += this._logLine(l, currentLine, l.level, timediff);
            }
        }
        catch (e)
        {
            this._log.log("error in error", e);
        }

        const el = ele.byId("loggingHtmlId123");
        if (el)el.innerHTML = html;
    }

    _logErrorSrcCodeLine(l, url, line)
    {
        if (!url) return;
        if (url.includes("[native code]")) return;
        if (this.lastErrorSrc.indexOf(url + line) > -1) return;
        this.lastErrorSrc.push(url + line);

        // export const ajax = function (url, cb, method, post, contenttype, jsonP, headers = {}, options = {})

        const logger = this._log;
        utils.ajax(
            url,
            (err, _data, xhr) =>
            {
                if (err)
                {
                    this._log.error("error fetching logline2", url, err, _data, xhr);
                    return;
                }

                try
                {
                    let lines = _data.match(/^.*((\r\n|\n|\r)|$)/gm);

                    let lStr = lines[line];
                    if (!lStr) return;
                    const maxLength = 150;
                    if (lStr.length > maxLength) lStr = lStr.substring(0, maxLength) + "...";

                    const str = "file: \"" + utils.basename(url) + "\" line " + line + ": `" + lStr + "`";
                    logger.errorGui(str);

                    if ( // do not send error report
                        url.indexOf("api/op/") == -1 && // custom executed op ?
                        url.indexOf("api/op/Ops.User.") == -1 && // when user ops
                        url.indexOf("api/op/Ops.Patch.") == -1 && // when patch ops
                        url.indexOf("api/op/Ops.Team.") == -1 && //  when team ops
                        url.indexOf("cables.gl/assets/") == -1 && //  when asset libraries
                        url.indexOf("/api/lib/") == -1 && //  when libraries
                        url.indexOf("ops/code/project/") == -1 //  when using patch special ops

                    )
                    {
                        if (!this.sentAutoReport)
                        {
                            this.sentAutoReport = true;
                            setTimeout(() =>
                            {
                                const errorReport = gui.patchView.store.createErrorReport(this.lastErrorMsg);
                                gui.patchView.store.sendErrorReport(errorReport, false);
                            }, 500);
                        }
                    }
                }
                catch (e)
                {
                    this._log.log("could not parse lines.", e, url);
                }
            },
            "GET",
            null,
            null,
            null,
            null,
            { "credentials": true });
    }
}
