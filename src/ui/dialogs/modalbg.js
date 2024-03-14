import { Events } from "cables-shared-client";

export default class ModalBackground extends Events
{
    constructor()
    {
        super();
        this._eleBg = document.getElementById("modalbg");
        this.showing = false;

        this._eleBg.addEventListener("pointerdown", () =>
        {
            this.emitEvent("click");
        });
    }

    show(transparent)
    {
        if (!this.showing)
        {
            this.showing = true;
            this.emitEvent("show");
        }
        this._eleBg.style.display = "block";

        if (transparent) this._eleBg.classList.add("modalbgtransparent");
        else this._eleBg.classList.remove("modalbgtransparent");
    }

    hide()
    {
        if (this.showing)
        {
            this.showing = false;
            this.emitEvent("hide");
        }
        this._eleBg.style.display = "none";
    }
}
