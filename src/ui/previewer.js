CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.Preview=function()
{
    var interval=50;
    var paused=false;
    this.show=function()
    {
        paused=false;
        var html = CABLES.UI.getHandleBarHtml('preview', {  });
        $('#meta_content_preview').html(html);
        updatePreview();
    };

    this.hide=function()
    {
        paused=true;
        // gl.deleteFramebuffer(framebuffer);
    };

    var previewDataPort=null;
    var previewDataOp=null;

    function updatePreview()
    {
        if(paused || !previewDataOp || !previewDataPort)return;

        var dataUrl=createImageFromTexture(
            previewDataOp.patch.cgl.gl,
            previewDataPort.get().tex,
            previewDataPort.get().width,
            previewDataPort.get().height);

        setTimeout(updatePreview,interval);
    }

    this.setTexture=function(opid,portName)
    {

        previewDataOp=gui.scene().getOpById(opid);
        if(!previewDataOp)
        {
            console.log('opid not found:',opid);
            return;
        }
        previewDataPort=previewDataOp.getPort(portName);
        if(!previewDataPort)
        {
            console.log('port not found:',which);
            return;
        }

        imageData=null;
        updatePreview();

    };

    var pixelData = new Uint8Array(2 * 2 * 4);
    // var canvas = document.createElement('canvas');
    var canvas = null;
    var context = null;
    var imageData = null;
    var framebuffer = null;

    function createImageFromTexture(gl, texture, width, height)
    {
        if(!canvas)
        {
            canvas = document.getElementById('preview_img');
            if(!canvas)return;
            context = canvas.getContext('2d');
        }

        if(!framebuffer) framebuffer = gl.createFramebuffer();
        // Create a framebuffer backed by the texture

        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        // Read the contents of the framebuffer
        if(pixelData.length!=width*height*4) pixelData = new Uint8Array(width * height * 4);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixelData);

        // Create a 2D canvas to store the result
        canvas.width = width;
        canvas.height = height;

        // Copy the pixels to a 2D canvas
        if(!imageData)imageData = context.createImageData(width, height);
        imageData.data.set(pixelData);
        context.putImageData(imageData, 0, 0);
    }


};
