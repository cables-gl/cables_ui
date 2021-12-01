export default class ModalBackground extends CABLES.EventTarget
{
    constructor()
    {
        super();
        this._eleBg = document.getElementById("modalbg");
    }

    show()
    {
        this.emitEvent("show");
        this._eleBg.style.display = "block";
    }

    hide()
    {
        this.emitEvent("hide");
        this._eleBg.style.display = "none";
    }
}
