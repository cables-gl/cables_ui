CABLES = CABLES || {};

CABLES.lastError = null;

CABLES.API = function ()
{
    const cache = [];

    function request(method, url, data, cbSuccess, cbError, doCache)
    {
        url = CABLES.sandbox.getUrlApiPrefix() + url;

        fetch(url,
            {
                "dataType": "json",
                "data": data,
                "method": method,
            })
            .then(function (response)
            {
                console.log(response);

                response.json().then(function (_data)
                {
                    if (doCache)
                        cache.push({ url, method, _data });

                    if (cbSuccess) cbSuccess(_data);
                });
            })
            .catch(function (response)
            {
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
            });


        // $.ajax(
        //     {
        //         method,
        //         url,
        //         data
        //     })
        //     .done(function (data)
        //     {
        //         if (doCache)
        //             cache.push({ url, method, data });

        //         if (cbSuccess) cbSuccess(data);
        //     })
        //     .fail(function (data)
        //     {
        //         if (CABLES && CABLES.UI && CABLES.UI.MODAL)
        //         {
        //             if (data.statusText == "NOT_LOGGED_IN")
        //             {
        //                 CABLES.UI.MODAL.showError("not logged in", "<br/>you are not logged in, so you can not save projects, or upload files. so all will be lost :/<br/><br/><br/><a class=\"bluebutton\" href=\"/signup\">sign up</a> <a class=\"bluebutton\" style=\"background-color:#222\" onclick=\"CABLES.UI.MODAL.hide()\">continue</a> <br/><br/> ");
        //             }
        //             else
        //             if (data.statusText == "Multiple Choices")
        //             {
        //                 console.warn("ajax unknown file response...");
        //                 console.log(url);
        //             }
        //             else
        //             {
        //                 if (!cbError) CABLES.UI.MODAL.show("12 Ajax Error: " + data.statusText + "<br/><br/>" + url + "<br/><br/><a class=\"bluebutton\" style=\"background-color:#222\" onclick=\"CABLES.UI.MODAL.hide()\">ok</a> <br/><br/>");
        //                 console.log(data);
        //             }
        //         }

        //         if (cbError)cbError(data.responseJSON, data);
        //     })
        //     .always(function ()
        //     {
        //     // console.log( "complete" );
        //     });
    }

    this.hasCached = function (url, method)
    {
        if (!method)method = "GET";
        for (let i = 0; i < cache.length; i++)
        {
            if (cache[i].url == url && cache[i].method == method)
                return cache[i];
        }
        return null;
    };

    this.clearCache = function ()
    {
        // console.log('cache cleared....');
        cache.length = 0;
    };

    this.getCached = function (url, cb, cbErr)
    {
        for (let i = 0; i < cache.length; i++)
        {
            if (cache[i].url == url)
            {
                cb(cache[i].data);
                return;
            }
        }

        request("GET", url, {}, cb, cbErr, true);
    };

    this.get = function (url, cb, cbErr)
    {
        request("GET", url, {}, cb, cbErr);
    };

    this.post = function (url, data, cb, cbErr)
    {
        request("POST", url, data, cb, cbErr);
    };

    this.delete = function (url, data, cb, cbErr)
    {
        request("DELETE", url, data, cb, cbErr);
    };

    this.put = function (url, data, cb, cbErr)
    {
        request("PUT", url, data, cb, cbErr);
    };


    let lastErrorReport = 0;
    this.sendErrorReport = function (err)
    {
        err = err || CABLES.lastError;
        const report = {};
        report.time = Date.now();

        lastErrorReport = Date.now();
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
            html += "<img src=\"/img/bug.gif\"/><br/><br/>";
            html += "<h2>thank you</h2>";
            html += "we will look into it<br/>";
            html += "<br/>";
            html += "&nbsp;&nbsp;<a class=\"greybutton\" onclick=\"CABLES.UI.MODAL.hide()\">&nbsp;&nbsp;&nbsp;ok&nbsp;&nbsp;&nbsp;</a>";
            html += "</center>";

            CABLES.UI.MODAL.show(html, { "title": "" });
            CABLES.lastError = null;
        });
    };
};

if (!CABLES.api) CABLES.api = new CABLES.API();
