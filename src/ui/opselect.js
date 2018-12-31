CABLES=CABLES || {};
CABLES.UI=CABLES.UI || {};

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
    this._sortTimeout=0;
    this._backspaceDelay=-1;

    this._eleSearchinfo=null
};

CABLES.UI.OpSelect.prototype.updateOptions=function(opname)
{
    var perf = CABLES.uiperf.start('opselect.udpateOptions');

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
        var userOpName='Ops.User.'+gui.user.usernameLowercase+'.'+$('#opsearch').val();
        $('.userCreateOpName').html(userOpName);
        $('#createuserop').attr('onclick','gui.serverOps.create(\''+userOpName+'\');');
    }
    else $('#search_noresults').hide();

    var optionsHtml='&nbsp;found '+num+' ops. in '+(Math.round(this._timeUsed)||0)+'ms ';

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
    perf.finish();
};

CABLES.UI.OpSelect.prototype._searchWord=function(list,query,options)
{
    var perf = CABLES.uiperf.start('opselect._searchWord');

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
            scoreDebug+='+1 found in summary<br/>';
        }

        if(list[i]._nameSpace.indexOf(query)>-1)
        {
            found=true;
            points+=1;
            scoreDebug+='+1 found in namespace<br/>';
        }

        if(list[i]._shortName.indexOf(query)>-1)
        {
            found=true;
            points+=4;
            scoreDebug+='+4 found in shortname<br/>';
        }

        if(points==0)
        {
            if(list[i]._lowerCaseName.indexOf(query)>-1)
            {
                found=true;
                points+=2;
                scoreDebug+='+2 found full namespace<br/>';
            }
        }

        if(found)
        {
            if(list[i]._shortName.indexOf(query)===0)
            {
                points+=2.5;
                scoreDebug+='+2.5 found in shortname at beginning<br/>';

                if(list[i]._shortName==query)
                {
                    points+=2;
                    scoreDebug+='+2 exact name<br/>';
                }
            }

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

            var shortnessPoints=Math.round( (1.0-Math.min(1,(list[i]._nameSpace+list[i]._shortName).length/100))*100)/100;
            points+=shortnessPoints;
            scoreDebug+='+'+shortnessPoints+' shortness namespace<br/>';
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

    perf.finish();

    return result;
};

CABLES.UI.OpSelect.prototype._search=function(q)
{
    if(!this._list || !this._html)this.prepare();

    this.firstTime=false;
    q=q||'';
    var query=q.toLowerCase();

    var i=0;
    for(i=0;i<this._list.length;i++) this._list[i].score=0;
    var result=null;
    var options=
    {
        linkNamespaceIsTextureEffects:false
    };

    if(CABLES.UI.OPSELECT.linkNewOpToOp)
    {
        if(CABLES.UI.OPSELECT.linkNewOpToOp.objName.toLowerCase().indexOf(".textureeffects")>-1 )
            options.linkNamespaceIsTextureEffects=true
    }

    if(query.length>1)
    {
        if(query.indexOf(" ")>-1)
        {
            var words=query.split(" ");

            for(i=0;i<words.length;i++)
            {
                result=this._searchWord(result||this._list,words[i],options);
            }
        }
        else
        {
            result=this._searchWord(this._list,query,options);
        }
    }


    return result;
};

