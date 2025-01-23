import { ele } from "cables-shared-client/index.js";
import { userSettings } from "../components/usersettings.js";
import text from "../text.js";
import ModalDialog from "./modaldialog.js";

/**
 * tips and tricks dialog with animated tips
 *
 * @export
 * @class Tips
 */
export default class Tips
{
    constructor()
    {
        this._index = 0;
        this._wasShown = false;
        this._index = Math.round(text.tips.length * Math.random());
    }

    next()
    {
        this._index++;
        this.show();
    }

    neverShow()
    {
        userSettings.set("showTipps", false);
        this.show();
    }

    showAlways()
    {
        userSettings.set("showTipps", true);
        this.show();
    }

    show()
    {
        if (this._index >= text.tips.length) this._index = 0;
        let html = "";// '<h2>Tipps</h2>';

        const tip = text.tips[this._index];

        html += "<div>";
        html += "</div>";

        html += "<div class=\"tip\">";
        html += "  <div style=\"width:320px;max-height:300px;padding:20px;float:left\">";
        html += "    <img style=\"max-width:300px;min-height:273px;max-height:273px;align:left;\" src=\"https://cables.gl/docs/0_howtouse/ui_walkthrough/video/" + tip.img + "\" />";
        html += "  </div>";
        html += "  <div style=\"width:320px;float:left;\">";
        html += "    <h3>" + (tip.title || "Did you know...") + "</h3>";
        html += marked.parse(tip.descr);
        // html += '    <br/>';
        html += "    " + (this._index + 1) + "/" + text.tips.length;
        html += "  </div>";
        html += "<div style=\"clear:both;\"></div>";
        html += "</div>";

        html += "<div style=\"clear:both;padding:20px;\">";
        html += "  <a id=\"modalClose\" class=\"bluebutton\">Close</a>";
        html += "  <a id=\"tips_next\" class=\"button\">Next tip</a>";

        html += "  <div style=\"float:right;\">";
        if (userSettings.get("showTipps")) html += "<a id=\"tips_showNever\" class=\"button-small\">Do not show this on startup</a>";
        else html += "<a id=\"tips_showAlways\" class=\"button-small\">Show on startup again</a>";
        html += "  </div\">";

        html += "</div>";

        new ModalDialog({ "html": html, "nopadding": true });

        ele.clickable(ele.byId("tips_next"), () =>
        {
            this.next();
        });

        ele.clickable(ele.byId("tips_showAlways"), () =>
        {
            this.showAlways();
        });

        ele.clickable(ele.byId("tips_showNever"), () =>
        {
            this.neverShow();
        });
    }

    showOnce()
    {
        if (this._wasShown) return;
        this._wasShown = true;
        this.show();
    }
}
