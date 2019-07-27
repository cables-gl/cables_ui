//http://html5doctor.com/drag-and-drop-to-server/

var CABLES=CABLES||{};
CABLES.UI = CABLES.UI||{};

CABLES.handleFileInputUpload=function(files)
{
    CABLES.uploadFiles(files);
    gui.showFileManager();
    // CABLES.UI.fileSelect.load();
    // CABLES.UI.fileSelect.show();
};

CABLES.uploadSelectFile=function()
{
	CABLES.CMD.PATCH.uploadFile();
};



CABLES.uploadDragOver=function(event)
{
    CABLES.uploadDropEvent=event.originalEvent;

    if(CABLES.DragNDrop.internal)
    {
        console.log('cancel because internal');
        return;
    }

    event.preventDefault();
    event.stopPropagation();
    
    var el = document.getElementById("uploadarea");
    if(el)
    {
        if (event.target.classList.contains("uploadarea")) el.classList.add("uploadareaActive");
            else el.classList.remove("uploadareaActive");
    }

    var openDialog=true;
    
    if(el) openDialog = window.getComputedStyle(el).display === 'none';
    if(openDialog) CABLES.CMD.PATCH.uploadFileDialog();
    
    jQuery.event.props.push('dataTransfer');

};

CABLES.uploadDragLeave=function(event)
{
    $(this).removeClass('dragging');

    event.preventDefault();
    event.stopPropagation();
};

CABLES.uploadFiles=function(files)
{
    var url='/api/project/'+gui.patch().getCurrentProject()._id+'/file';

    var formData = new FormData();
    $.each(files, function(key, value)
    {
        formData.append(key, value);
    });

    console.log(files);

    // now post a new XHR request
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    xhr.upload.onprogress = function (event)
    {
        $('#uploadprogresscontainer').css({"opacity":1.0});
        $('#uploadprogresscontainer').show();
        if (event.lengthComputable)
        {
            var complete = (event.loaded / event.total * 100 | 0);
            $('#uploadprogress').css({width:complete+'%'});
            if(complete==100)
            {
                // gui.jobs().start({id:'processingfiles',title:'processing files...'});
                gui.jobs().finish('uploadingfiles');

                CABLES.UI.notify("File Uploaded");
                $('#uploadprogresscontainer').css({"opacity":0.5});

                // console.log(files);
                setTimeout(function()
                {
                    for(var i in files)
                    {
                        var file=files[i];
                        if(!file || !file.name || file.name=='item')continue;

                        gui.refreshFileManager();

                        // CABLES.UI.fileSelect.triggerFileUpdate(files[i].name);
                    }
                    $('#uploadprogresscontainer').hide();

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

        // console.log(e.target.response);

        try
        {
            res=JSON.parse(e.target.response);
        }
        catch(ex)
        {
            console.log(ex);
        }

        // CABLES.UI.fileSelect.load();
        // CABLES.UI.fileSelect.show();
        gui.showFileManager();

        gui.patch().addAssetOpAuto('/assets/'+gui.patch().getCurrentProject()._id+'/'+res.filename,CABLES.uploadDropEvent);

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

        if(res.hasOwnProperty("success") && !res.success)
        {
            CABLES.UI.MODAL.show('upload error: '+res.msg);
        }

    };

    xhr.send(formData);

};

CABLES.uploadDropEvent=null;

CABLES.uploadDrop=function(event)
{
    event.preventDefault();
    event.stopPropagation();

    CABLES.UI.MODAL.hide();
    gui.jobs().start({id:'uploadingfiles',title:'uploading files...'});

    if(event.dataTransfer.files.length===0)
    {
        console.log('no files to upload...');
        return;
    }
    var files = event.dataTransfer.files;

    CABLES.uploadFiles(files);

};

CABLES.bindUploadDragNDrop=function()
{
    $("body").on("drop", CABLES.uploadDrop);
    $("body").on("dragover",CABLES.uploadDragOver );
    $("body").on("dragleave",CABLES.uploadDragLeave);
};

CABLES.unBindUploadDragNDrop=function()
{
    $("body").off("drop",CABLES.uploadDrop);
    $("body").off("dragover",CABLES.uploadDragOver);
    $("body").off("dragleave",CABLES.uploadDragLeave);
};

CABLES.bindUploadDragNDrop();
