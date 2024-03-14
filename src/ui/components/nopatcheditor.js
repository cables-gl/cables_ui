import { Events } from "cables-shared-client";

export default class NoPatchEditor extends Events
{
    constructor(cgl)
    {
        super();
        gui.patchView.setPatchRenderer(null, this);
    }

    get name() { return "nopatch"; }

    setSize() {}

    setProject() {}

    clear() {}

    dispose() {}

    setCurrentSubPatch() {}

    getCurrentSubPatch() { return 0; }
}
