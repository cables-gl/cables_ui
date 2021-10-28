import LibLoader from "./libloader";

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
