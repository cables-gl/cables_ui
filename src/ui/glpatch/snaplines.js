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


        const size = 100000;
        const hsize = size / 2;

        const drawRaster = false;
        if (drawRaster)
        {
            for (let i = -300; i < 300; i++)
            {
                const r = new CABLES.GLGUI.GlRect(this._instancer, { "interactive": false });
                r.setSize(1, size);
                r.setPosition(i * CABLES.UI.uiConfig.snapX, -hsize, 0.19);
                r.setColor(0, 0, 0, 0.06);
            }
            for (let i = -300; i < 300; i++)
            {
                const r = new CABLES.GLGUI.GlRect(this._instancer, { "interactive": false });
                r.setSize(size, 1);
                r.setPosition(-hsize, i * CABLES.UI.uiConfig.snapY, 0.19);
                r.setColor(0, 0, 0, 0.06);
            }
        }
    }

    update()
    {
        const hashmap = {};
        const ops = gui.corePatch().ops;

        const selOps = gui.patchView.getSelectedOps();
        let selOp = null;
        if (selOps.length == 1) selOp = selOps[0];

        for (let i = 0; i < ops.length; i++)
        {
            if (selOp != ops[i] && selOps.indexOf(ops[i]) == -1)
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
    }

    render()
    {
        this.update();
    }

    snapX(_x)
    {
        const x = gui.patchView.snapOpPosX(_x);
        let nx = x;
        let found = -1;

        for (let i = 0; i < this._rects.length; i++)
        {
            if (Math.abs(this._rects[i].x - x) <= CABLES.UI.uiConfig.snapX * 3)
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
