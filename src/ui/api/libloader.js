import { Logger } from "cables-shared-client";

export default class LibLoader
{
    constructor(modules, cb, options = {})
    {
        this._log = new Logger("libloader");

        this.libsToLoad = modules.slice(0);
        this._cb = cb;
        this.id = options.id || "loadlibs";
        this.title = options.title || "loading libs";
        this.list = options.list || [];

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
        const libName = module.name;
        let libType = module.type;
        const moduleExport = module.export;
        if (this.list.indexOf(libName) === -1)
        {
            if (!loadjs.isDefined(libName))
            {
                let scriptSrc = "";
                if (module.src.startsWith("/assets"))
                {
                    if (gui && gui.corePatch() && gui.corePatch().config.prefixAssetPath)
                    {
                        scriptSrc = (gui.corePatch().config.prefixAssetPath + libName).replace("//", "/");
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

                if (libType === "module")
                {
                    import(/* webpackIgnore: true */scriptSrc).then((importedModule) =>
                    {
                        if (moduleExport)
                        {
                            if (window.hasOwnProperty(moduleExport))
                            {
                                this._log.warn("module with export `" + moduleExport + "` already loaded.");
                            }
                            else
                            {
                                window[moduleExport] = importedModule;
                            }
                        }
                        const i = this.libsToLoad.indexOf(libName);
                        this.libsToLoad.splice(i, 1);
                        this.list.push(libName);
                        this.checkAllLoaded();
                    }).catch((e) =>
                    {
                        const i = this.libsToLoad.indexOf(libName);
                        this.libsToLoad.splice(i, 1);
                        this.checkAllLoaded();
                        this._log.error(e);
                        if (gui) gui.emitEvent("libLoadError", libName);
                    });
                }
                else if (libType === "op")
                {
                    gui.serverOps.loadOpDependencies(module.src, () =>
                    {
                        const i = this.libsToLoad.indexOf(libName);
                        this.libsToLoad.splice(i, 1);
                        this.list.push(libName);
                        this.checkAllLoaded();
                    }, true);
                }
                else
                {
                    loadjs(scriptSrc, libName, {
                        "returnPromise": true,
                        "async": true,
                        "before": (path, scriptEl) =>
                        {
                            if (libType === "module") scriptEl.setAttribute("type", "module");
                        }
                    }).then(() =>
                    {
                        const i = this.libsToLoad.indexOf(libName);
                        this.libsToLoad.splice(i, 1);
                        this.list.push(libName);
                        this.checkAllLoaded();
                    }).catch((e) =>
                    {
                        const i = this.libsToLoad.indexOf(libName);
                        this.libsToLoad.splice(i, 1);
                        this.checkAllLoaded();
                        this._log.error(e);
                        if (gui) gui.emitEvent("libLoadError", libName);
                    });
                }
            }
        }
        else
        {
            const i = this.libsToLoad.indexOf(libName);
            this.libsToLoad.splice(i, 1);
            this.checkAllLoaded();
        }
    }
}
