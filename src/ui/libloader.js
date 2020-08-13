CABLES.UI.loadedLibs = [];
class LibLoader
{
    constructor(libnames, cb)
    {
        this.libsToLoad = libnames.slice(0);
        this._cb = cb;
        if (libnames.length > 0)
        {
            gui.jobs().start({
                "id": "loadlibs",
                "title": "loading libs"
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
            gui.jobs().finish("loadlibs");
        }
    }

    loadLib(name)
    {
        if (CABLES.UI.loadedLibs.indexOf(name) === -1)
        {
            CABLES.onLoadedLib[name] = function (libName)
            {
                if (window.module) module = window.module; // electron module workaround/fix

                const i = this.libsToLoad.indexOf(libName);
                this.libsToLoad.splice(i, 1);
                console.log("finished loading lib: " + libName);
                CABLES.UI.loadedLibs.push(libName);
                this.checkAllLoaded();
            }.bind(this);


            if (typeof module === "object") { window.module = module; module = undefined; } // electron module workaround/fix


            const newscript = document.createElement("script");
            newscript.type = "text/javascript";
            newscript.async = true;
            newscript.src = CABLES.sandbox.getCablesUrl() + "/api/lib/" + name;
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

CABLES.onLoadedLib = {};

CABLES.loadedLib = function (name)
{
    if (CABLES.onLoadedLib[name])
    {
        CABLES.onLoadedLib[name](name);
    }
};

CABLES.LibLoader = LibLoader;
