const loadedLibs = [];
CABLES.onLoadedLib = {};

export default class LibLoader
{
    constructor(libnames, cb, options = {})
    {
        this.libsToLoad = libnames.slice(0);
        this._cb = cb;
        this.id = options.id || "loadlibs";
        this.title = options.title || "loading libs";
        this.list = options.list || loadedLibs;
        this.callbacks = options.callbacks || CABLES.onLoadedLib;
        this.basePath = options.basePath || CABLES.sandbox.getCablesUrl() + "/api/lib/";

        if (libnames.length > 0)
        {
            gui.jobs().start({
                "id": this.id,
                "title": this.title
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
        if (this.libsToLoad.length === 0)
        {
            if (this._cb) this._cb();
            gui.jobs().finish(this.id);
        }
    }

    getCacheBusterNumber()
    {
        let timestamp = Date.now();
        if (CABLESUILOADER.buildInfo && CABLESUILOADER.buildInfo.api && CABLESUILOADER.buildInfo.api.timestamp)
        {
            timestamp = CABLESUILOADER.buildInfo.api.timestamp;
        }
        return timestamp;
    }

    loadLib(name)
    {
        if (this.list.indexOf(name) === -1)
        {
            this.callbacks[name] = this.callbacks[name] || [];

            this.callbacks[name].push({
                "executed": false,
                "cb": (libName) =>
                {
                    const i = this.libsToLoad.indexOf(libName);
                    this.libsToLoad.splice(i, 1);
                    this.list.push(libName);
                    this.checkAllLoaded();
                }
            }
            );

            const elRef = this.id + "_" + name;
            if (!document.querySelector("[data-libname=\"" + elRef + "\"]"))
            {
                const newScript = document.createElement("script");
                newScript.dataset.libname = elRef;
                newScript.type = "text/javascript";
                newScript.async = true;
                if (name.startsWith("/assets"))
                {
                    newScript.src = name + "?nc=" + this.getCacheBusterNumber();
                    newScript.onload = () =>
                    {
                        CABLES.loadedLib(name);
                    };
                }
                else
                {
                    newScript.src = this.basePath + name + "?nc=" + this.getCacheBusterNumber();
                }
                newScript.onerror = () =>
                {
                    const i = this.libsToLoad.indexOf(name);
                    this.libsToLoad.splice(i, 1);
                    this.checkAllLoaded();
                    if (gui) gui.emitEvent("libLoadError", name);
                };
                (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(newScript);
            }
        }
        else
        {
            const i = this.libsToLoad.indexOf(name);
            this.libsToLoad.splice(i, 1);
            this.checkAllLoaded();
        }
    }
}

// this will be called from loaded lib files (api inject the call into js files...)
CABLES.loadedLib = function (name)
{
    if (CABLES.onLoadedLib[name])
    {
        for (let i = 0; i < CABLES.onLoadedLib[name].length; i++)
        {
            if (!CABLES.onLoadedLib[name][i].executed)
            {
                CABLES.onLoadedLib[name][i].cb(name);
                CABLES.onLoadedLib[name][i].executed = true;
            }
        }
    }
};
