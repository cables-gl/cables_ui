CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.Find=function()
{
    var lastSearch='';


    var findTimeoutId=0;

    this.show=function(str)
    {
        $('#searchbox').show();
        // $('#meta_content_find').html(html+"!!!");
        $('#findinput').focus();

        $('#findinput').val(lastSearch);
        document.getElementById('findinput').setSelectionRange(0, lastSearch.length);
        var self=this;

        clearTimeout(findTimeoutId);
        findTimeoutId=setTimeout(function()
        {
            self.search(lastSearch);
        },100);

        if(str)
        {
            $('#searchbox input').val(str);
            this.search(str);
        }

    };

    function addResultOp(op)
    {
        var html='';

		var colorClass="op_color_"+CABLES.UI.uiConfig.getNamespaceClassName(op.op.objName);
        html+='<div onclick="gui.patch().setCurrentSubPatch(\''+op.getSubPatch()+'\');gui.patch().focusOp(\''+op.op.id+'\');gui.patch().centerViewBox('+op.op.uiAttribs.translate.x+','+op.op.uiAttribs.translate.y+');gui.patch().setSelectedOpById(\''+op.op.id+'\');$(\'#patch\').focus();">';
        html+='<h3 class="'+colorClass+'">'+op.op.name+'</h3>';
        html+=''+op.op.objName;
        html+='</div>';


        setTimeout(
            function()
            {
                $('#searchresult').append(html);
            },1);


    }

    var canceledSearch=0;
    var idSearch=1;
    this.doSearch=function(str,searchId)
    {
        lastSearch=str;
        $('#searchresult').html('');
        if(str.length<2)return;

        str=str.toLowerCase();
        // console.log('--- ',str);

        var foundNum=0;
        for(var i=0;i<gui.patch().ops.length;i++)
        {
            if(canceledSearch==searchId)
            {
                console.log("canceled search...");
                return;
            }
            if(gui.patch().ops[i].op)
            {
                if(
                    gui.patch().ops[i].op.objName.toLowerCase().indexOf(str)>-1 ||
                    gui.patch().ops[i].op.name.toLowerCase().indexOf(str)>-1
                )
                {
                    addResultOp(gui.patch().ops[i]);
                    foundNum++;
                }
                else
                {
                    var op=gui.patch().ops[i].op;
                    for(var j=0;j<op.portsIn.length;j++)
                    {
                        if((op.portsIn[j].get()+'').toLowerCase().indexOf(str)>-1)
                        {
                            addResultOp(gui.patch().ops[i]);
                            foundNum++;
                        }
                    }
                }
            }
        }

        if(foundNum===0)
        {
            $('#searchresult').html('<br/><center>no ops found</center><br/>');

        }

    };

    this.search=function(str)
    {
        this.doSearch(str);
    };

};
