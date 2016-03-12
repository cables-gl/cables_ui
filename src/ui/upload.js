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
                gui.jobs().start({id:'processingfiles',title:'processing files...'});
                gui.jobs().finish('uploadingfiles');
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

        gui.patch().updateProjectFiles();
        if (xhr.status === 200)
        {
            res=JSON.parse(e.target.response);
            CABLES.UI.MODAL.hide();
            gui.jobs().finish('uploadingfiles');
        }
        else
        {
            res=JSON.parse(e.target.response);
            msg=res.msg;
            gui.jobs().finish('uploadingfiles');

            CABLES.UI.MODAL.show('upload error (' + xhr.status +') :'+msg);
        }
    };

    xhr.send(formData);

});
