/**
 * Handlebars template helper functions
 */
const handleBarsPrecompiled = {};

export function handleBarPrecompiled(name)
{
    let template = handleBarsPrecompiled[name];
    if (template) return template;

    const source = document.getElementById(name).innerHTML;
    if (!source)
    {
        console.warn("template not found", "template " + name + " not found...");
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
    obj.frontendOptions = CABLES.platform.frontendOptions;
    obj.cablesUrl = CABLES.platform.getCablesUrl();
    obj.cablesDocsUrl = obj.cablesUrl;
    if (CABLES.platform.getCablesDocsUrl)obj.cablesDocsUrl = CABLES.platform.getCablesDocsUrl();

    const html = template(obj, { "allowProtoMethodsByDefault": true, "allowProtoPropertiesByDefault": true });

    if (perf)perf.finish();

    return html;
}
