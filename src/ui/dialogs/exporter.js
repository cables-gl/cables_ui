import { gui } from "../gui.js";
import { platform } from "../platform.js";
import { GuiText } from "../text.js";
import ModalDialog from "./modaldialog.js";

export default class Exporter
{
    #project;

    /**
     * @param {any} project
     */
    constructor(project)
    {
        this.#project = project;
    }

    show()
    {
        if (!gui.getSavedState())
        {
            new ModalDialog({ "html": GuiText.projectExportNotSaved, "warning": true, "title": "Export", "showOkButton": true });
            return;
        }

        const projectId = this.#project.shortId || this.#project._id;

        platform.exportPatch(projectId);
    }
}
