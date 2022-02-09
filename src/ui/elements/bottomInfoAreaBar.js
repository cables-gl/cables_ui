import userSettings from "../components/usersettings";
import text from "../text";
import ele from "../utils/ele";

export default class BottomInfoAreaBar extends CABLES.EventTarget
{
    constructor()
    {
        super();
        this.showing = true;
        this._SETTINGS_NAME = "closeInfoArea2";
        this.hidden = false;
        this._eleInfoArea = ele.byId("infoArea");
        this._eleInfoAreaParam = ele.byId("infoAreaParam");

        if (!userSettings.get(this._SETTINGS_NAME)) this.openInfo();
        else this.closeInfo();

        this.updateStyles();
    }

    getHeight()
    {
        if (this.hidden) return 0;
        if (this.showing)
            return CABLES.UI.uiConfig.infoAreaHeight;
        else return 0;
    }

    updateStyles()
    {
        this._eleInfoAreaParam.classList.add("hidden");

        if (this.showing)
        {
            ele.byQuery("#infoAreaToggle span").classList.add("icon-chevron-down");
            ele.byQuery("#infoAreaToggle span").classList.remove("icon-help");
        }
        else
        {
            ele.byQuery("#infoAreaToggle span").classList.remove("icon-chevron-down");
            ele.byQuery("#infoAreaToggle span").classList.add("icon-help");
        }
    }

    toggle()
    {
        if (userSettings.get(this._SETTINGS_NAME)) this.openInfo();
        else this.closeInfo();

        this.updateStyles();
    }

    openInfo()
    {
        userSettings.set(this._SETTINGS_NAME, false);
        const wasShowing = this.showing;

        this.showing = true;
        if (wasShowing != this.showing) this.emitEvent("changed");
    }

    closeInfo()
    {
        userSettings.set(this._SETTINGS_NAME, true);
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

        txt = txt.replaceAll("[updown]", "<code class=\"key_updown\"></code>");


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

    setVisible(v)
    {
        const eleContainer = ele.byId("infoAreaContainer");
        if (!eleContainer) return;

        this.hidden = !v;

        if (v) ele.show(this._eleInfoArea);
        else ele.hide(this._eleInfoArea);
    }

    setContentParam(txt)
    {
        if (this.showing)
        {
            this._eleInfoAreaParam.classList.remove("hidden");
            this._eleInfoAreaParam.innerHTML = "<div class=\"infoareaContent\">&nbsp;&nbsp;" + txt + "</div>";
        }
    }

    setContent(txt)
    {
        this._eleInfoAreaParam.classList.add("hidden");
        txt = txt || text.infoArea || "";

        if (this._txt == txt) return;

        this._txt = txt;
        txt = txt.replaceAll("||", "\n\n* ");
        txt = this.replaceShortcuts(txt);

        this._eleInfoArea.classList.remove("hidden");
        this._eleInfoArea.innerHTML = "<div class=\"infoareaContent\"> " + txt + "</div>";
    }

    hoverInfoEle(e)
    {
        let txt = e.target.dataset.info;
        if (text[e.target.dataset.info]) txt = text[e.target.dataset.info];
        // if (!txt) txt = ele.byId("infoArea").dataset.info;

        this.setContent(txt);
    }
}
