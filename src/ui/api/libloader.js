import { Logger } from "cables-shared-client";
import { gui } from "../gui.js";

export default class LibLoader
{
    constructor(dependencies, cb, options = {})
    {
        this._log = new Logger("libloader");

        this._libsToLoad = dependencies.slice(0);
        this._cb = cb;
        this.id = options.id || "loadlibs";
        this.title = options.title || "loading libs";
        this._list = options.list || [];

        if (dependencies.length > 0)
        {
            gui.jobs().start({
                "id": this.id,
                "title": this.title
            });

            for (const i in dependencies)
            {
                this.loadLib(dependencies[i]);
            }
        }
        else
        {
            if (this._cb) this._cb();
        }
    }

    checkAllLoaded()
    {
        if (this._libsToLoad.length === 0)
        {
            if (this._cb) this._cb();
            gui.jobs().finish(this.id);
        }
    }

    loadLib(module)
    {
        const libName = module.src;
        let libType = module.type;
        const moduleExport = module.export;

        // loading npms is done by electron
        const doLoadLib = libType !== "npm" && !this._list.includes(libName);
        if (doLoadLib)
        {
            if (!loadjs.isDefined(libName))
            {
                let scriptSrc = "";

                // backwards compatibility...
                if (Array.isArray(module.src)) module.src = module.src[0] || "";

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
                    scriptSrc = CABLES.platform.getSandboxUrl() + "/api/oplib/" + module.op + module.src.replace(".", "");
                }
                else
                {
                    const basePath = module.type === "corelib" ? "/api/corelib/" : "/api/lib/";
                    scriptSrc = CABLES.platform.getSandboxUrl() + basePath + module.src;
                }

                if (libType === "module")
                {
                    import(/* webpackIgnore: true */scriptSrc).then((importedModule) =>
                    {
                        if (moduleExport)
                        {
                            if (!window.hasOwnProperty(moduleExport))
                            {
                                window[moduleExport] = importedModule;
                            }
                        }
                        const i = this._libsToLoad.indexOf(libName);
                        this._libsToLoad.splice(i, 1);
                        this._list.push(libName);
                        this.checkAllLoaded();
                    }).catch((e) =>
                    {
                        const i = this._libsToLoad.indexOf(libName);
                        this._libsToLoad.splice(i, 1);
                        this.checkAllLoaded();
                        this._log.error(e);
                        if (gui) gui.emitEvent("libLoadError", libName);
                    });
                }
                else if (libType === "op")
                {
                    gui.serverOps.loadOpDependencies(module.src, () =>
                    {
                        const i = this._libsToLoad.indexOf(libName);
                        this._libsToLoad.splice(i, 1);
                        this._list.push(libName);
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
                        const i = this._libsToLoad.indexOf(libName);
                        this._libsToLoad.splice(i, 1);
                        this._list.push(libName);
                        this.checkAllLoaded();
                    }).catch((e) =>
                    {
                        const i = this._libsToLoad.indexOf(libName);
                        this._libsToLoad.splice(i, 1);
                        this.checkAllLoaded();
                        this._log.error(e);
                        if (gui) gui.emitEvent("libLoadError", libName);
                    });
                }
            }
            else
            {
                const i = this._libsToLoad.indexOf(libName);
                this._libsToLoad.splice(i, 1);
                this._list.push(libName);
                this.checkAllLoaded();
            }
        }
        else
        {
            const i = this._libsToLoad.indexOf(libName);
            this._libsToLoad.splice(i, 1);
            this.checkAllLoaded();
        }
    }
}
