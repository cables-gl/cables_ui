import userSettings from "../../components/usersettings.js";
import TransformsIcon from "./transformsicon.js";

export default class HtmlElementOverlay
{
    constructor()
    {
        this._showing = true;
        this._trackEle = null;

        gui.opParams.on("opSelected", (op) =>
        {
            this._trackEle = null;
            if (!op) return;

            const ports = op.portsOut;

            for (let i = 0; i < ports.length; i++)
                if (ports[i].get() && ports[i].uiAttribs.objType == "element") this._trackEle = ports[i].get();

            this._update();
        });

        setInterval(this._update.bind(this), 50);
    }

    _update()
    {
        if (!gui.shouldDrawOverlay || !this._trackEle)
        {
            if (this._eleOver)
            {
                this._eleOver.remove();
                this._eleOver = null;
            }
            return;
        }

        const r = this._trackEle.getBoundingClientRect();

        if (!this._eleOver)
        {
            this._eleOver = document.createElement("div");
            this._eleOver.classList.add("cblUiHtmlEleOverlay");
            document.body.appendChild(this._eleOver);
        }

        this._eleOver.style.display = "block";
        this._eleOver.style.left = r.x + "px";
        this._eleOver.style.top = r.y + "px";
        this._eleOver.style.width = r.width - 2 + "px";
        this._eleOver.style.height = r.height - 2 + "px";
    }
}
