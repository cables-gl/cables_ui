CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.Exporter=function(project)
{
    this.show=function()
    {
        if (!gui.getSavedState()) {
            CABLES.UI.MODAL.show(CABLES.UI.TEXTS.projectExportNotSaved);
            return;
        }

        var html = CABLES.UI.getHandleBarHtml(
            'export',
            {
                texts:CABLES.UI.TEXTS,
                user:gui.user,
            });

        CABLES.UI.MODAL.show(html,{title:'',nopadding:true});
        document.getElementById("doExportButton").addEventListener("click",function()
        {
            const options={};
            const e = document.getElementById("export_settings_assets");
            options.assets = e.options[e.selectedIndex].value;

            const e2 = document.getElementById("export_settings_combine");
            options.combine = e2.options[e2.selectedIndex].value;

            const e3 = document.getElementById("export_settings_compatibility");
            options.compatibility = e3.options[e3.selectedIndex].value;

            CABLES.UI.MODAL.hide();

            this.exportStatic(options);
        }.bind(this));

    };

    this.exportStatic = function(options) {

        var ignoreAssets=false;
        CABLES.UI.MODAL.showLoading('Exporting Patch...');

        CABLESUILOADER.talkerAPI.send(
            "exportPatch",
            {
                "options":options
            },
            function(err,r)
            {
                var msg = '';

                if (r.error || err)
                {
                    msg = "<h2>export error</h2>";
                    msg += '<pre class="shaderErrorCode">' + JSON.stringify(r) + '<pre>';
                }
                else
                {
                    msg = "<h2>export finished</h2>";
                    msg += '<div style="max-width:800px">Cables has been built by a team of dedicated developers who have invested a huge amount of time and effort. Right now cables is free, so please support us by linking back to cables in any web page or piece work that uses it. Thank you';
                    msg += '<br/><br/>If this is a copy of another patch then please do the right thing and ask the original author for permission. In general it\'s a good idea to give them credits by mentioning their user name and a link to the original patch</div><br/>';

                    msg += '<br/><br/><br/>';
                    msg += '<a class="bluebutton" href="' + r.path + '">Download '+ Math.round(r.size*100)/100 + ' mb</a>';
                    msg += '<br/><br/>';
                    msg += '<div class="shaderErrorCode">' + r.log + '</div>';
                }

                CABLES.UI.MODAL.show(msg);
            });
    };

};
