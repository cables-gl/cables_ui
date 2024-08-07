/**
 * Handlebars template helper functions
 */
const handleBarsPrecompiled = {};

export function getHandleBarHtml(name, obj)
{
    const perf = CABLES.UI.uiProfiler.start("getHandleBarHtml");

    let template = handleBarsPrecompiled[name];
    if (!template && document.getElementById(name))
    {
        const source = document.getElementById(name).innerHTML;
        if (!source)
        {
            console.warn("template not found", "template " + name + " not found...");
            return;
        }
        template = handleBarsPrecompiled[name] = Handlebars.compile(source);
    }

    obj = obj || {};

    obj.frontendOptions = CABLES.platform.frontendOptions;
    obj.cablesUrl = CABLES.platform.getCablesUrl();
    obj.cablesDocsUrl = obj.cablesUrl;
    if (CABLES.platform.getCablesDocsUrl)obj.cablesDocsUrl = CABLES.platform.getCablesDocsUrl();

    const html = template(obj);
    perf.finish();

    return html;
}
