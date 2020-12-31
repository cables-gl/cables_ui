CABLES = CABLES || {};
CABLES.GLGUI = CABLES.GLGUI || {};

CABLES.GLGUI.SnapLines = class extends CABLES.EventTarget
{
    constructor(cgl, glPatch, instancer)
    {
        super();

        this._glPatch = glPatch;
        this._xCoords = [];
        this._instancer = instancer;

        this._rects = [];
        this._root = new CABLES.GLGUI.GlRect(this._instancer, { "interactive": false });
        this._root.setSize(1, 1);
    }

    update()
    {
        const hashmap = {};
        const ops = gui.corePatch().ops;

        const sops = gui.patchView.getSelectedOps();
        let sop = null;
        if (sops.length == 1)
        {
            sop = sops[0];
        }


        for (let i = 0; i < ops.length; i++)
        {
            if (sop != ops[i])
                hashmap[ops[i].uiAttribs.translate.x] = ops[i].uiAttribs.translate.x;
        }

        const coords = Object.values(hashmap);


        for (let i = 0; i < coords.length; i++)
        {
            if (!this._rects[i])
            {
                this._rects[i] = new CABLES.GLGUI.GlRect(this._instancer, { "parent": this._root, "interactive": false });
                this._rects[i].setColor(0, 0, 0, 0.5);
            }

            this._rects[i].setPosition(coords[i], -300000);
        }

        for (let i = 0; i < this._rects.length; i++)
        {
            this._rects[i].setSize(1, 110);
        }
        // console.log(Object.values(hashmap));
    }


    render()
    {
        this.update();
    }

    snapX(_x)
    {
        const x = gui.patchView.snapOpPosX(_x);
        let nx = x;

        // const ops = gui.patchView.getSelectedOps();

        // let opx = _x;
        // if (ops.length == 1)
        // {
        //     const op = ops[0];
        //     opx = op.uiAttribs.translate.x;
        // }

        let found = -1;
        for (let i = 0; i < this._rects.length; i++)
        {
            if (Math.abs(this._rects[i].x - x) < 50)
            {
                found = i;

                nx = this._rects[i].x;
            }
        }


        if (found > -1) this._rects[found].setSize(1, 600000);
        return nx;
    }


    snapY(y)
    {
        return gui.patchView.snapOpPosY(y);
    }
};
