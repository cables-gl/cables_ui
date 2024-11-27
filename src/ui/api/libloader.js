import { Logger } from "cables-shared-client";

const loadedLibs = [];

export default class LibLoader
{
    constructor(modules, cb, options = {})
    {
        this._log = new Logger("libloader");

        this.libsToLoad = modules.slice(0);
        this._cb = cb;
        this.id = options.id || "loadlibs";
        this.title = options.title || "loading libs";
        this.list = options.list || loadedLibs;

        if (modules.length > 0)
        {
            gui.jobs().start({
                "id": this.id,
                "title": this.title
            });

            for (const i in modules)
            {
                this.loadLib(modules[i]);
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

    loadLib(module)
    {
        const name = module.name;
        let type = module.type;
        if (this.list.indexOf(name) === -1)
        {
            if (!loadjs.isDefined(name))
            {
                let scriptSrc = "";
                if (module.src.startsWith("/assets"))
                {
                    if (gui && gui.corePatch() && gui.corePatch().config.prefixAssetPath)
                    {
                        scriptSrc = (gui.corePatch().config.prefixAssetPath + name).replace("//", "/");
                    }
                    else
                    {
                        scriptSrc += module.src;
                    }
                }
                else if (module.src.startsWith("http"))
                {
                    scriptSrc = module.src;
                }
                else if (module.src.startsWith("./"))
                {
                    scriptSrc = "/api/oplib/" + module.op + module.src;
                }
                else
                {
                    const basePath = module.type === "corelib" ? "/api/corelib/" : "/api/lib/";
                    scriptSrc = basePath + module.src;
                }

                if (type === "module")
                {
                    import(/* webpackIgnore: true */scriptSrc).then((importedModule) =>
                    {
                        if (!window.hasOwnProperty(name)) window[name] = importedModule;
                        const i = this.libsToLoad.indexOf(name);
                        this.libsToLoad.splice(i, 1);
                        this.list.push(name);
                        this.checkAllLoaded();
                    }).catch((e) =>
                    {
                        const i = this.libsToLoad.indexOf(name);
                        this.libsToLoad.splice(i, 1);
                        this.checkAllLoaded();
                        this._log.error(e);
                        if (gui) gui.emitEvent("libLoadError", name);
                    });
                }
                else
                {
                    loadjs(scriptSrc, name, {
                        "returnPromise": true,
                        "async": true,
                        "before": (path, scriptEl) =>
                        {
                            if (type === "module") scriptEl.setAttribute("type", "module");
                            // scriptEl.setAttribute("crossorigin", "use-credentials");
                        }
                    }).then(() =>
                    {
                        const i = this.libsToLoad.indexOf(name);
                        this.libsToLoad.splice(i, 1);
                        this.list.push(name);
                        this.checkAllLoaded();
                    }).catch((e) =>
                    {
                        const i = this.libsToLoad.indexOf(name);
                        this.libsToLoad.splice(i, 1);
                        this.checkAllLoaded();
                        this._log.error(e);
                        if (gui) gui.emitEvent("libLoadError", name);
                    });
                }
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
