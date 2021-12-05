export default class ModalBackground extends CABLES.EventTarget
{
    constructor()
    {
        super();
        this._eleBg = document.getElementById("modalbg");
        this.showing = false;
    }

    show()
    {
        if (!this.showing)
        {
            this.showing = true;
            this.emitEvent("show");
        }
        this._eleBg.style.display = "block";
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
