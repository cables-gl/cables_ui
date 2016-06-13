CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};
CABLES.UI.OPSELECT=CABLES.UI.OPSELECT || {};

CABLES.UI.OPSELECT.linkNewLink=null;
CABLES.UI.OPSELECT.linkNewOpToPort=null;
CABLES.UI.OPSELECT.linkNewOpToOp=null;
CABLES.UI.OPSELECT.newOpPos={x:0,y:0};

CABLES.UI.OPSELECT.updateOptions=function(opname)
{
    var num=$('.searchbrowser .searchable:visible').length;

    if(num===0)
    {
        $('#search_noresults').show();
        var userOpName='Ops.User.'+gui.user.username+'.'+$('#opsearch').val();
        $('.userCreateOpName').html(userOpName);
        $('#createuserop').attr('onclick','gui.serverOps.create(\''+userOpName+'\');')

    }
    else $('#search_noresults').hide();

    var optionsHtml='&nbsp;found '+num+' ops.';

    if(gui.user.isAdmin && $('#opsearch').val() && ($('#opsearch').val().startsWith('Ops.') || $('#opsearch').val().startsWith('Op.'))   )
    {
        optionsHtml+='&nbsp;&nbsp;<i class="fa fa-lock"/> <a onclick="gui.serverOps.create(\''+$('#opsearch').val()+'\');">create op</a>';
    }
    if(gui.user.isAdmin && gui.serverOps.isServerOp(opname))
    {
        optionsHtml+='&nbsp;&nbsp;<i class="fa fa-lock"/> <a onclick="gui.serverOps.edit(\''+opname+'\');">edit '+opname+'</a>';
    }

    $('#opOptions').html(optionsHtml);
};


CABLES.UI.OPSELECT.showOpSelect=function(pos,linkOp,linkPort,link)
{
    function search()
    {
        var searchFor= $('#opsearch').val();

        if(!searchFor)
            $('#search_style').html('.searchable:{display:block;}');
        else
            $('#search_style').html(".searchable:not([data-index*=\"" + searchFor.toLowerCase() + "\"]) { display: none; }");

        CABLES.UI.OPSELECT.updateOptions();

    }
    CABLES.UI.OPSELECT.linkNewLink=link;
    CABLES.UI.OPSELECT.linkNewOpToPort=linkPort;
    CABLES.UI.OPSELECT.linkNewOpToOp=linkOp;
    CABLES.UI.OPSELECT.newOpPos=pos;

    var self=this;

    var html = CABLES.UI.getHandleBarHtml('op_select',{ops: CABLES.UI.OPSELECT.getOpList() });
    CABLES.UI.MODAL.show(html);

    $('#opsearch').focus();
    $('#opsearch').on('input',search);

    $( ".searchresult:first" ).addClass( "selected" );
    var itemHeight=$( ".searchresult:first" ).height()+10+1;

    var displayBoxIndex=0;

    var Navigate = function(diff)
    {
        displayBoxIndex += diff;

        if (displayBoxIndex < 0) displayBoxIndex = 0;
        var oBoxCollection = $(".searchresult:visible");
        var oBoxCollectionAll = $(".searchresult");
        if (displayBoxIndex >= oBoxCollection.length) displayBoxIndex = oBoxCollection.length-1;
        if (displayBoxIndex < 0) displayBoxIndex = oBoxCollection.length - 1;

        var cssClass = "selected";

        oBoxCollectionAll.removeClass(cssClass);
        oBoxCollection.removeClass(cssClass).eq(displayBoxIndex).addClass(cssClass);

        if(displayBoxIndex>12)
            $('.searchbrowser').scrollTop( (displayBoxIndex-12)*itemHeight );
        else
            $('.searchbrowser').scrollTop( 1 );

        updateInfo();
    };

    var infoTimeout=-1;
    var lastInfoOpName='';

    this.searchFor=function(what)
    {
        $('#opsearch').val(what);
        search();
    };

    this.selectOp=function(name)
    {
        var oBoxCollectionAll = $(".searchresult");

        oBoxCollectionAll.removeClass('selected');
        $('.searchresult[data-opname="'+name+'"]').addClass('selected');
        // oBoxCollection.removeClass(cssClass).eq(displayBoxIndex).addClass('selected');

        updateInfo();
    };

    function updateInfo()
    {
        var opname=$('.selected').data('opname');
        var htmlFoot='';

        CABLES.UI.OPSELECT.updateOptions(opname);

        if(opname)
        {

            $('#searchinfo').html('');

            var content=gui.opDocs.get(opname);
            $('#searchinfo').html(content+htmlFoot);
        }
    }

    function onInput(e)
    {
        displayBoxIndex=0;
        Navigate(0);
        updateInfo();
    }

    $('#opsearch').on('input',onInput);

    $('#opsearch').keydown(function(e)
    {
        switch(e.which)
        {
            case 13:
                var opname=$('.selected').data('opname');
                if(opname && opname.length>2)
                {
                    CABLES.UI.MODAL.hide();
                    gui.scene().addOp(opname);
                }
            break;

            case 8:
                onInput();
                return true;
            case 38: // up
                $('.selected').removeClass('selected');
                Navigate(-1);
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

    function getop(ns,val,parentname)
    {
        if (Object.prototype.toString.call(val) === '[object Object]')
        {
            for (var propertyName in val)
            {
                if (val.hasOwnProperty(propertyName))
                {
                    var html='';
                    var opname=ns+'.'+ parentname + propertyName + '';

                    var isOp=false;
                    var isFunction=false;
                    if(eval('typeof('+opname+')')=="function") isFunction=true;

                    var parts=opname.split('.');
                    var lowercasename=opname.toLowerCase()+'_'+parts.join('').toLowerCase();

                    var shortName=parts[parts.length-1];
                    parts.length=parts.length-1;
                    var nameSpace=parts.join('.');


                    if(isFunction && !opname.startsWith('Ops.Deprecated'))
                    {
                        var op=
                        {
                            "nscolor":CABLES.UI.uiConfig.getNamespaceClassName(opname),
                            "isOp":isOp,
                            "name":opname,
                            "userOp":opname.startsWith('Ops.User'),
                            "shortName":shortName,
                            "nameSpace":nameSpace,
                            "lowercasename":lowercasename
                        };
                        ops.push(op);
                    }

                    found=getop(ns,val[propertyName],parentname+propertyName+'.');
                }
            }
        }
    }

    getop('Ops',Ops,'');
    // getop('Op',CABLES.Op,'');

    ops.sort(function(a, b)
    {
        return a.name.length - b.name.length; // ASC -> a - b; DESC -> b - a
    });


    return ops;
};
