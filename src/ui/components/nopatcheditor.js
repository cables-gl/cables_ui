export default class NoPatchEditor extends CABLES.EventTarget
{
    constructor(cgl)
    {
        super();
    }

    get name() { return "nopatch"; }
}
