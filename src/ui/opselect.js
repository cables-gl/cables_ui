CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};
CABLES.UI.OPSELECT=CABLES.UI.OPSELECT || {};

CABLES.UI.OPSELECT.linkNewLink=null;
CABLES.UI.OPSELECT.linkNewOpToPort=null;
CABLES.UI.OPSELECT.linkNewOpToOp=null;
CABLES.UI.OPSELECT.newOpPos={x:0,y:0};

CABLES.UI.OPSELECT.showOpSelect=function(pos,linkOp,linkPort,link)
{
    CABLES.UI.OPSELECT.linkNewLink=link;
    CABLES.UI.OPSELECT.linkNewOpToPort=linkPort;
    CABLES.UI.OPSELECT.linkNewOpToOp=linkOp;
    CABLES.UI.OPSELECT.newOpPos=pos;

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
        
        updateInfo();
    };

    var infoTimeout=-1;
    var lastInfoOpName='';
    function updateInfo()
    {
        var opname=$('.selected').data('opname');

        if(opname && lastInfoOpName!=opname)
        {
            $('#searchinfo').html('');

            if(!CABLES.API.isConnected)
            {
                $('#searchinfo').html('not connected to server...');
                return;
            }
            
            var cached=CABLES.api.hasCached('doc/ops/'+opname);
            if(cached)
            {
                $('#searchinfo').html(cached.data.html);
                return;
            }

            if(infoTimeout!=-1)clearTimeout(infoTimeout);
            infoTimeout = setTimeout(function()
            {
                lastInfoOpName=$('.selected').data('opname');

                CABLES.api.getCached(
                    'doc/ops/'+opname,
                    function(res)
                    {
                        $('#searchinfo').html(res.html);
                    },
                    function(res){ console.log('err',res); }
                    );
                console.log('opname',opname);

            }, 300);

        }
    }

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
                gui.scene().addOp(opname);
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

    setTimeout(function(){$('#opsearch').focus();},100);

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

    ops.sort(function(a, b)
    {
        return a.name.length - b.name.length; // ASC -> a - b; DESC -> b - a
    });


    return ops;
};



