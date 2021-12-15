import ele from "../utils/ele";

export default class BottomInfoAreaBar extends CABLES.EventTarget
{
    constructor()
    {
        super();
        this.showing = true;
        this._SETTINGS_NAME = "closeInfoArea2";

        this._eleInfoArea = ele.byId("infoArea");

        if (!CABLES.UI.userSettings.get(this._SETTINGS_NAME)) this.openInfo();
        else this.closeInfo();
    }

    getHeight()
    {
        if (this.showing)
            return CABLES.UI.uiConfig.infoAreaHeight;
        else return 0;
    }

    toggle()
    {
        if (CABLES.UI.userSettings.get(this._SETTINGS_NAME)) this.openInfo();
        else this.closeInfo();
    }

    openInfo()
    {
        CABLES.UI.userSettings.set(this._SETTINGS_NAME, false);
        const wasShowing = this.showing;

        this.showing = true;
        if (wasShowing != this.showing) this.emitEvent("changed");
    }

    closeInfo()
    {
        CABLES.UI.userSettings.set(this._SETTINGS_NAME, true);
        const wasShowing = this.showing;
        this.showing = false;
        if (wasShowing != this.showing) this.emitEvent("changed");
    }

    setContent(txt)
    {
        txt = txt || CABLES.UI.TEXTS.infoArea || "";
        // txt = txt.replaceAll("CMD", "⌘");

        this._eleInfoArea.classList.remove("hidden");
        this._eleInfoArea.innerHTML = "<div class=\"infoareaContent\"> <span class=\"icon icon-left_mouse_drag\"></span>Drag mouse to whatever " + mmd(txt || "") + "</div>";
    }

    hoverInfoEle(e)
    {
        let txt = e.target.dataset.info;
        if (e.target.dataset.infotext) txt = CABLES.UI.TEXTS[e.target.dataset.infotext];
        if (!txt) txt = document.getElementById("infoArea").dataset.info;


        this.setContent(txt);
    }
}
