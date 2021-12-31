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

    replaceShortcuts(txt)
    {

        txt = mmd(txt || "");

        txt = txt.replaceAll("[DRAG_LMB]", "<span class=\"icon icon-mouse_lmb_drag\"></span>");
        txt = txt.replaceAll("[DRAG_RMB]", "<span class=\"icon icon-mouse_rmb_drag\"></span>");
        txt = txt.replaceAll("[DRAG_MMB]", "<span class=\"icon icon-mouse_mmb_drag\"></span>");
        txt = txt.replaceAll("[RMB]", "<span class=\"icon icon-mouse_lmb\"></span>");
        txt = txt.replaceAll("[LMB]", "<span class=\"icon icon-mouse_rmb\"></span>");
        txt = txt.replaceAll("[MMB]", "<span class=\"icon icon-mouse_mmb\"></span>");
        txt = txt.replaceAll("[MW]", "<span class=\"icon icon-mouse_wheel\"></span>");


        txt = txt.replaceAll("[up]", "<code class=\"key_up\"></code>");
        txt = txt.replaceAll("[down]", "<code class=\"key_down\"></code>");
        txt = txt.replaceAll("[left]", "<code class=\"key_left\"></code>");
        txt = txt.replaceAll("[right]", "<code class=\"key_right\"></code>");


        txt = txt.replaceAll("[shift]", "<code class=\"key_shift\"></code>");

        if (navigator.appVersion.indexOf("Mac") != -1)
        {
            txt = txt.replaceAll("[cmd_ctrl]", "<code class=\"key_cmd\"></code>");
            txt = txt.replaceAll("[alt]", "<code class=\"key_option\"></code>");
        }
        else
        {
            txt = txt.replaceAll("[cmd_ctrl]", "<code class=\"key_cmd\">CTRL</code>");
            txt = txt.replaceAll("[alt]", "<code class=\"key_cmd\">ALT</code>");
        }



        return txt;
    }



    setContent(txt)
    {
        txt = txt || CABLES.UI.TEXTS.infoArea || "";

        if (this._txt == txt) return;

        this._txt = txt;
        txt = txt.replaceAll("||", "\n\n* ");
        txt=this.replaceShortcuts(txt);

        this._eleInfoArea.classList.remove("hidden");
        this._eleInfoArea.innerHTML = "<div class=\"infoareaContent\"> " + txt + "</div>";
    }

    hoverInfoEle(e)
    {
        let txt = e.target.dataset.info;
        if(CABLES.UI.TEXTS[e.target.dataset.info]) txt = CABLES.UI.TEXTS[e.target.dataset.info];
        // if (!txt) txt = ele.byId("infoArea").dataset.info;

        this.setContent(txt);
    }
}
