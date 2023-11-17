import ModalDialog from "../dialogs/modaldialog";
import Logger from "../utils/logger";
import { hideNotificaton, notifyError } from "../elements/notification";
import ChangelogToast from "../dialogs/changelog";
import userSettings from "../components/usersettings";
import Gui from "../gui";
import undo from "../utils/undo";

export default class Api
{
    constructor()
    {
        this._log = new Logger("api");
        this.cache = [];
        this.lastErrorReport = null;
        this.pingTime = 0;
        this.maintenanceModeWarning = null;

        setTimeout(this.ping.bind(this), 5000);
    }

    ping()
    {
        if (window.gui)
        {
            if (gui.corePatch().isPlaying())
            {
                const startTime = performance.now();
                this.request("POST", "ping", { "lastPing": this.pingTime }, (msg) =>
                {
                    if (msg.maintenance)
                    {
                        if (!this.maintenanceModeWarning && gui.getRestriction() > Gui.RESTRICT_MODE_REMOTEVIEW)
                        {
                            const notifyOptions = {
                                "timeout": false,
                                "closeable": true,
                                "force": false
                            };
                            this.maintenanceModeWarning = notifyError("maintenance mode", "saving is disabled, please wait until we are done", notifyOptions);
                        }
                    }
                    else
                    {
                        if (this.maintenanceModeWarning)
                        {
                            hideNotificaton(this.maintenanceModeWarning);
                            this.maintenanceModeWarning = false;
                            const lastView = userSettings.get("changelogLastView");
                            const cl = new ChangelogToast();
                            cl.getHtml((clhtml) =>
                            {
                                if (clhtml !== null)
                                {
                                    cl.showNotification();
                                }
                            }, lastView);
                        }
                    }
                    this.pingTime = Math.round(performance.now() - startTime);
                    this._log.log("ping roundtrip", this.pingTime);
                });
            }
        }

        setTimeout(this.ping.bind(this), 30 * 1000);
    }

    request(method, url, data, cbSuccess, cbError, doCache)
    {
        url = CABLES.sandbox.getUrlApiPrefix() + url;

        const options = { "method": method };

        if (method == "POST")
        {
            options.headers = {
                "Accept": "application/json",
                "Content-Type": "application/json"
            };
            if (data) options.body = JSON.stringify(data);
        }

        const startTime = performance.now();

        fetch(url, options)
            .then((response) =>
            {
                if (response.json)
                {
                    response.json().catch((e) =>
                    {
                        console.log(e, url);
                    }).then((_data) =>
                    {
                        if (doCache)
                            this.cache.push({ url, method, _data });

                        const tooktime = Math.round(performance.now() - startTime);
                        if (tooktime > 350.0)
                        {
                            console.warn("- slow request: " + method + " " + url + ": " + tooktime + "ms");
                        }

                        if (cbSuccess) cbSuccess(_data);
                    });
                }
                else
                {
                    this._log.error("[cables_ui] api fetch err", response);
                    if (cbError) cbError(response);
                }
            })
            .catch((response) =>
            {
                if (response.json)
                {
                    response.json()
                        .then(
                            (_data) =>
                            {
                                if (CABLES && CABLES.UI && CABLES.UI.MODAL)
                                {
                                    if (_data.statusText == "NOT_LOGGED_IN")
                                    {
                                        new ModalDialog({
                                            "warning": true,
                                            "title": "not logged in",
                                            "html": "<br/>You are not logged in, so you can not save projects, or upload files. so all will be lost :/<br/><br/><br/><a class=\"bluebutton\" href=\"/signup\">sign up</a> <a class=\"bluebutton\" style=\"background-color:#222\" onclick=\"gui.closeModal()\">continue</a> <br/><br/> "
                                        });
                                    }
                                    else if (_data.statusText == "Multiple Choices")
                                    {
                                        this._log.warn("Fetch unknown file response...");
                                        this._log.log(url);
                                    }
                                    else
                                    {
                                        if (!cbError) new ModalDialog({
                                            "warning": true,
                                            "html": "Fetch Error: " + _data.statusText + "<br/><br/>" + url + "<br/><br/><a class=\"bluebutton\" style=\"background-color:#222\" onclick=\"gui.closeModal()\">ok</a> <br/><br/>"
                                        });
                                        this._log.log(_data);
                                    }
                                }

                                if (cbError) cbError(_data.responseJSON, _data);
                            }).catch(
                            (e) =>
                            {
                                if (cbError) cbError("error parsing json");
                            });
                }
                else
                {
                    this._log.error("[cables_ui] api fetch err", response);
                    if (cbError) cbError(response);
                }
            });
    }

