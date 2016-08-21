//http://html5doctor.com/drag-and-drop-to-server/


$("body").on("dragover", function(event)
{
    event.preventDefault();
    event.stopPropagation();
    $(this).addClass('dragging');
    // $('body').css('pointer-events','none');

    CABLES.UI.MODAL.show("drop files to upload!");
    jQuery.event.props.push('dataTransfer');
    // console.log('over');

});

$("body").on("dragleave", function(event)
{
    $(this).removeClass('dragging');
    // $(this).css('pointer-events','all');
    // $('body').css('pointer-events','all');
    // console.log('leave');
    // CABLES.UI.MODAL.hide();
    event.preventDefault();
    event.stopPropagation();

});

$("body").on("drop", function(event)
{
    event.preventDefault();
    event.stopPropagation();

    // CABLES.UI.MODAL.showLoading("uploading");
    CABLES.UI.MODAL.hide();
    gui.jobs().start({id:'uploadingfiles',title:'uploading files...'});

    var files = event.dataTransfer.files;
    var url='/api/project/'+gui.patch().getCurrentProject()._id+'/file';

    var formData = new FormData();
    $.each(files, function(key, value)
    {
        formData.append(key, value);
    });

    // now post a new XHR request
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    xhr.upload.onprogress = function (event)
    {
        if (event.lengthComputable)
        {
            var complete = (event.loaded / event.total * 100 | 0);
            if(complete==100)
            {
                // gui.jobs().start({id:'processingfiles',title:'processing files...'});
                gui.jobs().finish('uploadingfiles');

                // console.log(files);
                setTimeout(function()
                {
                    for(var i in files)
                    {
                        var file=files[i];
                        if(!file || !file.name || file.name=='item')continue;
                        for(var j=0;j<gui.patch().ops.length;j++)
                        {
                            if(gui.patch().ops[j].op && gui.patch().ops[j].op.onFileUploaded)
                            {
                                gui.patch().ops[j].op.onFileUploaded(files[i].name);
                            }
                        }
                    }

                },800);

            }
            else
            {
                gui.jobs().update({id:'uploadingfiles',title:'uploading: '+complete+'%'});
            }
        }
    };

    xhr.onload = function (e,r)
    {

        var msg='';
        var res='';

        console.log(e.target.response);
        try
        {
            res=JSON.parse(e.target.response);
        }
        catch(ex)
        {
            console.log(ex);
        }

        gui.updateProjectFiles();
        if (xhr.status === 502)
        {
            console.log('ajax 502 error ! possibly upload ?');
            CABLES.UI.MODAL.hide();
            gui.jobs().finish('uploadingfiles');
            return;
        }

        if (xhr.status === 200)
        {
            CABLES.UI.MODAL.hide();
            gui.jobs().finish('uploadingfiles');
        }
        else
        {
            if(res.msg) msg=res.msg;
            gui.jobs().finish('uploadingfiles');

            CABLES.UI.MODAL.show('upload error (' + xhr.status +') :'+msg);
        }
    };

    xhr.send(formData);

});
