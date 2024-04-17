import userSettings from "../../components/usersettings.js";
import TransformsIcon from "./transformsicon.js";

export default class TransformsOverlay
{
    constructor()
    {
        this._transforms = {};
        this._lastCheck = 0;
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

    add(cgl, id, x, y, z)
    {
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
        CABLES.UI.showCanvasTransforms = userSettings.get("showCanvasTransforms") && userSettings.get("overlaysShow");
        this.setVisible(CABLES.UI.showCanvasTransforms);
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
