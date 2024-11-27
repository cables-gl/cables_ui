import LibLoader from "./libloader.js";

CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};
CABLES.UI.loadedCoreLibs = [];

export default class CoreLibLoader extends LibLoader
{
    constructor(modules, cb)
    {
        console.log("CoreLibLoader", modules);
        super(modules, cb, {
            "id": "loadcorelibs",
            "title": "loading core libs",
            "list": CABLES.UI.loadedCoreLibs,
            "basePath": CABLES.platform.getCablesUrl() + "/api/corelib/"
        });
    }
}
