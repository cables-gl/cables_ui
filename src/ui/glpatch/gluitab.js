
export default function GlGuiTab (tabs)
{
    this._tab = new CABLES.UI.Tab("GlGui", { "icon": "cube", "infotext": "tab_glgui" });
    tabs.addTab(this._tab, true);
    gui.maintabPanel.show();
    this._tab.contentEle.innerHTML = "";
    const a = new CABLES.GLGUI.GlUiCanvas(CABLES.patch, this._tab.contentEle);
    a.parentResized();

    this._tab.on("resize", () =>
    {
        a.parentResized();
    });
};
