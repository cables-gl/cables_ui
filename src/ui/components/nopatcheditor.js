import { Events } from "cables-shared-client";
import { gui } from "../gui.js";

export default class NoPatchEditor extends Events
{
    constructor(cgl)
    {
        super();
        gui.patchView.setPatchRenderer(null, this);
    }

    get name() { return "nopatch"; }

    isDraggingPort() { return false; }

    setSize() {}

    setProject() {}

    clear() {}

    dispose() {}

    focus() {}

    setCurrentSubPatch() {}

    getCurrentSubPatch() { return 0; }
}
