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
            if(complete==100) CABLES.UI.MODAL.showLoading('processing files... ');
                else CABLES.UI.MODAL.showLoading('uploading ' + complete + '%');
        }
    };

    xhr.onload = function (e,r)
    {

        var msg='';
        var res='';

        gui.patch().updateProjectFiles();
        if (xhr.status === 200)
        {
            // console.log('e',r);
            res=JSON.parse(e.target.response);
            msg="<h2>files uploaded</h2>";
            msg+='<table>';

            for(var i=0;i<res.log.length;i++)
            {
                gui.patch().onUploadFile(res.log[i].filename);

                msg+='<tr>';
                msg+='<td>';
                if(!res.log[i].success) msg+='FAIL';
                msg+='</td>';
                msg+='<td>';
                msg+=res.log[i].filename;
                msg+='</td>';
                msg+='<td>';
                msg+=''+res.log[i].msg;
                msg+='</td>';
                msg+='<td>';
                msg+=''+res.log[i].filesize;
                msg+='</td>';
                msg+='</tr>';
            }
            msg+='</table>';
            // CABLES.UI.MODAL.show(msg);
            CABLES.UI.MODAL.hide();
        }
        else
        {
            res=JSON.parse(e.target.response);
            msg=res.msg;

            CABLES.UI.MODAL.show('upload error (' + xhr.status +') :'+msg);
        }
    };

    xhr.send(formData);

});