    hasCached(url, method)
    {
        if (!method)method = "GET";
        for (let i = 0; i < this.cache.length; i++)
        {
            if (this.cache[i].url == url && this.cache[i].method == method)
                return this.cache[i];
        }
        return null;
    }

    clearCache()
    {
        this.cache.length = 0;
    }

    getCached(url, cb, cbErr)
    {
        for (let i = 0; i < this.cache.length; i++)
        {
            if (this.cache[i].url == url)
            {
                cb(this.cache[i].data);
                return;
            }
        }

        this.request("GET", url, {}, cb, cbErr, true);
    }

    get(url, cb, cbErr)
    {
        this.request("GET", url, {}, cb, cbErr);
    }

    post(url, data, cb, cbErr)
    {
        this.request("POST", url, data, cb, cbErr);
    }

    delete(url, data, cb, cbErr)
    {
        this.request("DELETE", url, data, cb, cbErr);
    }

    put(url, data, cb, cbErr)
    {
        this.request("PUT", url, data, cb, cbErr);
    }


    getErrorReport(err)
    {
        const report = err || CABLES.lastError || {};
        let history = [];
        if (undo)
        {
            history = undo.getCommands();
        }
        history = history.slice(-10);
        err = err || CABLES.lastError;

        report.time = Date.now();
        report.history = history;

        report.url = document.location.href;

        report.infoPlatform = navigator.platform;
        report.infoLanguage = navigator.language;
        report.infoUserAgent = navigator.userAgent;
        // report.opTriggerStack = err.opTriggerStack;

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

        // report.exception = {};
        // if (err.exception)
        // {
        //     report.exception = {
        //         "type": err.exception.type,
        //         "error": err.exception.error,
        //         "filename": err.exception.filename,
        //         "lineno": err.exception.lineno,
        //         "message": err.exception.message,
        //     };
        //     if (err.exception.stack) report.stack = err.exception.stack;
        //     if (err.exception.error && err.exception.error.stack) report.stack = err.exception.error.stack;
        // }

        // report.opName = err.opName;
        // report.errorLine = err.errorLine;

        // if (err.stackInfo)
        // {
        //     report.stackInfo = err.stackInfo;
        // }

        return report;
    }

    sendErrorReport(err, manualSend = true)
    {
        err = err || CABLES.lastError;
        const report = this.getErrorReport(err);

        const doneCallback = () =>
        {
            this._log.log("error report sent.");
            this._log.log(report);

            if (manualSend)
            {
                const modalOptions = {
                    "title": "Thank you",
                    "showOkButton": true,
                    "text": "We will look into it"
                };
                new ModalDialog(modalOptions);
            }

            CABLES.lastError = null;
        };

        let sendReport = true;
        if (!manualSend)
        {
            if (this.lastErrorReport)
            {
                sendReport = (performance.now() - this.lastErrorReport) > 2000;
            }
            if (gui && gui.user && gui.user.isStaff) sendReport = false;
        }

        if (!sendReport)
        {
            doneCallback();
        }
        else
        {
            this.lastErrorReport = performance.now();
            if (CABLESUILOADER && CABLESUILOADER.talkerAPI)
            {
                CABLESUILOADER.talkerAPI.send("sendBrowserInfo", {}, (browserInfo) =>
                {
                    report.browserInfo = browserInfo;
                    CABLES.api.post("errorReport", report, doneCallback);
                });
            }
            else
            {
                CABLES.api.post("errorReport", report, doneCallback);
            }
        }
    }
}
