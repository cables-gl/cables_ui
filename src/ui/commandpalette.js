CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.CommandPalette=function()
{
    var lastSearch='';

    var findTimeoutId=0;

    this.show=function()
    {
        $('#cmdpalette').show();
        $('#cmdinput').focus();

        $('#cmdinput').val(lastSearch);
        document.getElementById('cmdinput').setSelectionRange(0, lastSearch.length);
        var self=this;

        clearTimeout(findTimeoutId);
        findTimeoutId=setTimeout(function()
        {
            // console.log(1);
            self.doSearch(lastSearch);
        },100);
    };

    function addResult(cmd)
    {
        var html='';

        html+='<div class="result" onclick="CABLES.CMD.exec(\''+cmd.cmd+'\');gui._cmdPalette.close()">';

		// <a class="icon-x icon icon-2x" onclick="$('#searchbox').hide();"></a>

		html+='<span class="icon icon-'+(cmd.icon||'square')+'"/>';

        html+='<span class="title">'+cmd.cmd+'</span> - '+cmd.category;

		if(cmd.hotkey)
		{
			html+='<span class="hotkey">[ '+cmd.hotkey+' ]</span>';
		}
        html+='</div>';

        setTimeout(
            function()
            {
                $('#searchresult_cmd').append(html);
            },1);
    }

    var canceledSearch=0;
    var idSearch=1;
    this.doSearch=function(str,searchId)
    {
        lastSearch=str;
        $('#searchresult_cmd').html('');
        if(str.length<2)return;

        str=str.toLowerCase();

        for(var i=0;i<CABLES.CMD.commands.length;i++)
        {
            // console.log('.');
            var cmd=CABLES.CMD.commands[i].cmd;
            if(cmd.toLowerCase().indexOf(str)>=0)
            {
                addResult(CABLES.CMD.commands[i]);
                // console.log('!'+cmd);

            }

        }

    };

    this.close=function()
    {
        $('#searchresult_cmd').html('');
        $('#cmdpalette').hide();
    }

};
