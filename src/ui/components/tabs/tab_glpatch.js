import Tab from "../../elements/tabpanel/tab.js";
import GlUiCanvas from "../../glpatch/gluicanvas.js";

export default class GlGuiTab
{
    constructor(tabs)
    {
        this._tab = new Tab("GlGui", { "icon": "cube", "infotext": "tab_glgui" });
        tabs.addTab(this._tab, true);
        gui.maintabPanel.show();
        this._tab.contentEle.innerHTML = "";
        const a = new GlUiCanvas(CABLES.patch, this._tab.contentEle);
        a.parentResized();

        this._tab.on("resize", () =>
        {
            a.parentResized();
        });
    }
}
