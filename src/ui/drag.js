CABLES = CABLES || {};

CABLES.dragImage = new Image();
CABLES.dragImage.src = "/ui/img/dragicon.png";

CABLES.DragNDrop = function ()
{
    this.internal = false;
};

CABLES.DragNDrop.startDragLibraryFile = function (_event, p)
{
    _event.dataTransfer.setData("filepath", p);
    const self = this;

    _event.dataTransfer.setDragImage(CABLES.dragImage, 10, 10);

    CABLES.unBindUploadDragNDrop();

    function dragover(event)
    {
        self.internal = true;
        CABLES.unBindUploadDragNDrop();

        event.preventDefault();
        event.stopPropagation();
    }

    function dragleave(event)
    {
        self.internal = false;
        CABLES.unBindUploadDragNDrop();

        event.preventDefault();
        event.stopPropagation();
    }

    function drop(event)
    {
        if (!self.internal)
        {
            console.log("not internal!");
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        const filepath = event.originalEvent.dataTransfer.getData("filepath");
        console.log(filepath);

        gui.patch().addAssetOpAuto(filepath, event.originalEvent);

        $("#patch").off("drop", drop);
        $("#patch").off("dragover", dragover);
        $("#patch").off("dragleave", dragleave);
        $("#patch").off("dragend", dragleave);

        CABLES.unBindUploadDragNDrop();
        CABLES.bindUploadDragNDrop();
        self.internal = false;
    }

    $("#patch").on("dragover", dragover);
    $("#patch").on("dragleave", dragleave);
    $("#patch").on("dragend", dragleave);
    $("#patch").on("drop", drop);
};
