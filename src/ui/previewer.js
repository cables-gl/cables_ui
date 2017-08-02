CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.currentPreviewTimeout=-1;

CABLES.UI.Preview=function()
{
    var defaultInterval=120;
    var interval=defaultInterval;
    var paused=false;

    this.show=function()
    {
        paused=false;
        var html = CABLES.UI.getHandleBarHtml('preview', {} );
        $('#meta_content_preview').html(html);
        updatePreview(true);

    };

    this.hide=function()
    {
        clearTimeout(CABLES.UI.currentPreviewTimeout);
        canvas=null;
        paused=true;
    };

    // var psc=new CABLES.perSecondCounter("previewer");
    var previewDataPort=null;
    var previewDataOp=null;

    function updatePreview()
    {
        if(paused || !previewDataOp || !previewDataPort)return;

        if(previewDataPort.get())
            createImageFromTexture(
                previewDataOp.patch.cgl.gl,
                previewDataPort.get());


        CABLES.UI.currentPreviewTimeout=setTimeout(updatePreview,interval);

        // psc.count();
    }

    this.toggleBackground=function()
    {
        $('#preview_img').toggleClass('dark');
        $('#preview_img').toggleClass('bright');
    };

    this.setTexture=function(opid,portName)
    {
        clearTimeout(CABLES.UI.currentPreviewTimeout);
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

        if(gui.rendererWidth>window.innerWidth*0.9)return;

        interval=Math.min(2000,width*height/(256*256)*defaultInterval);

        if(!canvas || lastWidth !=width || lastHeight!=height)
        {
            canvas = document.getElementById('preview_img');
            canvasContainer = document.getElementById('preview_img_container');
            $('#meta_content_preview .opname').html(previewDataPort.parent.name);
            $('#preview_img_container').data('info',texture.getInfoReadable());

            lastWidth =width;
            lastHeight=height;

            if(!canvasContainer)
            {
                console.log('previewer no canvasContainer!');
                return;
            }

            canvasContainer.style['max-width']=width+'px';
            canvasContainer.style['max-height']=height+'px';

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
