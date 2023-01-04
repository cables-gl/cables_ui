

export default function DragNDrop()
{
    this.internal = false;
}

DragNDrop.loadImage = function (_event, p)
{
    if (!CABLES.dragImage)
    {
        CABLES.dragImage = new Image();
        // image file: /ui/img/dragicon.png
        CABLES.dragImage.src = "data:image;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAfCAQAAAC7DqDdAAABpUlEQVR4Ad3BO24bVxQA0HM5l6YUqbBV+FMEiJtsJa0b7yMrMwJVqbKMVAFS+wsHMEUNqXk3GMsT2ohq0Zxz8tc/Hz3ZfSqBwgO937zzwnNrlDBKg0vvvXShV8KttHPpo5X71XvkF50B3fnV67w4+8nm3BdlZWNh57Hn/rG3stYMHvvR2t4DvU5z35rOMytbYenDWW5d6Y1KoFwrC1sb1yhhNOiFsLVxbVQCg145hNIrO9zYSkIhhP8rgfK1Ugjh8MokU1oalcDSTiid1AmTpRuUtLS0t9QcTphkKYUSGpoyKqWUSdOMmqYJhVCa5nDKJC+lQgmj0PQe+t0fmkkJZeMHr6RSRqEENk4cRpjkW4OwV8Kp9M4gfOvUwhtN2Cvh1EI5rDxxl+bEXcqpu5RDCqQZKKRZKGkWQpqJNBNpJtJMpJlIM5FmIh2xUibpiIUwSbNQ0iyEdNTKJLcG4VsrC+UYhFEgf3ZmsLcw+MtW5/tXbhXyqQs7JZRA2vlb0/n+hb28duVGIYw6O+X4pM9CKaEQjlH6Tzg+ZZLWzn2CcqscnXPrfwGXq56tCOJVBgAAAABJRU5ErkJggg==";
    }
};

DragNDrop.startDragLibraryFile = function (_event, p)
{
    _event.dataTransfer.setData("filepath", p);
    const self = this;

    _event.dataTransfer.setDragImage(CABLES.dragImage, 10, 10);

    CABLES.fileUploader.unBindUploadDragNDrop();

    function dragover(event)
    {
        self.internal = true;
        CABLES.fileUploader.unBindUploadDragNDrop();

        event.preventDefault();
        event.stopPropagation();
    }

    function dragleave(event)
    {
        self.internal = false;
        CABLES.fileUploader.unBindUploadDragNDrop();

        event.preventDefault();
        event.stopPropagation();
    }

    function drop(event)
    {
        if (!self.internal)
        {
            console.warn("not internal!");
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        const filepath = event.dataTransfer.getData("filepath");

        gui.patchView.addAssetOpAuto(filepath, event);

        document.getElementById("patchviews").removeEventListener("drop", drop);
        document.getElementById("patchviews").removeEventListener("dragover", dragover);
        document.getElementById("patchviews").removeEventListener("dragleave", dragleave);
        document.getElementById("patchviews").removeEventListener("dragend", dragleave);

        CABLES.fileUploader.unBindUploadDragNDrop();
        CABLES.fileUploader.bindUploadDragNDrop();
        self.internal = false;
    }

    document.getElementById("patchviews").addEventListener("dragover", dragover);
    document.getElementById("patchviews").addEventListener("dragleave", dragleave);
    document.getElementById("patchviews").addEventListener("dragend", dragleave);
    document.getElementById("patchviews").addEventListener("drop", drop);
};
