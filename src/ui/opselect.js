CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};
CABLES.UI.OPSELECT=CABLES.UI.MODAL || {};


CABLES.UI.OPSELECT.showOpSelect=function(x,y,linkOp,linkPort,link)
{
    linkNewLink=link;
    linkNewOpToPort=linkPort;
    linkNewOpToOp=linkOp;
    mouseNewOPX=ui.getCanvasCoords(x,y).x;
    mouseNewOPY=ui.getCanvasCoords(x,y).y;

    var html = CABLES.UI.getHandleBarHtml('op_select',{ops: CABLES.UI.OPSELECT.getOpList() });
    CABLES.UI.MODAL.show(html);

    $('#opsearch').focus();
    $('#opsearch').on('input',function(e)
    {
        var searchFor= $('#opsearch').val();

        if(!searchFor)
            $('#search_style').html('.searchable:{display:block;}');
        else
            $('#search_style').html(".searchable:not([data-index*=\"" + searchFor.toLowerCase() + "\"]) { display: none; }");
    });


    $( ".searchresult:first" ).addClass( "selected" );

    var displayBoxIndex=0;
    var Navigate = function(diff)
    {
        displayBoxIndex += diff;

        if (displayBoxIndex < 0) displayBoxIndex = 0;
        var oBoxCollection = $(".searchresult:visible");
        var oBoxCollectionAll = $(".searchresult");
        if (displayBoxIndex >= oBoxCollection.length) displayBoxIndex = 0;
        if (displayBoxIndex < 0) displayBoxIndex = oBoxCollection.length - 1;

        var cssClass = "selected";
        oBoxCollectionAll.removeClass(cssClass);

        oBoxCollection.removeClass(cssClass).eq(displayBoxIndex).addClass(cssClass);
    };

    function onInput(e)
    {
        // $(".searchresult:visible").first().addClass( "selected" );
        displayBoxIndex=0;
        Navigate(0);
    }

    $('#opsearch').on('input',onInput);

    $('#opsearch').keydown(function(e)
    {
        switch(e.which)
        {
            case 13:
                var opname=$('.selected').data('opname');
                ui.scene.addOp(opname);
                CABLES.UI.MODAL.hide();
            break;

            case 8:
                onInput();
                return true;
            break;

            case 37: // left
            break;

            case 38: // up
                $('.selected').removeClass('selected');
                Navigate(-1);
            break;

            case 39: // right
            break;

            case 40: // down
                $('.selected').removeClass('selected');
                Navigate(1);
            break;

            default: return; // exit this handler for other keys
        }
        e.preventDefault(); // prevent the default action (scroll / move caret)
    });


};

CABLES.UI.OPSELECT.getOpList=function()
{
    var ops=[];

    function getop(val,parentname)
    {
        if (Object.prototype.toString.call(val) === '[object Object]')
        {
            for (var propertyName in val)
            {
                if (val.hasOwnProperty(propertyName))
                {
                    var html='';
                    var opname='Ops.'+ parentname + propertyName + '';

                    var isOp=false;
                    var isFunction=false;
                    if(eval('typeof('+opname+')')=="function") isFunction=true;

                    if(isFunction)
                    {
                        var op=
                        {
                            isOp:isOp,
                            name:opname,
                            lowercasename:opname.toLowerCase()
                        };
                        ops.push(op);
                    }

                    found=getop(val[propertyName],parentname+propertyName+'.');
                }
            }
        }
    }

    getop(Ops,'');

    return ops;
};



