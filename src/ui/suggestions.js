

CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.SuggestionDialog=function(op,portname,mouseEvent,coords,cb)
{
    CABLES.UI.OPSELECT.newOpPos=coords;
    var self=this;
    var suggestions=gui.opDocs.getSuggestions(op.objName,portname);

    var degree=6;
    for(var i=0;i<suggestions.length;i++)
    {
        suggestions[i].id=i;
        // suggestions[i].rot=((i+1)*degree)-(2.5*degree);
        suggestions[i].rot=(((i)-(suggestions.length/2)) * degree);
        suggestions[i].left=30-Math.abs(((i)-((suggestions.length-1)/2))*6);
        // suggestions[i].left*=suggestions[i].left;
        // suggestions[i].left*=0.02;
        suggestions[i].top=(i*20)-80;
        suggestions[i].shortName=suggestions[i].name.substr(4,suggestions[i].name.length);

        console.log(i);
        // suggestions[i].left=(i*degree)-(2.5*degree);
    }

    var html = CABLES.UI.getHandleBarHtml('suggestions',{suggestions: suggestions });
    $('#suggestionDialog').html(html);
    $('#suggestionDialog').show();

    $('#suggestionDialog').css(
    {
        left:mouseEvent.clientX,
        top:mouseEvent.clientY,
    });


    $('#modalbg').show();

    $('#modalbg').on('click',function(){
        self.close();
    });


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
                console.log('create op:',suggestions[i]);
CABLES.UI.OPSELECT.linkNewOpToSuggestedPort={};
CABLES.UI.OPSELECT.linkNewOpToSuggestedPort.op=op;
CABLES.UI.OPSELECT.linkNewOpToSuggestedPort.portName=portname;
CABLES.UI.OPSELECT.linkNewOpToSuggestedPort.newPortName=suggestions[i].port;

                gui.scene().addOp(suggestions[i].name);
            }
        }
        this.close();

    };


};
