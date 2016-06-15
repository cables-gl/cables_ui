

CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.SuggestionDialog=function(op,portname,mouseEvent,coords,cb)
{
    this.close=function()
    {
        $('#suggestionDialog').html('');
        $('#suggestionDialog').hide();
        CABLES.UI.MODAL.hide(true);
    };

    this.showSelect=function()
    {
        this.close();
        cb();
    };

    this.createOp=function(id)
    {
        for(var i in suggestions)
        {
            if(suggestions[i].id==id)
            {
                CABLES.UI.OPSELECT.linkNewOpToSuggestedPort={};
                CABLES.UI.OPSELECT.linkNewOpToSuggestedPort.op=op;
                CABLES.UI.OPSELECT.linkNewOpToSuggestedPort.portName=portname;
                CABLES.UI.OPSELECT.linkNewOpToSuggestedPort.newPortName=suggestions[i].port;
                gui.scene().addOp(suggestions[i].name);
            }
        }
        this.close();

    };

    CABLES.UI.OPSELECT.newOpPos=coords;
    var self=this;
    var suggestions=gui.opDocs.getSuggestions(op.objName,portname);

    if(!suggestions)
    {
        cb();
        return;
    }

    var sugDegree=6;
    var sugHeight=20;
    var i=0;

    for(i=0;i<suggestions.length;i++)
    {
        suggestions[i].id=i;
        suggestions[i].rot=(((i)-(suggestions.length/2)) * sugDegree);
        suggestions[i].left=15-Math.abs(((i)-((suggestions.length-1)/2))*3)/2;
        suggestions[i].top=(i*sugHeight)-(suggestions.length*sugHeight/2)-sugHeight;
        suggestions[i].shortName=suggestions[i].name.substr(4,suggestions[i].name.length);
    }

    var html = CABLES.UI.getHandleBarHtml('suggestions',{suggestions: suggestions });
    $('#suggestionDialog').html(html);
    $('#modalbg').show();
    $('#suggestionDialog').show();
    $('#suggestionDialog').css(
    {
        left:mouseEvent.clientX,
        top:mouseEvent.clientY,
    });


    $( ".opSelect" ).css({width:5,height:5,  "margin-left":2.5,"margin-top":-2.5});
    $( ".opSelect" ).animate({
      width:30,
      height:30,
      "margin-left":-15,
      "margin-top":-15
    }, 100);

    for(i=0;i<suggestions.length;i++)
    {
        suggestions[i].rot=(((i)-(suggestions.length/2)) * sugDegree);
        var left=15-Math.abs(((i)-((suggestions.length-1)/2))*3);

        suggestions[i].shortName=suggestions[i].name.substr(4,suggestions[i].name.length);

        $( "#suggestion"+i ).css({opacity:0});

        $( "#suggestion"+i ).delay( Math.abs(i-suggestions.length/2) *25).animate({
          opacity: 1,
          left: left,
      }, 230);

        suggestions[i].id=i;
    }

    $('#modalbg').on('click',function(){
        self.close();
    });

};
