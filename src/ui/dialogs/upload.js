//http://html5doctor.com/drag-and-drop-to-server/

var CABLES=CABLES||{};
CABLES.UI = CABLES.UI||{};

CABLES.showingUploadDialog=false;


CABLES.handleFileInputUpload=function(files)
{
    CABLES.uploadFiles(files);
    gui.showFileManager();
};

CABLES.uploadSelectFile=function()
{
	CABLES.CMD.PATCH.uploadFile();
};

CABLES.uploadDragOver=function(event)
{
    // CABLES.uploadDropEvent=event.originalEvent;

    if(CABLES.DragNDrop.internal)
    {
        console.log('cancel because internal');
        return;
    }

    event.preventDefault();
    event.stopPropagation();
    
    // var el = document.getElementById("uploadarea");
    // if(el)
    // {
    //     if (event.target.classList.contains("uploadarea")) el.classList.add("uploadareaActive");
    //         else el.classList.remove("uploadareaActive");
    // }

    
    // if(el) openDialog = window.getComputedStyle(el).display === 'none';
    CABLES.CMD.PATCH.uploadFileDialog();
    
    // jQuery.event.props.push('dataTransfer');
};



CABLES.uploadDrop=function(event)
{
    event.preventDefault();
    event.stopPropagation();

    CABLES.UI.notifyError("Files not uploaded");

    // CABLES.showingUploadDialog=false;
    // CABLES.UI.MODAL.hide();
    // gui.jobs().start({id:'uploadingfiles',title:'uploading files...'});

    // if(event.dataTransfer.files.length===0)
    // {
    //     console.log('no files to upload...');
    //     return;
    // }
    // var files = event.dataTransfer.files;

    // CABLES.uploadFiles(files);
};

CABLES.uploadDragLeave=function(event)
{
    $(this).removeClass('dragging');

    event.preventDefault();
    event.stopPropagation();
    // CABLES.UI.MODAL.hide();
    // console.log("leave");
};

CABLES.uploadDragEnter=function(event)
{
    console.log("Drag enter!");
};

CABLES.bindUploadDragNDrop=function()
{
    $("body").on("drop", CABLES.uploadDrop);
    $("body").on("dragover",CABLES.uploadDragOver );
    $("body").on("dragleave",CABLES.uploadDragLeave);
    window.addEventListener("dragenter",CABLES.uploadDragEnter);
};

CABLES.unBindUploadDragNDrop=function()
{
    $("body").off("drop",CABLES.uploadDrop);
    $("body").off("dragover",CABLES.uploadDragOver);
    $("body").off("dragleave",CABLES.uploadDragLeave);
};

CABLES.bindUploadDragNDrop();
