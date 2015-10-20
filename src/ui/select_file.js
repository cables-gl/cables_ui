CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};


CABLES.UI.FileSelect=function()
{
    var currentTab='';
    var assetPath='';
    var apiPath='';
    var inputId='';
    var filterType='';

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
        console.log('val',val);
                
        var opts={};

        if(val.endsWith('.jpg') || val.endsWith('.png'))
        {
            opts.previewImageUrl=val;
        }

        var html= CABLES.UI.getHandleBarHtml('library_preview',opts);

        $('#lib_preview').html( html );

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
                        if(filterType=='image')continue;
                        files[i].selectableClass='unselectable';
                    }
                }

                if(!files[i].p)files[i].p=p+files[i].n;


                html+= CABLES.UI.getHandleBarHtml('library_file',{file: files[i],inputId:inputId,filterType:filterType });
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

                $('#lib_files').html(html);
                        
            });

    };


};

CABLES.UI.fileSelect=new CABLES.UI.FileSelect();