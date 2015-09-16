//http://html5doctor.com/drag-and-drop-to-server/

$("html").on("dragover", function(event)
{
    event.preventDefault();
    event.stopPropagation();
    $(this).addClass('dragging');
    CABLES.UI.MODAL.show("drop files to upload!");
    jQuery.event.props.push('dataTransfer');
});

$("html").on("dragleave", function(event)
{
    event.preventDefault();
    event.stopPropagation();
    $(this).removeClass('dragging');
});

$("html").on("drop", function(event)
{
    event.preventDefault();
    event.stopPropagation();

    CABLES.UI.MODAL.showLoading("uploading");

    var files = event.dataTransfer.files;
    var url='/api/project/'+ui.getCurrentProject()._id+'/file';

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
            CABLES.UI.MODAL.showLoading('uploading ' + complete + '%');
        }
    };

    xhr.onload = function ()
    {
        ui.updateProjectFiles();
        if (xhr.status === 200)
        {
            CABLES.UI.MODAL.hide();
        }
        else
        {
            CABLES.UI.MODAL.show('upload error: ' + xhr.status);
        }
    };

    xhr.send(formData);

});
