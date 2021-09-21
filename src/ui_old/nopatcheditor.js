CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.NoPatchEditor = class extends CABLES.EventTarget
{
    constructor(cgl)
    {
        super();
    }

    get name() { return "nopatch"; }
};
