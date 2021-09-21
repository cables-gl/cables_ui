// CABLES =CABLES || {};
// CABLES.UI =CABLES.UI || {};


// CABLES.UI.PatchPreviewer=function()
// {
//     this.ops=[];

// };

// CABLES.UI.PatchPreviewer.prototype.addOp=function(op)
// {
//     this.ops.push(op);
//     console.log('previewer ops',this.ops.length);

// };

// CABLES.UI.PatchPreviewer.prototype.removeOp=function(op)
// {
//     this.ops.slice(this.ops.indexOf(op),1);

//     console.log('previewer ops',this.ops.length);
// };


// CABLES.UI.PatchPreviewer.prototype.render=function()
// {
//     if(this.ops.length>0)
//     {
//         var i=0;
//         var op=this.ops[i];

//         var cgl=op.patch.cgl;
//         op.renderPreview();

//         if(!CABLES.secondCanvas && document.getElementById('secondCanvas'))
//         {
//             CABLES.secondCanvasEle=document.getElementById('secondCanvas');
//             CABLES.secondCanvas=document.getElementById('secondCanvas').getContext("2d");
//         }
//         if(CABLES.secondCanvas)
//         {
//             CABLES.secondCanvas.clearRect(0, 0,CABLES.secondCanvasEle.width, CABLES.secondCanvasEle.height);
//             CABLES.secondCanvas.drawImage(cgl.canvas, 0, 0,CABLES.secondCanvasEle.width, CABLES.secondCanvasEle.height);
//         }

//         cgl.gl.clearColor(0,0,0,0.0);
//         cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);

//     }


// };

// CABLES.UI.patchPreviewer=new CABLES.UI.PatchPreviewer();
