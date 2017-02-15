
var CABLES=CABLES||{};


CABLES.dragImage = new Image();
CABLES.dragImage.src = '/img/dragicon.png';


CABLES.DragNDrop=function()
{
    this.internal=false;
};

CABLES.DragNDrop.startDragLibraryFile=function(event,p)
{
    event.dataTransfer.setData("filepath", p);
    var self=this;

    event.dataTransfer.setDragImage(CABLES.dragImage,10,10);

    CABLES.unBindUploadDragNDrop();

    function dragover(event)
    {
        self.internal=true;
        CABLES.unBindUploadDragNDrop();

        event.preventDefault();
        event.stopPropagation();
    }

    function dragleave(event)
    {
        self.internal=false;
        CABLES.unBindUploadDragNDrop();

        event.preventDefault();
        event.stopPropagation();
    }

    function drop(event)
    {
        if(!self.internal)return;
        event.preventDefault();
        event.stopPropagation();

        var filepath = event.originalEvent.dataTransfer.getData("filepath");
        console.log(filepath);

        gui.patch().addAssetOpAuto(filepath,event.originalEvent);

        $("#patch").off("drop",drop);
        $("#patch").off("dragover",dragover);
        $("#patch").off("dragleave", dragleave);
        $("#patch").off("dragend", dragleave);
        CABLES.bindUploadDragNDrop();
        self.internal=false;
    }

    $("#patch").on("dragover", dragover);
    $("#patch").on("dragleave", dragleave);
    $("#patch").on("dragend", dragleave);
    $("#patch").on("drop", drop);
};
