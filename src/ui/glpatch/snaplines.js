import userSettings from "../components/usersettings";
import GlRect from "../gldraw/glrect";

export default class SnapLines extends CABLES.EventTarget
{
    constructor(cgl, glPatch, instancer)
    {
        super();

        this._glPatch = glPatch;
        this._xCoords = [];
        this._instancer = instancer;
        this._timeout = null;

        this._rectWidth = 1;
        this.rect = new GlRect(this._instancer, { "interactive": false });
        this.rect.setColor(0, 0, 0, 0.3);
        this.rect.setPosition(0, -300000);
        this.rect.setSize(this._rectWidth * 2, 1000000);

        this.enabled = !userSettings.get("disableSnapLines");
    }

    update()
    {
        if (!this.enabled) return;
        this._xCoords.length = 0;
        clearTimeout(this._timeout);
        this._timeout = setTimeout(() =>
        {
            const perf = CABLES.UI.uiProfiler.start("snaplines.update");
            const hashmap = {};
            const ops = gui.corePatch().getSubPatchOps(this._glPatch.getCurrentSubPatch());

            const selOps = gui.patchView.getSelectedOps();
            let selOp = null;
            if (selOps.length == 1) selOp = selOps[0];

            for (let i = 0; i < ops.length; i++)
                if (selOp != ops[i] && selOps.indexOf(ops[i]) == -1 && ops[i].uiAttribs.translate)
                    hashmap[ops[i].uiAttribs.translate.x] = (hashmap[ops[i].uiAttribs.translate.x] || 0) + 1;

            for (let i in hashmap)
            {
                const ii = parseInt(i);
                if (hashmap[ii] > 1)
                    this._xCoords.push(ii);
            }
            perf.finish();
        }, 50);
    }

    render(mouseDown)
    {
        if (!this.enabled) return;
        if (!mouseDown) this.rect.visible = false;
    }

    snapX(_x, forceSnap)
    {
        let x = gui.patchView.snapOpPosX(_x);
        if (this.enabled)
        {
            if (gui.patchView.getSelectedOps().length == 1)
            {
                const perf = CABLES.UI.uiProfiler.start("snaplines.coordloop");
                let dist = 1;
                if (forceSnap) dist = 3;
                this.rect.visible = false;
                for (let i = 0; i < this._xCoords.length; i++)
                {
                    if (Math.abs(this._xCoords[i] - _x) < CABLES.UI.uiConfig.snapX * dist)
                    {
                        x = this._xCoords[i];
                        this.rect.setPosition(this._xCoords[i] - this._rectWidth, -300000);
                        this.rect.visible = true;
                        break;
                    }
                }
                perf.finish();
            }
        }
        return x;
    }

    snapY(y)
    {
        return gui.patchView.snapOpPosY(y);
    }
}