CABLES.UI.OpSelect.prototype.updateInfo=function()
{
    var opname=$('.selected').data('opname');
    var htmlFoot='';

    // setTimeout(function()
        // {
            this.updateOptions(opname);
        // }.bind(this),50);

    if (opname && this._currentSearchInfo!=opname)
    {
        var perf = CABLES.uiperf.start('opselect.updateInfo');

        this._eleSearchinfo = this._eleSearchinfo || document.getElementById("searchinfo");
        this._eleSearchinfo.innerHTML = '';
        // $('#searchinfo').empty();

        // var content=gui.opDocs.get(opname);
        var opDoc = gui.opDocs.get2(opname);

        // var html = '<div id="opselect-layout"><a target="_blank" href="/op/' + ( opname || '' ) + '" class="open-docs-button button button--with-icon">Open Examples Page <i class="icon icon-link"></i></a></div>'+content+htmlFoot;

        var html = '<div id="opselect-layout">';
        html +=        '<a target="_blank" href="/op/' + ( opname || '' ) + '" class="open-docs-button button button--with-icon">Open Examples Page <i class="icon icon-link"></i></a>';
        html +=    '</div>';
        html +=    opDoc;
        html +=    htmlFoot;

        // $('#searchinfo').html(html);
        this._eleSearchinfo.innerHTML = html;
        setTimeout(function()
        {
            gui.opDocs.opLayoutSVG(opname, "opselect-layout"); /* create op-svg image inside #opselect-layout */
        },50);

        perf.finish();
    }
    this._currentSearchInfo = opname;
};


CABLES.UI.OpSelect.prototype.search=function()
{
    var q=$('#opsearch').val();
    // if(q==this.lastQuery)return;
    this.lastQuery=q;
    var result=this._search(q);
    var i=0;


    var perf = CABLES.uiperf.start('opselect.searchLoop');

    for(i=0;i<this._list.length;i++)
    {
        this._list[i].element = this._list[i].element||$('#result_'+this._list[i].id);

        if(this._list[i].score>0)
        {
            this._list[i].element[0].style.display = "block";
            this._list[i].element[0].dataset.score=this._list[i].score;
            this._list[i].element[0].dataset.scoreDebug=this._list[i].scoreDebug;
        }
        else
        {
            this._list[i].element[0].dataset.score=0.0;
            this._list[i].element[0].dataset.scoreDebug='???';
            this._list[i].element[0].style.display = "none";
        }
    }

    // sort html elements
    // var $wrapper = $('.searchbrowser');

    // // sorting takes long time. so do it asynchronous
    // // clearTimeout(this._sortTimeout);
    // // this._sortTimeout=setTimeout(function()
    //     // {
    //         $wrapper.find('.searchresult').sort(
    //             function (a, b)
    //             {
    //                 var diff=parseFloat(b.dataset.score) - parseFloat(a.dataset.score);
    //                 return diff;
    //             }).appendTo( $wrapper );
    //         this.Navigate(0);
    //     // }.bind(this),50);

    tinysort.defaults.order = 'desc';

    clearTimeout(this._sortTimeout);
    this._sortTimeout=setTimeout(
        function()
        {
            tinysort('.searchresult', { data: 'score' });
            this.Navigate(0);
            this.updateOptions();
        }.bind(this),150);


    perf.finish();

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

    if(this.displayBoxIndex>5) $('.searchbrowser').scrollTop( (this.displayBoxIndex-5)*(this.itemHeight+1) );
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
        var maxPop=0;

        for(var i=0;i<this._list.length;i++)
        {
            maxPop=Math.max(this._list[i].pop||0,maxPop);
            this._list[i].id=i;
            this._list[i].summary=this._list[i].summary||'';
            this._list[i]._summary=this._list[i].summary.toLowerCase();
            this._list[i]._shortName=this._list[i].shortName.toLowerCase();
            this._list[i]._lowerCaseName=this._list[i].name.toLowerCase();
            this._list[i]._nameSpace=this._list[i].nameSpace.toLowerCase()+'.';
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

    $('#opsearch').select();
    $('#opsearch').focus();
    $('body').on( "keydown", this.keyDown.bind(this));

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
        this.updateInfo();
    };

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
    // console.log("keydown");
    switch(e.which)
    {
        case 27:
            this.close();
            e.preventDefault();
        break;

        case 13:
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
            if (this._backspaceDelay)
            {
                clearTimeout(this._backspaceDelay);
            }
            
            this._backspaceDelay=setTimeout(function()
            {
                this._backspaceDelay=null;
                this.onInput();
            }.bind(this),300);
                
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

        default: return true; // exit this handler for other keys
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

                    var found=getop(ns,val[propertyName],parentname+propertyName+'.');
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
