CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.Preview=function()
{
    var interval=120;
    var paused=false;

    this.show=function()
    {
        paused=false;
        var html = CABLES.UI.getHandleBarHtml('preview', {} );
        $('#meta_content_preview').html(html);
        updatePreview();
    };

    this.hide=function()
    {
        canvas=null;
        paused=true;
    };

    var previewDataPort=null;
    var previewDataOp=null;

    function updatePreview()
    {
        if(paused || !previewDataOp || !previewDataPort)return;

        // console.log(previewDataPort.get());

        if(previewDataPort.get())
            createImageFromTexture(
                previewDataOp.patch.cgl.gl,
                previewDataPort.get());

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
            console.log('port not found:',portName);
            return;
        }

        imageData=null;
        canvas=null;
        if(framebuffer)
        {
            reset();
        }

        updatePreview();
    };

    function reset()
    {
        previewDataOp.patch.cgl.gl.deleteFramebuffer(framebuffer);
        framebuffer=null;
    }

    var pixelData = new Uint8Array(2 * 2 * 4);
    var canvas = null;
    var canvasContainer = null;
    var context = null;
    var imageData = null;
    var framebuffer = null;

    var lastWidth,lastHeight;

    function createImageFromTexture(gl, texture)
    {
        var width=texture.width;
        var height=texture.height;

        if(!canvas || lastWidth !=width || lastHeight!=height)
        {
            canvas = document.getElementById('preview_img');
            canvasContainer = document.getElementById('preview_img_container');
            infoContainer = document.getElementById('preview_img_info');

            infoContainer.innerHTML='<pre>'+JSON.stringify(texture.getInfo(),false,2)+'</pre>';

            lastWidth =width;
            lastHeight=height;

            canvasContainer.style['max-width']=width+'px';
            canvasContainer.style['max-height']=height+'px';
            // canvasContainer.style['padding-top']=height/width*100+'%';

            imageData=null;
            if(!canvas)
            {
                console.log('no canvas...');
                return;
            }
            context = canvas.getContext('2d');
        }

        if(!framebuffer) framebuffer = gl.createFramebuffer();
        // Create a framebuffer backed by the texture

        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture.tex, 0);

        // Read the contents of the framebuffer
        if(pixelData.length!=width*height*4) pixelData = new Uint8Array(width * height * 4);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixelData);

        // Create a 2D canvas to store the result
        canvas.width = width;
        canvas.height = height;

        // Copy the pixels to a 2D canvas
        if(!imageData)imageData = context.createImageData(width, height);
        try
        {
            imageData.data.set(pixelData);
            context.putImageData(imageData, 0, 0);
        }
        catch(e)
        {
            reset();
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }


};
