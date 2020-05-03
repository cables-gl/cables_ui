CABLES.UI.loadedLibs = [];
CABLES.libLoader = function (libnames, cb)
{
    this.libsToLoad = libnames;
    this._cb = cb;

    gui.jobs().start({
        "id": "loadlibs",
        "title": "loading libs"
    });

    for (const i in libnames)
        this.loadLib(libnames[i]);
};

CABLES.libLoader.prototype.checkAllLoaded = function (name)
{
    if (this.libsToLoad.length == 0)
    {
        if (this._cb) this._cb();
        gui.jobs().finish("loadlibs");
    }
};

CABLES.libLoader.prototype.loadLib = function (name)
{
    if (CABLES.UI.loadedLibs.indexOf(name) > -1)
    {
        const i = this.libsToLoad.indexOf(name);
        this.libsToLoad.splice(i, 1);
        this.checkAllLoaded();
        return;
    }

    CABLES.onLoadedLib[name] = function (name)
    {
        const i = this.libsToLoad.indexOf(name);
        this.libsToLoad.splice(i, 1);
        console.log("finished loading lib: " + name);
        CABLES.UI.loadedLibs.push(name);
        this.checkAllLoaded();
    }.bind(this);

    const newscript = document.createElement("script");
    newscript.type = "text/javascript";
    newscript.async = true;
    newscript.src = CABLES.sandbox.getCablesUrl() + "/api/lib/" + name;
    (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(newscript);
};

CABLES.onLoadedLib = {};

CABLES.loadedLib = function (name)
{
    if (CABLES.onLoadedLib[name])
    {
        CABLES.onLoadedLib[name](name);
    }
};
