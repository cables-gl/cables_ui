//http://html5doctor.com/drag-and-drop-to-server/

var CABLES=CABLES||{};


CABLES.handleFileInputUpload=function(files)
{
    CABLES.uploadFiles(files);

};

CABLES.uploadSelectFile=function()
{
    var fileElem = document.getElementById("hiddenfileElem");

    if (fileElem)
    {
        console.log('click');
        fileElem.click();
    }
};


CABLES.uploadDragOver=function(event)
{
    CABLES.uploadDropEvent=null;
    if(CABLES.DragNDrop.internal)
    {
        console.log('cancel because internal');
        return;
    }
    console.log('upload dragover');

    event.preventDefault();
    event.stopPropagation();
    $(this).addClass('dragging');

    CABLES.UI.MODAL.show("drop files to upload!");
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

                CABLES.UI.notify("File Uploaded");

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

console.log(1234);

        console.log(e.target.response);

        try
        {
            res=JSON.parse(e.target.response);
        }
        catch(ex)
        {
            console.log(ex);
        }

        // gui.updateProjectFiles();
        CABLES.UI.fileSelect.load();
        CABLES.UI.fileSelect.show();



        console.log(res);

        gui.patch().addAssetOpAuto('/assets/'+gui.patch().getCurrentProject()._id+'/'res.filename,CABLES.uploadDropEvent);


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
    CABLES.uploadDropEvent=event;

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
