
export default class Tips
{
    constructor()
    {
        this._index = 0;
        this._wasShown = false;
        this._index = Math.round(CABLES.UI.TIPS.length * Math.random());
    }

    next()
    {
        this._index++;
        this.show();
    }

    neverShow()
    {
        CABLES.UI.userSettings.set("showTipps", false);
        this.show();
    }

    showAlways()
    {
        CABLES.UI.userSettings.set("showTipps", true);
        this.show();
    }

    show()
    {
        if (this._index >= CABLES.UI.TIPS.length) this._index = 0;
        let html = "";// '<h2>Tipps</h2>';

        const tip = CABLES.UI.TIPS[this._index];

        html += "<div>";
        html += "</div>";

        html += "<div class=\"tip\">";
        html += "  <div style=\"width:320px;max-height:300px;padding:20px;float:left\">";
        html += "    <img style=\"max-width:300px;min-height:273px;max-height:273px;align:left;\" src=\"https://cables.gl/docs/0_howtouse/ui_walkthrough/video/" + tip.img + "\" />";
        html += "  </div>";
        html += "  <div style=\"width:320px;float:left;\">";
        html += "    <h3>" + (tip.title || "Did you know...") + "</h3>";
        html += mmd(tip.descr);
        // html += '    <br/>';
        html += "    " + (this._index + 1) + "/" + CABLES.UI.TIPS.length;
        html += "  </div>";
        html += "<div style=\"clear:both;\"></div>";
        html += "</div>";

        html += "<div style=\"clear:both;padding:20px;\">";
        html += "  <a id=\"modalClose\" class=\"bluebutton\">close</a>";
        html += "  <a onclick=\"gui.tips.next();\" class=\"greybutton\">next tip</a>";

        html += "  <div style=\"float:right;\"><br/>";
        if (CABLES.UI.userSettings.get("showTipps")) html += "<a onclick=\"gui.tips.neverShow();\" class=\"button-small\">do not show this on startup</a>";
        else html += "<a onclick=\"gui.tips.showAlways();\" class=\"button-small\">show on startup again</a>";
        html += "  </div\">";

        html += "</div>";

        new CABLES.UI.ModalDialog({"html":html, "nopadding": true});
    }

    showOnce()
    {
        if (this._wasShown) return;
        this._wasShown = true;
        this.show();
    }
}
