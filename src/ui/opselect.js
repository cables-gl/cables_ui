CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.OPSELECT={};
CABLES.UI.OPSELECT.linkNewLink=null;
CABLES.UI.OPSELECT.linkNewOpToPort=null;
CABLES.UI.OPSELECT.linkNewOpToOp=null;
CABLES.UI.OPSELECT.newOpPos={x:0,y:0};
CABLES.UI.OPSELECT.maxPop=0;

CABLES.UI.OpSelect=function()
{
    this._list=null;
    this.displayBoxIndex=0;
    this.itemHeight=0;
    this.firstTime=true;
    this.tree=new CABLES.OpTree();
};

CABLES.UI.OpSelect.prototype.updateOptions=function(opname)
{
    var num=$('.searchbrowser .searchable:visible').length;

    var query=$('#opsearch').val();

    if(query.length===0) $('#search_startType').show();
    else $('#search_startType').hide();

    if(query.length==1) $('#search_startTypeMore').show();
    else $('#search_startTypeMore').hide();


    if(num===0 && query.length>1)
    {
        $('#search_noresults').show();
        $('#searchinfo').empty();
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
        optionsHtml+='&nbsp;&nbsp;|&nbsp;&nbsp;<i class="fa fa-lock"/> <a onclick="gui.serverOps.edit(\''+opname+'\');">edit op</a>';
    }

    var score=Math.round(100*$('.selected').data('score'))/100;
    if(score && score==score)
    {
        optionsHtml+='&nbsp;&nbsp;|&nbsp;&nbsp;<span class="tt" data-tt="'+$('.selected').data('scoreDebug')+'">';
        optionsHtml+='score: '+score;
        optionsHtml+='</span>';
    }

    $('#opOptions').html(optionsHtml);
};

CABLES.UI.OpSelect.prototype._searchWord=function(list,query)
{
    var result=[];

    for(var i=0;i<list.length;i++)
    {
        var scoreDebug=query+' - '+list[i]._shortName+'<br/><br/>';

        var found=false;
        var points=0;

        if(list[i]._summary.indexOf(query)>-1)
        {
            found=true;
            points+=1;
            scoreDebug+='+1 summary<br/>';
        }

        if(list[i]._nameSpace.indexOf(query)>-1)
        {
            found=true;
            points+=1;
            scoreDebug+='+1 namespace<br/>';
        }


        // if(list[i]._nameSpaceFull.indexOf(query)>-1)
        // {
        //     found=true;
        //     points+=0.1;
        //     scoreDebug+='+1 namespacefull<br/>';
        // }

        if(list[i]._shortName.indexOf(query)>-1)
        {
            found=true;
            points+=4;
            scoreDebug+='+1 shortname<br/>';
        }

        if(list[i]._shortName.indexOf(query)===0)
        {
            found=true;
            points+=2;
            scoreDebug+='+1 shortname at beginning<br/>';
        }

        if(found)
        {
            if(list[i]._summary.length>0)
            {
                points+=0.5;
                scoreDebug+='+0.5 has summary<br/>';
            }
            if(list[i]._nameSpace.indexOf("ops.math")>-1)
            {
                points+=1;
                scoreDebug+='+1 is math<br/>';
            }
        }

        if(found && list[i].pop>0)
        {
            points+=(list[i].pop||2)/CABLES.UI.OPSELECT.maxPop||1;
            result.push(list[i]);
        }

        if(points===0 && list[i].score>0) list[i].score=0;
            else list[i].score+=points;

        list[i].scoreDebug=scoreDebug;
    }

    return result;
};

CABLES.UI.OpSelect.prototype._search=function(q)
{
    if(!this._list || !this._html)this.prepare();

    this.firstTime=false;
    q=q||'';
    var query=q.toLowerCase();

    var i=0;
    for(i=0;i<this._list.length;i++)
    {
        this._list[i].score=0;
    }
    var result=null;

    if(query.length>1)
    {
        if(query.indexOf(" ")>-1)
        {
            var words=query.split(" ");

            for(i=0;i<words.length;i++)
            {
                result=this._searchWord(result||this._list,words[i]);
            }
        }
        else
        {
            result=this._searchWord(this._list,query);
        }

    }

    return result;
};

CABLES.UI.OpSelect.prototype.updateInfo=function()
{
    var opname=$('.selected').data('opname');
    var htmlFoot='';

    this.updateOptions(opname);

    if(opname)
    {
        $('#searchinfo').empty();


        var content=gui.opDocs.get(opname);

        if(content.length<3)
        {
            content="<h1>"+opname.split(".")[opname.split(".").length-1]+"</h1>";
            content+='<p><em>'+opname+'</em></p>';
            content+='<p>'+gui.opDocs.getSummary(opname)+'</p>';
        }

        $('#searchinfo').html('<div id="opselect-layout"></div>'+content+htmlFoot);
        gui.opDocs.opLayoutSVG(opname,"opselect-layout");
    }
};





CABLES.UI.OpSelect.prototype.search=function()
{
    var result=this._search($('#opsearch').val());

    var i=0;
    var html='';

    for(i=0;i<this._list.length;i++)
    {
		this._list[i].element=$('#result_'+this._list[i].id);

        if(this._list[i].score>0)
        {
            this._list[i].element.show();
            this._list[i].element[0].dataset.score=this._list[i].score;
            this._list[i].element[0].dataset.scoreDebug=this._list[i].scoreDebug;

        }
        else
        {
            this._list[i].element[0].dataset.score=0.0;
            this._list[i].element.hide();
        }
    }

    // sort html elements
    var $wrapper = $('.searchbrowser');

    $wrapper.find('.searchresult').sort(
        function (a, b)
        {
            return b.dataset.score - a.dataset.score;
        }).appendTo( $wrapper );

    this.Navigate(0);
};

