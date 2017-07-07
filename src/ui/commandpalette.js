CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.CommandPalette=function()
{
    var lastSearch='';
    var findTimeoutId=0;

	this._cursorIndex=0;
	this._numResults=0;

	this.isVisible=function()
	{
		return $("#cmdpalette").is(":visible");
	};

    this.show=function()
    {
		this._cursorIndex=0;
		$('#modalbg').show();
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

		$('body').on( "keydown", this.keyDown);
    };

    function addResult(cmd,num)
    {
        var html='';


        html+='<div class="result" id="result'+num+'" onclick="CABLES.CMD.exec(\''+cmd.cmd+'\');gui._cmdPalette.close()">';

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

		var count=0;

        for(var i=0;i<CABLES.CMD.commands.length;i++)
        {
            // .log('.');
            var cmd=CABLES.CMD.commands[i].cmd;
            if(cmd.toLowerCase().indexOf(str)>=0)
            {
                addResult(CABLES.CMD.commands[i],count);
				count++;
            }
        }

		this._numResults=count;

		setTimeout(function()
		{
			this._cursorIndex=0;
			this.navigate();
		}.bind(this),10);

    };

	this.navigate=function(dir)
	{
		if(dir) self._cursorIndex+=dir;
		if(self._cursorIndex<0)self._cursorIndex=this._numResults-1;
		if(self._cursorIndex>=this._numResults)self._cursorIndex=0;


		$('.result').removeClass("selected");
		$('#result'+self._cursorIndex).addClass("selected");
	};


	var self=this;
	this.keyDown=function(e)
	{
	    switch(e.which)
	    {
	        case 13:
	    		$('#result'+self._cursorIndex).click();
	        break;

	        case 38: // up
	            self.navigate(-1);
	        break;

	        case 40: // down
	            self.navigate(1);
	        break;

	        default: return;
	    }
	    e.preventDefault();
	};



    this.close=function()
    {
		$('body').off( "keydown", this.keyDown);

        $('#searchresult_cmd').html('');
        $('#cmdpalette').hide();
		$('#modalbg').hide();
    };

};
