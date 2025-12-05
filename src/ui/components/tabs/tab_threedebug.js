import { ele, Events } from "cables-shared-client";
import { utils } from "cables";
import { gui } from "../../gui.js";
import { editorSession } from "../../elements/tabpanel/editor_session.js";

/**
 * debug: showing uiattribs of currently selected op
 */
export default class TabThreeDebug extends Events
{
    static TABSESSION_NAME = "tagthreedebug";
    #tab;
    #op = null;
    #tabs;

    constructor(tabs)
    {
        super();
        this.#tabs = tabs;
        this.#tab = new CABLES.UI.Tab("threeDebug", { "icon": "op", "infotext": "tab_threedebug", "padding": true, "singleton": "true", });
        this.#tabs.addTab(this.#tab, true);

        this.#op = null;
        this.rebuildHtml();
        editorSession.rememberOpenEditor(TabThreeDebug.TABSESSION_NAME, "threedebug", { }, true);

        this.#tab.on("close", () =>
        {
            editorSession.remove(TabThreeDebug.TABSESSION_NAME, "threedebug");
        });

        gui.opParams.on("opSelected", () =>
        {
            this.setOp(gui.opParams.op);
        });
        this.setOp(gui.opParams.op);
    }

    /**
     * @param {Op} op
     */
    setOp(op)
    {
        if (this.#op == op) return;

        if (op && op.threeOp) this.#op = op;

        this.rebuildHtml();
    }

    generateSceneStructureHTML(scene, parentName = "Scene")
    {
        let html = "<ul style=\"font-family: monospace; margin: 10px 0;\">";

        const traverse = (node, path = "") =>
        {
            const isMesh = node.isMesh;
            const isGroup = node.isGroup;
            const isObject3D = node.isObject3D;
            const isCamera = node.isCamera;
            const isLight = node.isLight || node.isDirectionalLight || node.isPointLight || node.isSpotLight;
            const isScene = node.isScene;

            let typeLabel = "Object3D";
            if (isScene) typeLabel = "Scene";
            else if (isMesh) typeLabel = "Mesh";
            else if (isGroup) typeLabel = "Group";
            else if (isCamera) typeLabel = "Camera";
            else if (isLight) typeLabel = "Light";

            const position = node.position;
            const currentPath = node.name || typeLabel;

            html += "<li>";

            if (node.userData.op == this.#op.id)html += "--\> ";
            html += `<strong >${currentPath}</strong> <span>(${typeLabel})</span>`;

            if (node.userData.op)
                html += "<a class=\"button-small\" onclick=\"gui.patchView.unselectAllOps();gui.patchView.selectOpId('" + node.userData.op + "');gui.opParams.show('" + node.userData.op + "');gui.patchView.centerSelectOp('" + node.userData.op + "');\">op</a>";

            if (node.children && node.children.length > 0)
            {
                html += "<ul>";
                node.children.forEach((child, index) =>
                {
                    traverse(child, currentPath);
                });
                html += "</ul>";
            }

            html += "</li>";
        };

        traverse(scene);
        html += "</ul>";

        return html;
    }

    rebuildHtml()
    {
        if (this.#op && this.#op.threeOp && this.#op.threeOp.renderer)
        {
            const html = this.generateSceneStructureHTML(this.#op.threeOp.renderer.scene);

            this.#tab.html(html);
        }
        else
        {
            this.#tab.html("please select any three op");
        }
    }
}

editorSession.addListener(TabThreeDebug.TABSESSION_NAME, (id, data) =>
{
    new TabThreeDebug(gui.mainTabs);
});
