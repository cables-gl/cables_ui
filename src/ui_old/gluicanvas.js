CABLES = CABLES || {};
CABLES.GLGUI = CABLES.GLGUI || {};

CABLES.GLGUI.GlGuiFull = function (tabs)
{
    const views = document.getElementById("patchviews");
    const ele = document.createElement("div");

    views.appendChild(ele);
    const id = "glpatch" + views.children.length;
    ele.id = id;
    ele.classList.add("glpatchcontainer");


    if (!CABLES.patch.cgl.gl)
    {
        console.log("yep,b0rken!!!!");
        return;
    }


    const a = new CABLES.GLGUI.GlUiCanvas(CABLES.patch, ele);

    gui.patchView.setPatchRenderer(id, a.glPatch);
    gui.patchView.switch(ele.id);

    a.parentResized();

    gui.on("setLayout", () =>
    {
        a.parentResized();
    });
};


CABLES.GLGUI.GlGuiTab = function (tabs)
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
