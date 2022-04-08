
export default function GlGuiFull()
{
    const views = document.getElementById("patchviews");
    const ele = document.createElement("div");

    views.appendChild(ele);
    const id = "glpatch" + views.children.length;
    ele.id = id;
    ele.classList.add("glpatchcontainer");

    if (!CABLES.patch.cgl.gl)
    {
        console.log("webgl not available! :/");
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
}
