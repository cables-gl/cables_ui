import userSettings from "../../components/usersettings.js";
import TransformsIcon from "./transformsicon.js";

export default class TransformsOverlay
{
    constructor()
    {
        this._transforms = {};
        this._lastCheck = 0;

        if (!gui.isRemoteClient)
            setInterval(this._cleanUp.bind(this), 2000);
    }

    _cleanUp(diff)
    {
        diff = diff || 500;
        for (const i in this._transforms)
        {
            if (performance.now() - this._transforms[i].lastUpdate > diff)
            {
                this._transforms[i].dispose();
                delete this._transforms[i];
            }
        }
    }

    click(screenPos)
    {
        const activateTransform = (op, id) =>
        {
            this._lastClicked = id;
            gui.patchView.setCurrentSubPatch(op.uiAttribs.subPatch || 0);
            gui.patchView.centerSelectOp(id);
            gui.opParams.show(id);
            gui.patchView.focus();
        };

        let found = [];
        let foundIds = [];

        for (const i in this._transforms)
            if (

                Math.abs(this._transforms[i].screenPos[0] - screenPos[0] < 10) &&
                Math.abs(this._transforms[i].screenPos[1] - screenPos[1]) < 10)
            {
                found.push(i);
                foundIds.push(this._transforms[i].id);
            }

        if (found.length == 0) return;

        let i = 0;
        if (foundIds.indexOf(this._lastClicked) > -1) i = foundIds.indexOf(this._lastClicked) + 1;
        if (i == -1)i = 0;
        if (i > found.length - 1)i = 0;

        const trans = this._transforms[found[i]];
        const op = gui.corePatch().getOpById(trans.id);

        activateTransform(op, trans.id);
    }

    add(cgl, id, x, y, z)
    {
        if (gui.isRemoteClient) return;
        this._transforms[id] = this._transforms[id] || new TransformsIcon(cgl, id);
        this._transforms[id].setPos(x, y, z);

        if (performance.now() - this._lastCheck > 50)
        {
            this._cleanUp(100);

            this._lastCheck = performance.now();
        }
    }

    updateVisibility()
    {
        this.setVisible(gui.shouldDrawOverlay);
    }

    setVisible(b)
    {
        if (!b)
            for (const i in this._transforms)
            {
                this._transforms[i].dispose();
                delete this._transforms[i];
            }
    }
}
