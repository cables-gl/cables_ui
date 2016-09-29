CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};


CABLES.UI.FileSelect=function()
{
    var currentTab='';
    var assetPath='';
    var apiPath='';
    var inputId='';
    var filterType='';
    this._viewClass='icon';
    var self=this;

    this.setFile=function(_id,_url)
    {
        $(_id).val(_url);
        $(_id).trigger('input');
        // $(_id).fadeIn(100).fadeOut(100).fadeIn(100).fadeOut(100).fadeIn(100);
        var highlightBg="#fff";
        var originalBg = $(_id).css("background-color");
        $(_id).stop().css("opacity", 0);
        $(_id).animate({"opacity": 1}, 1000);

        // $(_id).animate({backgroundColor:'#fff'}, 300);//.animate({backgroundColor:'#555'}, 100);



        CABLES.UI.fileSelect.showPreview(_url);
    };

    this.setTab=function(which)
    {
        if(which=='projectfiles')
        {
            assetPath='/assets/'+gui.patch().getCurrentProject()._id;
            apiPath='project/'+gui.patch().getCurrentProject()._id+'/files/';
        }
        if(which=='library')
        {
            assetPath='/assets/library/';
            apiPath='library/';
        }

        $('#tab_'+currentTab).removeClass('active');

        currentTab=which;
        this.load();
    };

    this.showPreview=function(val)
    {
        var opts={};

        if(val.endsWith('.jpg') || val.endsWith('.png'))
        {
            opts.previewImageUrl=val;
        }

        var html= CABLES.UI.getHandleBarHtml('library_preview',opts);

        $('#lib_preview').html( html );
    };

    this.setView=function(v)
    {
        this._viewClass=v;
        this.load();
    };

    this.show=function(_inputId,_filterType)
    {
        $('#library').toggle();

        if( $('#library').is(':visible') )
        {
            $('#lib_head').html( CABLES.UI.getHandleBarHtml('library_head') );

            inputId=_inputId;
            filterType=_filterType;

            this.load();

            var val=$(_inputId).val();
            this.showPreview(val);
        }
    };

    this.load=function()
    {
        if(currentTab==='')
        {
            this.setTab('projectfiles');
            return;
        }


$('#lib_files').html('<div style="text-align:center;margin-top:50px;"><i class="fa fa-2x fa-circle-o-notch fa-spin"></i><div>');

        $('#tab_'+currentTab).addClass('active');

        function getFileList(filterType,files,p)
        {
            if(!p)p=assetPath;

            var html='';
            for(var i in files)
            {
                if(!files[i])continue;

                files[i].selectableClass='';
                if(!files[i].d)
                {
                    if(files[i].t==filterType)
                    {
                        files[i].selectableClass='selectable';
                    }
                    else
                    {
                        if(filterType)continue;
                        files[i].selectableClass='unselectable';
                    }
                }

                if(!files[i].p)files[i].p=p+files[i].n;

                html+= CABLES.UI.getHandleBarHtml('library_file_'+self._viewClass,{file: files[i],inputId:inputId,filterType:filterType });
                if(files[i].d )
                {
                    html+=getFileList(filterType,files[i].c,p+files[i].n+'/');
                }
            }
            return html;
        }

        CABLES.api.get(apiPath,function(files)
        {
            var html=getFileList(filterType,files);

            if(html.length===0) html='<div style="margin-top:50px;text-align:center;"><a class="fa fa-upload"></a>&nbsp;no project files yet...<br/><br/>drag & drop files to browser window to upload.</a>';

            $('#lib_files').html(html);
        });

    };


};

CABLES.UI.fileSelect=new CABLES.UI.FileSelect();
