import LibLoader from "./libloader";

CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.loadedCoreLibs = [];
CABLES.onLoadedCoreLib = {};

export default class CoreLibLoader extends LibLoader
{
    constructor(libnames, cb)
    {
        super(libnames, cb, {
            "id": "loadcorelibs",
            "title": "loading core libs",
            "list": CABLES.UI.loadedCoreLibs,
            "callbacks": CABLES.onLoadedCoreLib,
            "globalCallback": CABLES.loadedCoreLib,
            "basePath": CABLES.sandbox.getCablesUrl() + "/api/corelib/"
        });
    }

    getCacheBusterNumber()
    {
        let timestamp = Date.now();
        if (CABLESUILOADER.buildInfo && CABLESUILOADER.buildInfo.core && CABLESUILOADER.buildInfo.core.timestamp)
        {
            timestamp = CABLESUILOADER.buildInfo.core.timestamp;
        }
        return timestamp;
    }
}

// this will be called from loaded lib files (api inject the call into js files...)
CABLES.loadedCoreLib = function (name)
{
    if (CABLES.onLoadedCoreLib[name])
    {
        for (let i = 0; i < CABLES.onLoadedCoreLib[name].length; i++)
        {
            if (!CABLES.onLoadedCoreLib[name][i].executed)
            {
                CABLES.onLoadedCoreLib[name][i].cb(name);
                CABLES.onLoadedCoreLib[name][i].executed = true;
            }
        }
    }
};
