import { Logger } from "cables-shared-client";
import { gui } from "../gui.js";
import { platform } from "../platform.js";

/**
 * Handlebars template helper functions
 */
const handleBarsPrecompiled = {};

const log = new Logger("handlebarsjs");

export function handleBarPrecompiled(name)
{
    let template = handleBarsPrecompiled[name];
    if (template) return template;

    const source = document.getElementById(name).innerHTML;
    if (!source)
    {
        log.warn("template not found", "template " + name + " not found...");
        return;
    }
    const p = handleBarsPrecompiled[name] = Handlebars.compile(source);
    return p;
}

export function getHandleBarHtml(name, obj)
{
    let perf;
    if (window.gui) perf = gui.uiProfiler.start("getHandleBarHtml");

    const template = handleBarPrecompiled(name);

    obj = obj || {};
    obj.frontendOptions = platform.frontendOptions;
    obj.cablesUrl = platform.getCablesUrl();
    obj.cablesDocsUrl = obj.cablesUrl;
    if (platform.getCablesDocsUrl)obj.cablesDocsUrl = platform.getCablesDocsUrl();

    const html = template(obj, { "allowProtoMethodsByDefault": true, "allowProtoPropertiesByDefault": true });

    if (perf)perf.finish();

    return html;
}
