CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.Tipps = function ()
{
    this._index=0;
    this._wasShown=false;    

    var index = Math.round(CABLES.UI.TIPS.length * Math.random());

    this.next=function()
    {
        index++;
        this.show();
    }

    this.neverShow = function () {
        CABLES.UI.userSettings.set("showTipps", false);
        this.show();
    }
    this.showAlways = function () {
        CABLES.UI.userSettings.set("showTipps", true);
        this.show();
    }

    this.show = function ()
    {
        if (index >= CABLES.UI.TIPS.length) index = 0;
        var html = '';//'<h2>Tipps</h2>';

        const tip = CABLES.UI.TIPS[index];

        html += '<div>';
        html += '</div>';

        html += '<div class="tip">';
        html += '  <div style="width:320px;max-height:300px;padding:20px;float:left">';
        html += '    <img style="max-width:300px;min-height:273px;max-height:273px;align:left;" src="https://docs.cables.gl/ui_walkthrough/video/'+tip.img+'" />';
        html += '  </div>';
        html += '  <div style="width:320px;float:left;">';
        html += '    <h3>' + (tip.title ||'Did you know...')+'</h3>';
        html += mmd(tip.descr);
        // html += '    <br/>';
        html += '    ' + (index + 1) + '/' + CABLES.UI.TIPS.length;
        html += '  </div>';
        html += '<div style="clear:both;"></div>';
        html += '</div>';

        html += '<div style="clear:both;padding:20px;">';
        html += '  <a onclick="CABLES.UI.MODAL.hide();" class="bluebutton">close</a>&nbsp;&nbsp;&nbsp;';
        html += '  <a onclick="CABLES.UI.tipps.next();" class="greybutton">next tip</a>';

        html += '  <div style="float:right;"><br/>';
        if (CABLES.UI.userSettings.get("showTipps")) html += '<a onclick="CABLES.UI.tipps.neverShow();" class="">do not show this on startup</a>';
            else html += '<a onclick="CABLES.UI.tipps.showAlways();" class="">show on startup again</a>';
        html += '  </div">';

        html += '</div>';

        CABLES.UI.MODAL.show(html,{title:'',nopadding:true});

    };

    this.showOnce = function ()
    {
        if (this._wasShown)return;
        this._wasShown=true;
        this.show();
    }
};

CABLES.UI.tipps=new CABLES.UI.Tipps();