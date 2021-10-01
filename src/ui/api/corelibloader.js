CABLES.UI.loadedCoreLibs = [];
CABLES.onLoadedCoreLib = {};

export default class CoreLibLoader
{
    constructor(libnames, cb)
    {
        this.libsToLoad = libnames.slice(0);
        this._cb = cb;
        if (libnames.length > 0)
        {
            gui.jobs().start({
                "id": "loadcorelibs",
                "title": "loading core libs"
            });
            for (const i in libnames)
            {
                this.loadLib(libnames[i]);
            }
        }
        else
        {
            this._cb();
        }
    }

    checkAllLoaded()
    {
        if (this.libsToLoad.length == 0)
        {
            if (this._cb) this._cb();
            gui.jobs().finish("loadcorelibs");
        }
    }

    loadLib(name)
    {
        if (CABLES.UI.loadedCoreLibs.indexOf(name) === -1)
        {
            CABLES.onLoadedCoreLib[name] = function (libName)
            {
                const i = this.libsToLoad.indexOf(libName);
                this.libsToLoad.splice(i, 1);
                // console.log("finished loading core lib: " + libName);
                CABLES.UI.loadedCoreLibs.push(libName);
                this.checkAllLoaded();
            }.bind(this);

            const newscript = document.createElement("script");
            newscript.type = "text/javascript";
            newscript.async = true;
            newscript.src = CABLES.sandbox.getCablesUrl() + "/api/corelib/" + name;
            (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(newscript);
        }
        else
        {
            const i = this.libsToLoad.indexOf(name);
            this.libsToLoad.splice(i, 1);
            this.checkAllLoaded();
        }
    }
}


CABLES.loadedCoreLib = function (name) // this will be called from loaded lib files (api inject the call into js files...)
{
    if (CABLES.onLoadedCoreLib[name]) CABLES.onLoadedCoreLib[name](name);
};