CABLES.UI.OpSelect.prototype.Navigate = function(diff)
{
    this.displayBoxIndex += diff;

    if (this.displayBoxIndex < 0) this.displayBoxIndex = 0;
    var oBoxCollection = $(".searchresult:visible");
    var oBoxCollectionAll = $(".searchresult");
    if (this.displayBoxIndex >= oBoxCollection.length) this.displayBoxIndex = oBoxCollection.length-1;
    if (this.displayBoxIndex < 0) this.displayBoxIndex = oBoxCollection.length - 1;

    var cssClass = "selected";

    oBoxCollectionAll.removeClass(cssClass);
    oBoxCollection.removeClass(cssClass).eq(this.displayBoxIndex).addClass(cssClass);

    if(this.displayBoxIndex>7) $('.searchbrowser').scrollTop( (this.displayBoxIndex-7)*(this.itemHeight+1) );
        else $('.searchbrowser').scrollTop( 1 );

    this.updateInfo();
};

CABLES.UI.OpSelect.prototype.close=function()
{
    // console.log('opselect close');
    $('body').off( "keydown", this.keyDown);
};


CABLES.UI.OpSelect.prototype.reload=function()
{
    this._list=null;
    this._html=null;
};

CABLES.UI.OpSelect.prototype.prepare=function()
{
    if(!this._list)
    {
        this._list=this.getOpList();

        // list=CABLES.UI.OPSELECT.getOpList();
        var maxPop=0;

        for(var i=0;i<this._list.length;i++)
        {
            maxPop=Math.max(this._list[i].pop||0,maxPop);
            this._list[i].id=i;
            this._list[i].summary=this._list[i].summary||'';
            this._list[i]._summary=this._list[i].summary.toLowerCase();
            this._list[i]._shortName=this._list[i].shortName.toLowerCase();
            this._list[i]._nameSpace=this._list[i].nameSpace.toLowerCase();
            this._list[i]._nameSpaceFull=this._list[i].nameSpace.toLowerCase()+'.'+this._list[i].shortName.toLowerCase();
        }

        CABLES.UI.OPSELECT.maxPop=maxPop;
    }

    if(!this._html)
    {
        var head = CABLES.UI.getHandleBarHtml('op_select');

        $('#opsearchmodal').html(head);

        this._html = CABLES.UI.getHandleBarHtml('op_select_ops',{ops: this._list });
        $('#searchbrowserContainer').html(this._html);

        $('#opsearch').on('input',this.onInput.bind(this));


    }

};

CABLES.UI.OpSelect.prototype.show=
CABLES.UI.OpSelect.prototype.showOpSelect=function(options,linkOp,linkPort,link)
{

    var markHighlightTimeout=0;
    var self=this;

    CABLES.UI.OPSELECT.linkNewLink=link;
    CABLES.UI.OPSELECT.linkNewOpToPort=linkPort;
    CABLES.UI.OPSELECT.linkNewOpToOp=linkOp;
    CABLES.UI.OPSELECT.newOpPos=options;


    if(options.search)
    {
        $('#opsearch').val(options.search);
        this.search();
    }
    if(this.firstTime)this.search();

    if(!this._list || !this._html)this.prepare();

    $('#search_noresults').hide();

    CABLES.UI.MODAL.show(null,
        {
            "title":null,
            "element":'#opsearchmodal',
            "transparent":true,
            "onClose":this.close
        });


    $('#opsearch').focus();
    $('#opsearch').select();
    $('body').on( "keydown", this.keyDown.bind(this));
    // $( ".searchresult:first" ).addClass( "selected" );


    if(this.itemHeight===0)this.itemHeight=$( ".searchresult:first" ).outerHeight();

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
            this.search();
        }
        else
        {
            $('#opsearch').val('');
            this.search();
        }
    };

    this.selectOp=function(name)
    {
        var oBoxCollectionAll = $(".searchresult");

        oBoxCollectionAll.removeClass('selected');
        $('.searchresult[data-opname="'+name+'"]').addClass('selected');
        // oBoxCollection.removeClass(cssClass).eq(this.displayBoxIndex).addClass('selected');

        this.updateInfo();
    };




    // var t=new CABLES.Tree();
    $('#optree').html(this.tree.html());



    setTimeout(function(){$('#opsearch').focus();},50);
};

CABLES.UI.OpSelect.prototype.searchFor=function(what)
{
	$('#opsearch').val(what);
    this.onInput();
};

CABLES.UI.OpSelect.prototype.onInput=function(e)
{
    this.displayBoxIndex=0;
    this.updateInfo();
    this.search();
};

CABLES.UI.OpSelect.prototype.keyDown=function(e)
{
    switch(e.which)
    {
        case 27:
            this.close();
            e.preventDefault();
        break;

        case 13:
            console.log( $('.selected') );

            var opname=$('.selected').data('opname');

            if(opname && opname.length>2)
            {
                CABLES.UI.MODAL.hide();
                gui.serverOps.loadOpLibs(opname,function()
                {
                    gui.scene().addOp(opname);
                });
            }

            e.preventDefault();
        break;

        case 8:
            this.onInput();
            // e.preventDefault();
            return true;
        case 38: // up
            $('.selected').removeClass('selected');
            e.preventDefault();
            this.Navigate(-1);
        break;

        case 40: // down
            $('.selected').removeClass('selected');
            e.preventDefault();
            this.Navigate(1);
        break;

        default: return; // exit this handler for other keys
    }
     // prevent the default action (scroll / move caret)
};

CABLES.UI.OpSelect.prototype.getOpList=function()
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

                    if(typeof(CABLES.Patch.getOpClass(opname))=="function") isFunction=true;

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
