import { Logger } from "cables-shared-client";
import { gui } from "../gui.js";
import { platform } from "../platform.js";

/**
 * @typedef {import("cables-shared-client").OpDependency} OpDependency
 */

export default class LibLoader
{
    constructor()
    {
        this._log = new Logger("libloader");
        this.id = "loadlibs";
        this.title = "loading libs";

        /**
         * @type {Object<string, Promise<boolean>>}
         */
        this._libStates = {};

        /**
         * @type {Object<string, Promise<void>>}
         */
        this._libQueued = {};
        this._running = 0;
    }

    /**
     * @param {OpDependency[]} dependencies
     * @param {Function} [cb]
     */
    loadLibs(dependencies, cb = null)
    {
        if (!dependencies || dependencies.length === 0)
        {
            if (cb) cb();
            return;
        }

        if (this._running === 0)
        {
            gui.jobs().start({
                "id": this.id,
                "title": this.title
            });
        }
        this._running++;

        const jsBatch = [];
        const waitFor = [];
        const pending = [];

        for (const i in dependencies)
        {
            pending.push(this._loadLib(dependencies[i], jsBatch, waitFor));
        }

        if (jsBatch.length > 0) this._loadJsBatch(jsBatch, waitFor);

        const finish = () =>
        {
            if (cb) cb();
            this._running--;
            if (this._running === 0) gui.jobs().finish(this.id);
        };

        Promise.allSettled(pending).then(finish);
    }

    /**
     * @param {OpDependency} module
     * @param {Array} jsBatch
     * @param {Array<Promise<boolean|void>>} waitFor
     * @returns {Promise<boolean>}
     */
    _loadLib(module, jsBatch, waitFor)
    {
        // backwards compatibility...
        if (module && Array.isArray(module.src)) module.src = module.src[0] || "";

        const libName = module ? module.src : undefined;

        // loading npms is done by electron
        if (module && module.type === "npm") return Promise.resolve(true);

        if (!module || !module.src || !module.type)
        {
            if (gui) gui.emitEvent("libLoadError", libName);
            return Promise.resolve(false);
        }

        if (this._libStates.hasOwnProperty(libName))
        {
            const state = this._libStates[libName];
            // loaded or another call is loading this lib right now, wait for it instead of assuming it is there
            if (this._libQueued.hasOwnProperty(libName)) waitFor.push(this._libQueued[libName]);
            else waitFor.push(state);
            return state;
        }

        const scriptSrc = this._getScriptSrc(module);

        if (this.isDefined(libName, scriptSrc, module.export))
        {
            const loaded = Promise.resolve(true);
            this._libStates[libName] = loaded;
            return loaded;
        }

        let promise = null;
        if (module.type === "module")
        {
            // do not minify this in webpack export
            promise = import(/* webpackIgnore: true */scriptSrc).then((importedModule) =>
            {
                if (module.export)
                {
                    if (!window.hasOwnProperty(module.export)) window[module.export] = importedModule;
                }
                return true;
            }).catch((e) =>
            {
                this._log.error(e);
                if (gui) gui.emitEvent("libLoadError", libName);
                return false;
            });
        }
        else if (module.type === "op")
        {
            promise = new Promise((resolve) =>
            {
                gui.serverOps.loadOpDependencies(module.src, () => { resolve(true); });
            });
        }
        else
        {
            // store all other libraries to fetch them in bulk but proper order in loadjs
            let queued = null;
            this._libQueued[libName] = new Promise((resolve) => { queued = resolve; });
            promise = new Promise((resolve) =>
            {
                jsBatch.push({
                    "scriptSrc": scriptSrc,
                    "libName": libName,
                    "resolve": resolve,
                    "queued": queued
                });
            });
        }

        promise = promise.then((success) =>
        {
            delete this._libQueued[libName];
            if (!success) delete this._libStates[libName]; // allow a later retry
            return success;
        });

        this._libStates[libName] = promise;
        return promise;
    }

    /**
     * @param {Array} jsBatch
     * @param {Array<Promise<boolean|void>>} waitFor
     */
    _loadJsBatch(jsBatch, waitFor)
    {
        // wait until libs this batch depends on are loaded
        Promise.allSettled(waitFor).then(() =>
        {
            loadjs(jsBatch.map((script) => { return script.scriptSrc; }), {
                "async": false,
                "before": (path, scriptEl) =>
                {
                    // resolve every lib on its own, so ops only wait for the libs they need
                    const script = jsBatch.find((s) => { return s.scriptSrc === path; });
                    if (!script) return;

                    scriptEl.addEventListener("load", () =>
                    {
                        loadjs.done(script.libName);
                        script.resolve(true);
                    });
                    scriptEl.addEventListener("error", () =>
                    {
                        this._log.error(script.scriptSrc);
                        // loadjs leaves failed script tags in the dom, remove them
                        scriptEl.remove();
                        if (gui) gui.emitEvent("libLoadError", script.libName);
                        script.resolve(false);
                    });
                },
                "error": (pathsNotFound) =>
                {
                    // fallback for scripts that never fired load/error
                    jsBatch.forEach((script) => { script.resolve(!pathsNotFound.includes(script.scriptSrc)); });
                }
            });

            // script tags are in the dom now
            jsBatch.forEach((script) => { script.queued(); });
        });
    }

    /**
     * @param {OpDependency} module
     */
    _getScriptSrc(module)
    {
        if (module.src.startsWith("/assets"))
        {
            if (gui && gui.corePatch() && gui.corePatch().config.prefixAssetPath)
            {
                return (gui.corePatch().config.prefixAssetPath + module.src).replace("//", "/");
            }
            return module.src;
        }
        else if (module.src.startsWith("http"))
        {
            return module.src;
        }
        else if (module.src.startsWith("./"))
        {
            return platform.getSandboxUrl() + "/api/oplib/" + module.op + module.src.replace(".", "");
        }
        else if (module.type === "corelib")
        {
            return platform.getSandboxUrl() + "/api/corelib/" + module.src + ".js";
        }
        return platform.getSandboxUrl() + "/api/lib/" + module.src;
    }

    /**
     * only reached for libs not tracked in _libStates, e.g. script tags added in export header
     *
     * @param {String} libName
     * @param {String} src
     * @param {String} [moduleExport]
     * @returns {Boolean}
     */
    isDefined(libName, src, moduleExport = null)
    {
        return loadjs.isDefined(libName) || Boolean(document.querySelector("script[src=\"" + src + "\"]")) || moduleExport && window.hasOwnProperty(moduleExport);
    }
}
