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
        $('#createuserop').attr('onclick','gui.serverOps.create(\''+userOpName+'\');');
    }

    else $('#search_noresults').hide();

    var optionsHtml='&nbsp;found '+num+' ops.';

    if(gui.user.isAdmin && $('#opsearch').val() && ($('#opsearch').val().startsWith('Ops.') || $('#opsearch').val().startsWith('Op.'))   )
    {
        optionsHtml+='&nbsp;&nbsp;<i class="fa fa-lock"/> <a onclick="gui.serverOps.create(\''+$('#opsearch').val()+'\');">create op</a>';
    }

    if(opname && (gui.user.isAdmin || opname.startsWith('Ops.User.'+gui.user.username)) && gui.serverOps.isServerOp(opname))
    {
        optionsHtml+='&nbsp;&nbsp;<i class="fa fa-lock"/> <a onclick="gui.serverOps.edit(\''+opname+'\');">edit '+opname+'</a>';
    }

    $('#opOptions').html(optionsHtml);
};





CABLES.UI.OPSELECT.showHighlights=function(item,match,selector,orig)
{
    var found=false;

    if(match.indices && match.indices.length>0)
    {
        var part1=orig.substr( 0,match.indices[0][0]);
        var part2=orig.substr( match.indices[0][0],match.indices[0][1]+1);
        var part3=orig.substr( match.indices[0][0]+match.indices[0][1]+1, orig.length-(match.indices[0][0]+match.indices[0][1]+1));

        $('#result_'+item.id+' .'+selector).html( part1+'<i>'+part2+'</i>'+part3 );
        found=true;
    }
};

CABLES.UI.OPSELECT._search=function(q)
{
    var list=CABLES.UI.OPSELECT.list;
    var query=q.toLowerCase();
    var result=[];



    for(var i=0;i<list.length;i++)
    {
        var found=false;
        var points=0;

        if(list[i]._summary.indexOf(query)>-1)
        {
            found=true;
            points+=2;
        }

        if(list[i]._nameSpace.indexOf(query)>-1)
        {
            found=true;
            points+=2;
        }

        if(list[i]._shortName.indexOf(query)>-1)
        {
            found=true;
            points+=4;
        }

        if(found)
        {
            points+=list[i].pop||0/4000;
            result.push({item:list[i]});
        }

        list[i].score=points;
    }

    return result;
};



