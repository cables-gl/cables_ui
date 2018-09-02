CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.Find=function()
{
    var lastSearch='';
    var findTimeoutId=0;
    var canceledSearch=0;
    var idSearch=1;

    this.show=function(str)
    {
        $('#searchbox').show();
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

    function addResultOp(op,score)
    {
        var html='';

		var colorClass="op_color_"+CABLES.UI.uiConfig.getNamespaceClassName(op.op.objName);
        html+='<div onclick="gui.patch().setCurrentSubPatch(\''+op.getSubPatch()+'\');gui.patch().focusOp(\''+op.op.id+'\');gui.patch().centerViewBox('+op.op.uiAttribs.translate.x+','+op.op.uiAttribs.translate.y+');gui.patch().setSelectedOpById(\''+op.op.id+'\');$(\'#patch\').focus();">';
        html+='<h3 class="'+colorClass+'">'+op.op.name+'</h3>';
        html+=''+op.op.objName;
        
        if(op.op.uiAttribs.subPatch!=0)
        {
            html+='<br/> subpatch: '+gui.patch().getSubPatchPathString(op.op.uiAttribs.subPatch);
        }
        html+='<br/>score:'+score;

        html+='</div>';

        setTimeout(
            function()
            {
                $('#searchresult').append(html);
            },1);
    }

    this.doSearch=function(str,searchId)
    {
        lastSearch=str;
        $('#searchresult').html('');
        if(str.length<2)return;

        str=str.toLowerCase();
        // console.log('--- ',str);

        var foundNum=0;
        var results=[];

        for(var i=0;i<gui.patch().ops.length;i++)
        {
            if(canceledSearch==searchId)
            {
                console.log("canceled search...");
                return;
            }
            if(gui.patch().ops[i].op)
            {
                var score=0;
                
                if(gui.patch().ops[i].op.objName.toLowerCase().indexOf(str)>-1) score+=1;

                if(String((gui.patch().ops[i].op.name||'')).toLowerCase().indexOf(str)>-1)
                {
                    if( gui.patch().ops[i].op.objName.indexOf( gui.patch().ops[i].op.name )==-1 ) score+=2; // extra points if non default name
                    score+=2;
                }

                var op=gui.patch().ops[i].op;
                for(var j=0;j<op.portsIn.length;j++)
                {
                    if((op.portsIn[j].get()+'').toLowerCase().indexOf(str)>-1) score+=2;
                }

                if(score>0)
                {
                    results.push({"op":gui.patch().ops[i],"score":score})
                    foundNum++;
                }
            }
        }


        if(foundNum===0)
        {
            $('#searchresult').html('<br/><center>no ops found</center><br/>');
        }
        else
        {

            results.sort(function(a,b)
            {
                return b.score-a.score;
            })
            for(var i=0;i<results.length;i++)
            {
                addResultOp(results[i].op,results[i].score);
            }
        }

    };

    this.search=function(str)
    {
        this.doSearch(str);
    };

};
