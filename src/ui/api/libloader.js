import { Logger } from "cables-shared-client";
import { gui } from "../gui.js";
import { platform } from "../platform.js";

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
        this._loadJsLibs = [];

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
            if (this._loadJsLibs.length > 0)
            {
                const scriptSources = [];
                this._loadJsLibs.forEach((script) =>
                {
                    if (script.libType === "module")
                    {
                        script.scriptSrc = "module!" + script.scriptSrc;
                    }
                    scriptSources.push(script.scriptSrc);
                });
                console.log("SSS", scriptSources);
                loadjs(scriptSources, {
                    "returnPromise": true,
                    "async": false
                }).then(() =>
                {
                    this._loadJsLibs.forEach((script) =>
                    {
                        loadjs.done(script.libName);
                        const i = this._libsToLoad.indexOf(script.libName);
                        this._libsToLoad.splice(i, 1);
                        this._list.push(script.libName);
                    });
                    this.checkAllLoaded();
                }).catch((pathsNotFound) =>
                {
                    this._loadJsLibs.forEach((script) =>
                    {
                        const i = this._libsToLoad.indexOf(script.libName);
                        this._libsToLoad.splice(i, 1);
                    });
                    this.checkAllLoaded();
                    if (pathsNotFound)
                    {
                        pathsNotFound.forEach((pathNotFound) =>
                        {
                            const failedScript = this._loadJsLibs.find((script) => { return script.scriptSrc.includes(pathNotFound); });
                            this._log.error(failedScript.scriptSrc);
                            if (gui) gui.emitEvent("libLoadError", failedScript.libName);
                        });
                    }
                });
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
            let scriptSrc = "";

            // backwards compatibility...
            if (Array.isArray(module.src)) module.src = module.src[0] || "";

            if (!module || !module.src || !module.type)
            {
                const i = this._libsToLoad.indexOf(libName);
                this._libsToLoad.splice(i, 1);
                this.checkAllLoaded();
                if (gui) gui.emitEvent("libLoadError", libName);
                return;
            }

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
                scriptSrc = platform.getSandboxUrl() + "/api/oplib/" + module.op + module.src.replace(".", "");
            }
            else
            {
                const basePath = module.type === "corelib" ? "/api/corelib/" : "/api/lib/";
                scriptSrc = platform.getSandboxUrl() + basePath + module.src;
            }

            if (!this.isDefined(libName, scriptSrc))
            {
                if (libType === "module")
                {
                    import(/* webpackIgnore: true */scriptSrc).then((importedModule) =>
                    {
                        if (moduleExport)
                        {
                            if (!window.hasOwnProperty(moduleExport))
                                window[moduleExport] = importedModule;
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
                    // store all other libraries to fetch them in bulk but proper order in loadjs
                    this._loadJsLibs.push({
                        "scriptSrc": scriptSrc,
                        "libName": libName,
                        "libType": libType
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

    isDefined(libName, src)
    {
        return loadjs.isDefined(libName) || Boolean(document.querySelector("script[src=\"" + src + "\"]"));
    }
}
