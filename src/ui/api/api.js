
export default class Api
{
    constructor()
    {
        this.cache = [];
        this.lastErrorReport = 0;
        this.pingTime = 0;

        setTimeout(this.ping.bind(this), 5000);
    }

    ping()
    {
        if (!CABLES.UI.idling)
        {
            const startTime = performance.now();
            this.request("GET", "ping", {}, () =>
            {
                this.pingTime = Math.round(performance.now() - startTime);
            });
        }

        setTimeout(this.ping.bind(this), 30000);
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

        fetch(url, options)
            .then(function (response)
            {
                if (response.json) response.json().then(function (_data)
                {
                    if (doCache)
                        this.cache.push({ url, method, _data });

                    if (cbSuccess) cbSuccess(_data);
                });
                else console.error("[cables_ui] api fetch err", response);
            })
            .catch(function (response)
            {
                if (response.json)
                    response.json().then(function (_data)
                    {
                        if (CABLES && CABLES.UI && CABLES.UI.MODAL)
                        {
                            if (_data.statusText == "NOT_LOGGED_IN")
                            {
                                CABLES.UI.MODAL.showError("not logged in", "<br/>You are not logged in, so you can not save projects, or upload files. so all will be lost :/<br/><br/><br/><a class=\"bluebutton\" href=\"/signup\">sign up</a> <a class=\"bluebutton\" style=\"background-color:#222\" onclick=\"CABLES.UI.MODAL.hide()\">continue</a> <br/><br/> ");
                            }
                            else
                            if (_data.statusText == "Multiple Choices")
                            {
                                console.warn("Fetch unknown file response...");
                                console.log(url);
                            }
                            else
                            {
                                if (!cbError) CABLES.UI.MODAL.show("Fetch Error: " + _data.statusText + "<br/><br/>" + url + "<br/><br/><a class=\"bluebutton\" style=\"background-color:#222\" onclick=\"CABLES.UI.MODAL.hide()\">ok</a> <br/><br/>");
                                console.log(_data);
                            }
                        }

                        if (cbError)cbError(_data.responseJSON, _data);
                    });
                else
                    console.error("[cables_ui] api fetch err", response);
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


    sendErrorReport(err)
    {
        err = err || CABLES.lastError;
        const report = {};
        report.time = Date.now();

        this.lastErrorReport = Date.now();
        if (window.gui)report.projectId = gui.project()._id;
        if (window.gui)report.username = gui.user.username;
        if (window.gui)report.userId = gui.user.id;
        report.url = document.location.href;

        report.infoPlatform = navigator.platform;
        report.infoLanguage = navigator.language;
        report.infoUserAgent = navigator.userAgent;

        if (window.gui)
        {
            try
            {
                const dbgRenderInfo = gui.corePatch().cgl.gl.getExtension("WEBGL_debug_renderer_info");
                report.glRenderer = gui.corePatch().cgl.gl.getParameter(dbgRenderInfo.UNMASKED_RENDERER_WEBGL);
            }
            catch (e)
            {
                console.log(e);
            }
        }


        report.exception = err.exception;
        if (err.exception && err.exception.stack)
            report.stack = err.exception.stack;

        report.opName = err.opName;
        report.errorLine = err.errorLine;

        console.log("error report sent.");
        console.log(report);

        CABLES.api.post("errorReport", report, function (d)
        {
            CABLES.UI.MODAL.showClose();
            CABLES.UI.MODAL.init();

            let html = "";
            html += "<center>";
            html += "<img src=\"" + CABLES.sandbox.getCablesUrl() + "/img/bug.gif\"/><br/><br/>";
            html += "<h2>thank you</h2>";
            html += "we will look into it<br/>";
            html += "<br/>";
            html += "&nbsp;&nbsp;<a class=\"greybutton\" onclick=\"CABLES.UI.MODAL.hide()\">&nbsp;&nbsp;&nbsp;ok&nbsp;&nbsp;&nbsp;</a>";
            html += "</center>";

            CABLES.UI.MODAL.show(html, { "title": "" });
            CABLES.lastError = null;
        });
    }
}
