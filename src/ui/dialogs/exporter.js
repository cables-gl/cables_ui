import { gui } from "../gui.js";
import { platform } from "../platform.js";
import { GuiText } from "../text.js";
import ModalDialog from "./modaldialog.js";

export default class Exporter
{
    #project;
    #exportType;

    /**
     * @param {any} project
     * @param {"html"|"patch"} [exportType] (used in electron)
     */
    constructor(project, exportType)
    {
        this.#project = project;
        this.#exportType = exportType;
    }

    show()
    {
        if (!gui.getSavedState())
        {
            new ModalDialog({ "html": GuiText.projectExportNotSaved, "warning": true, "title": "Export", "showOkButton": true });
            return;
        }

        const projectId = this.#project.shortId || this.#project._id;

        platform.exportPatch(projectId, this.#exportType);
    }
}
