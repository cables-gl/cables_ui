CABLES = CABLES || {};


CABLES.DragNDrop = function ()
{
    this.internal = false;
};

CABLES.DragNDrop.loadImage = function (_event, p)
{
    if (!CABLES.dragImage)
    {
        CABLES.dragImage = new Image();
        CABLES.dragImage.src = "/ui/img/dragicon.png";
    }
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

        const filepath = event.dataTransfer.getData("filepath");
        console.log(filepath);

        // gui.patch().addAssetOpAuto(filepath, event);
        gui.patchView.addAssetOpAuto(filepath, event);

        document.getElementById("patchviews").removeEventListener("drop", drop);
        document.getElementById("patchviews").removeEventListener("dragover", dragover);
        document.getElementById("patchviews").removeEventListener("dragleave", dragleave);
        document.getElementById("patchviews").removeEventListener("dragend", dragleave);

        CABLES.unBindUploadDragNDrop();
        CABLES.bindUploadDragNDrop();
        self.internal = false;
    }

    document.getElementById("patchviews").addEventListener("dragover", dragover);
    document.getElementById("patchviews").addEventListener("dragleave", dragleave);
    document.getElementById("patchviews").addEventListener("dragend", dragleave);
    document.getElementById("patchviews").addEventListener("drop", drop);
};
