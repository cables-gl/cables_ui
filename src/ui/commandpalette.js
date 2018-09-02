CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.CommandPallet=function()
{
    var lastSearch='';
    var findTimeoutId=0;

	this._cursorIndex=0;
	this._numResults=0;
    this._bookmarkActiveIcon = 'icon-pin-filled';
    this._bookmarkInactiveIcon = 'icon-pin-outline';
    this._defaultIcon = 'square';

    // TODO: Maybe move to sidebar-customizer created function!?
    this.initVueSidebarCustomizer = function() {
    vueStore.commit("sidebar/setAllItems", CABLES.CMD.commands); // set all commands to be used in the customizer
    };

    this.initVueSidebarCustomizer();

	this.isVisible=function()
	{
		return $("#cmdpalette").is(":visible");
	};

    this.show=function()
    {
		this._cursorIndex=0;
        CABLES.UI.MODAL.hide(true);
		$('#modalbg').show();
        $('#cmdpalette').show();
        $('#cmdinput').focus();

        $('#cmdinput').val(lastSearch);
        document.getElementById('cmdinput').setSelectionRange(0, lastSearch.length);
        var self=this;

        clearTimeout(findTimeoutId);
        findTimeoutId=setTimeout(function()
        {
            self.doSearch(lastSearch);
        },100);

		$('body').on( "keydown", this.keyDown);
    };

    this.onBookmarkIconClick = function(ev) {
      ev.stopPropagation();
      var el = $(ev.target);
      var cmd = el.closest('.result').data('cmd');

      // replace the pin-icon / set / remove icon from sidebar
      var addToSidebar = !isCmdInSidebar(cmd);
      if(addToSidebar) {
        el.removeClass(self._bookmarkInactiveIcon);
        el.addClass(self._bookmarkActiveIcon);
        vueStore.commit("sidebar/addItem", cmd); // add item to icon bar if it does not exist already
      } else { // remove from sidebar
        el.removeClass(self._bookmarkActiveIcon);
        el.addClass(self._bookmarkInactiveIcon);
        vueStore.commit("sidebar/removeItem", cmd);
      }
      vueStore.dispatch('sidebar/writeLocalStorage'); // update local storage
      var newItem = {
        userAction: addToSidebar ? 'add' : 'remove',
        cmd: cmd
      };
      var sidebarObj = CABLES.UI.userSettings.get('sidebar') || {};
      sidebarObj.items = sidebarObj.items || [];
      var items = sidebarObj.items;
      var itemFound = false;
      if(items) {
        for(var i=0; i<items.length; i++) {
          if(items[i].cmd === newItem.cmd) {
            if(!items[i].userAction && items[i].userAction !== newItem.userAction) {
              items[i].userAction = newItem.userAction; // item existed, just chenge user action
              itemFound = true;
              break;
            }
          }
        }
      }
      if(!itemFound) {
        items.push(newItem);
      }
      CABLES.UI.userSettings.set('sidebar', sidebarObj);
    };

    this.onResultClick = function(ev) {
      var el = $(ev.target);
      var cmd = el.data("cmd");
      gui.cmdPallet.close();
      CABLES.CMD.exec(cmd);
    };

    function isCmdInSidebar(cmdName) {
      return vueStore.getters['sidebar/iconBarContainsCmd'](cmdName);
    }

    /*
     * Checks if a commad is currently in the sidebar and returns the fitting icon (class name)
     * (filled pin or outline pin)
     */
    function getBookmarkIconForCmd(cmdName) {
      if(isCmdInSidebar(cmdName)) {
          return self._bookmarkActiveIcon;
      }
      return self._bookmarkInactiveIcon;
    }

    function addResult(cmd,num)
    {
        var html='';


        html+='<div class="result" id="result'+num+'" data-cmd="' + cmd.cmd + '" onclick=gui.cmdPallet.onResultClick(event)>';
        // html+='<div class="result" id="result'+num+'" >';

		// <a class="icon-x icon icon-2x" onclick="$('#searchbox').hide();"></a>

		html+='<span class="icon icon-'+(cmd.icon||'square')+'"/>';

        html+='<span class="title">'+cmd.cmd+'</span>';
        html+='<span class="category"> – ' + cmd.category + '</span>';

        var bookmarkIcon = getBookmarkIconForCmd(cmd.cmd);
        html+='<span class="icon ' + bookmarkIcon + ' bookmark" onclick=gui.cmdPallet.onBookmarkIconClick(event)></span>';
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
        // if(str.length<2)return;


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