var list=[];
CABLES.UI.OPSELECT.showOpSelect=function(options,linkOp,linkPort,link)
{
    var markHighlightTimeout=0;
    var self=this;


    function search()
    {
        // var result = CABLES.UI.OPSELECT.fuse.search($('#opsearch').val() );
        var result=CABLES.UI.OPSELECT._search($('#opsearch').val());
        var i=0;


        var html='';

        // show found ops

        // console.log('0------');

        // for(i=0;i<list.length;i++)
        // {
        //     list[i].score=99;
        // }
        //
        // for(i=0;i<result.length;i++)
        // {
        //     list[result[i].item.id].score=result[i].score;
        //     // result[i].item.score=result[i].score;
        // }
        //
        for(i=0;i<CABLES.UI.OPSELECT.list.length;i++)
        {
            if(CABLES.UI.OPSELECT.list[i].score>0)
            {
                $('#result_'+CABLES.UI.OPSELECT.list[i].id).show();
                $('#result_'+CABLES.UI.OPSELECT.list[i].id+' .score').html(CABLES.UI.OPSELECT.list[i].score);

                $('#result_'+CABLES.UI.OPSELECT.list[i].id)[0].dataset.score=CABLES.UI.OPSELECT.list[i].score;
            }
                else $('#result_'+CABLES.UI.OPSELECT.list[i].id).hide();
        }
        //
        // for(i=0;i<result.length;i++)
        // {
        //     $('#result_'+result[i].item.id).show();
        //
        //     // console.log(result[i].item.shortName);
        //
        //     var addScore=0;
        //     if(result[i].matches && result[i].matches.length>0)
        //     {
        //         for(var m=0;m<result[i].matches.length;m++)
        //         {
        //             var match=result[i].matches[m];
        //             if(match.indices && match.indices.length>0 && match.key=='shortName')
        //             {
        //                 addScore=(match.indices[0][1]-match.indices[0][0])/result[i].item.shortName.length;
        //                 // console.log(result[i].item.shortName,addScore);
        //                 // continue;
        //             }
        //         }
        //     }
        //
        //     // $('#result_'+result[i].item.id)[0].dataset.score=result[i].score;//addScore/100+result[i].score
        // }

        // for(i=0;i<result.length;i++)
        // {
        //     $('#result_'+result[i].item.id).show();
        // }


        // sort html elements
        var $wrapper = $('.searchbrowser');

        $wrapper.find('.searchresult').sort(
            function (a, b)
            {
                return b.dataset.score - a.dataset.score;
            }).appendTo( $wrapper );
        //
        Navigate(0);



        // show highlights

        // clearTimeout(markHighlightTimeout);
        // markHighlightTimeout=setTimeout(function(_result)
        // {
        //     for(var i=0;i<_result.length;i++)
        //     {
        //         // $('#_result_'+i+' .score').html(_result[i].score+'!');
        //
        //
        //         $('#_result_'+i+' .namespace').html(_result[i].item.nameSpace);
        //         $('#_result_'+i+' .summary').html(_result[i].item.summary);
        //         $('#_result_'+i+' .shortname').html(_result[i].item.shortName);
        //
        //         for(var m=0;m<_result[i].matches.length;m++)
        //         {
        //             var match=_result[i].matches[m];
        //             if(match.key=='shortName')CABLES.UI.OPSELECT.showHighlights(_result[i].item,match,'shortname',_result[i].item.shortName);
        //             if(match.key=='summary')CABLES.UI.OPSELECT.showHighlights(_result[i].item,match,'summary',_result[i].item.summary);
        //             if(match.key=='nameSpace')CABLES.UI.OPSELECT.showHighlights(_result[i].item,match,'namespace',_result[i].item.nameSpace);
        //         }
        //     }
        // }(result),200);


        // console.log('time handle', (Date.now()-time)/1000);
        // console.log('time html', (Date.now()-time)/1000);

        // var searchFor= $('#opsearch').val();
        //
        // if(searchFor==='') $('#clearsearch').hide();
        //     else
        //     $('#clearsearch').show();
        //
        // if(!searchFor) $('#search_style').html('.searchable:{display:block;}');
        //     else $('#search_style').html(".searchable:not([data-index*=\"" + searchFor.toLowerCase() + "\"]) { display: none; }");
        //
        // CABLES.UI.OPSELECT.updateOptions();
    }

    CABLES.UI.OPSELECT.linkNewLink=link;
    CABLES.UI.OPSELECT.linkNewOpToPort=linkPort;
    CABLES.UI.OPSELECT.linkNewOpToOp=linkOp;
    CABLES.UI.OPSELECT.newOpPos=options;

    if(options.search)
    {
        $('#opsearch').val(options.search);
        search();
    }

    if(!CABLES.UI.OPSELECT.list)
    {
        CABLES.UI.OPSELECT.list=CABLES.UI.OPSELECT.getOpList();

        // list=CABLES.UI.OPSELECT.getOpList();

        for(var i=0;i<CABLES.UI.OPSELECT.list.length;i++)
        {
            CABLES.UI.OPSELECT.list[i].id=i;
            CABLES.UI.OPSELECT.list[i].summary=CABLES.UI.OPSELECT.list[i].summary||'';
            CABLES.UI.OPSELECT.list[i]._summary=CABLES.UI.OPSELECT.list[i].summary.toLowerCase();
            CABLES.UI.OPSELECT.list[i]._shortName=CABLES.UI.OPSELECT.list[i].shortName.toLowerCase();
            CABLES.UI.OPSELECT.list[i]._nameSpace=CABLES.UI.OPSELECT.list[i].nameSpace.toLowerCase();
        }

        // CABLES.UI.OPSELECT.fuse = new Fuse(list,
        // {
        //     shouldSort: true,
        //     tokenize: false,
        //     threshold: 0.1,
        //     location: 0,
        //     distance: 100,
        //     maxPatternLength: 32,
        //     minMatchCharLength: 3,
        //     include: ["matches","score"],
        //     keys: [
        //       { name:"shortName", weight:0.6 },
        //       { name:"summary", weight:0.2 },
        //       { name:"nameSpace", weight:0.2 },
        //     ]
        // });
    }


    // console.log(CABLES.UI.OPSELECT.getOpList());

    var html = CABLES.UI.getHandleBarHtml('op_select',{ops: CABLES.UI.OPSELECT.list });
    CABLES.UI.MODAL.showTop(html);

    $('#clearsearch').hide();
    $('#opsearch').focus();

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

    this.clear=function()
    {
        var v=$('#opsearch').val();

        if(v.indexOf('.')>0)
        {
            var arr=v.split('.');
            arr.length=arr.length-1;
            v=arr.join('.');

            if(v=='Ops') v='';

            $('#opsearch').val(v);
            search();
        }
        else
        {
            $('#opsearch').val('');
            search();
        }
    };

    this.searchTimeout=0;
    this.searchFor=function(what)
    {
        $('#opsearch').val(what);
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

        updateInfo();

        // clearTimeout(this.searchTimeout);
        // this.searchTimeout=setTimeout( search,75);

        search();

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
                        op.pop=gui.opDocs.getPopularity(opname);
                        op.summary=gui.opDocs.getSummary(opname);
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
        return b.pop-a.pop;
        // return a.name.length - b.name.length; // ASC -> a - b; DESC -> b - a
    });


    return ops;
};
