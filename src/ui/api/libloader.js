const loadedLibs = [];
CABLES.onLoadedLib = {};


export default class LibLoader
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
        if (loadedLibs.indexOf(name) === -1)
        {
            CABLES.onLoadedLib[name] = CABLES.onLoadedLib[name] || [];

            let electronMod = null;

            CABLES.onLoadedLib[name].push({
                "executed": false,
                "cb": function (libName)
                {
                    if (window.module) electronMod = window.module; // electron module workaround/fix

                    const i = this.libsToLoad.indexOf(libName);
                    this.libsToLoad.splice(i, 1);
                    // console.log("finished loading lib: " + libName);
                    loadedLibs.push(libName);
                    this.checkAllLoaded();
                }.bind(this)
            });


            if (typeof electronMod === "object") { window.module = electronMod; electronMod = undefined; } // electron module workaround/fix

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
