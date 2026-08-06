import { Events, Logger, ele, TalkerAPI } from "cables-shared-client";
import Tab from "../../elements/tabpanel/tab.js";
import { GuiText } from "../../text.js";
import ManageOp from "./tab_manage_op.js";
import { notify, notifyError } from "../../elements/notification.js";
import { gui } from "../../gui.js";
import { platform } from "../../platform.js";
import { contextMenu } from "../../elements/contextmenu.js";
import { userSettings } from "../usersettings.js";

/**
 * editor base class...
 */

export default class EditorBase extends Events
{
    tab = null;

    /**
     * @param {import("../editor.js").EditorOptions} options
     */
    constructor(options)
    {
        super();

        this._options = options;
        this.options = options;
        this._log = new Logger("EditorBase");
    }

    getDiagHtmlOuter()
    {

        return "<div class=\"editorDiag\" id=\"editordiag" + this.tab.id + "\"></div>";
    }

    /**
     * @param {import("../../api/opsserver.js").LinterDiag[]} arr
     */
    setDiags(arr = [])
    {
        const eleDiagId = "editordiag" + this.tab.id;
        this.eleDiag = ele.byId(eleDiagId);
        if (!this.eleDiag) return console.warn("editor diagnose panel not found");
        this.eleDiag.innerHTML = "";

        let diags = "";
        let height = "0px";
        if (arr.length > 0) height = "100px";

        const r = document.querySelector(":root");
        this.eleDiag.parentElement.style.setProperty("--editorDiagHeight", height);

        for (let i = 0; i < arr.length; i++)
        {
            const d = arr[i];
            const diagLine = document.createElement("div");
            let classname = "diagSeverity" + d.severity;
            if (d.fatal)classname = "diagSeverityFatal";
            diagLine.dataset.line = String(d.line);
            diagLine.dataset.col = String(d.column);
            diagLine.innerHTML = d.message;
            diagLine.classList.add(classname);

            if (d.line != -1)
                diagLine.addEventListener("click", () =>
                {
                    this.gotoLine(d.line);
                    this.focus();
                });

            this.eleDiag.appendChild(diagLine);
        }
    }

    /**
     * @param {number} line
     */
    gotoLine(line)
    {
        throw new Error("gotoline method not implemented.");
    }

    focus()
    {

    }

}
