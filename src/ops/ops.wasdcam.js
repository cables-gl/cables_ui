

// --------------------------------------------------------------------------

Ops.Gl.Matrix.WASDCamera = function()
{
    Op.apply(this, arguments);
    var self=this;

    var DEG2RAD=3.14159/180.0;


    this.name='WASDCamera';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.isLocked=this.addOutPort(new Port(this,"isLocked",OP_PORT_TYPE_VALUE));
    this.isLocked.val=false;

    var vPos=vec3.create();

    var posX=0,posZ=0,posY=0;
    var rotX=0,rotY=0,rotZ=0;
    var speedx=0,speedy=0,speedz=0;

    var movementSpeedFactor = 0.5;


    var viewMatrix = mat4.create();


    this.render.onTriggered=function()
    {
        calcCameraMovement();
        move();

        cgl.pushMvMatrix();

        vec3.set(vPos, -posX,-posY,-posZ);

        // mat4.identity(viewMatrix);

        mat4.rotateX( cgl.mvMatrix ,cgl.mvMatrix,DEG2RAD*rotX);
        mat4.rotateY( cgl.mvMatrix ,cgl.mvMatrix,DEG2RAD*rotY);
        mat4.translate( cgl.mvMatrix ,cgl.mvMatrix,vPos);

        
        self.trigger.trigger();
        cgl.popMvMatrix();
    };

    //--------------

    function calcCameraMovement()
    {
        var camMovementXComponent = 0.0;
        var camMovementYComponent = 0.0;
        var camMovementZComponent = 0.0;

        if (pressedW)
        {
            // Control X-Axis movement
            var pitchFactor = Math.cos(DEG2RAD*rotX);
                    
            camMovementXComponent += ( movementSpeedFactor * (Math.sin(DEG2RAD*rotY)) ) * pitchFactor;

            // Control Y-Axis movement
            camMovementYComponent += movementSpeedFactor * (Math.sin(DEG2RAD*rotX)) * -1.0;

            // Control Z-Axis movement
            var yawFactor = (Math.cos(DEG2RAD*rotX));
            camMovementZComponent += ( movementSpeedFactor * (Math.cos(DEG2RAD*rotY)) * -1.0 ) * yawFactor;
        }

        if (pressedS)
        {
            // Control X-Axis movement
            var pitchFactor = Math.cos(DEG2RAD*rotX);
            camMovementXComponent += ( movementSpeedFactor * (Math.sin(DEG2RAD*rotY)) * -1.0) * pitchFactor;

            // Control Y-Axis movement
            camMovementYComponent += movementSpeedFactor * (Math.sin(DEG2RAD*rotX));

            // Control Z-Axis movement
            var yawFactor = (Math.cos(DEG2RAD*rotX));
            camMovementZComponent += ( movementSpeedFactor * (Math.cos(DEG2RAD*rotY)) ) * yawFactor;
        }

        if (pressedA)
        {
            // Calculate our Y-Axis rotation in radians once here because we use it twice
            var yRotRad = DEG2RAD*rotY;

            camMovementXComponent += -movementSpeedFactor * (Math.cos(yRotRad));
            camMovementZComponent += -movementSpeedFactor * (Math.sin(yRotRad));
        }

        if (pressedD)
        {
            // Calculate our Y-Axis rotation in radians once here because we use it twice
            var yRotRad = DEG2RAD*rotY;

            camMovementXComponent += movementSpeedFactor * (Math.cos(yRotRad));
            camMovementZComponent += movementSpeedFactor * (Math.sin(yRotRad));
        }

        speedx = camMovementXComponent;
        speedy = camMovementYComponent;
        speedz = camMovementZComponent;

        if (speedx > movementSpeedFactor) speedx = movementSpeedFactor;
        if (speedx < -movementSpeedFactor) speedx = -movementSpeedFactor;

        if (speedy > movementSpeedFactor) speedy = movementSpeedFactor;
        if (speedy < -movementSpeedFactor) speedy = -movementSpeedFactor;

        if (speedz > movementSpeedFactor) speedz = movementSpeedFactor;
        if (speedz < -movementSpeedFactor) speedz = -movementSpeedFactor;
    }

    function moveCallback(e)
    {
        var mouseSensitivity=0.1;
        rotX+=e.movementY*mouseSensitivity;
        rotY+=e.movementX*mouseSensitivity;

        if (rotX < -90.0) rotX = -90.0;
        if (rotX > 90.0) rotX = 90.0;
        if (rotY < -180.0) rotY += 360.0;
        if (rotY > 180.0) rotY -= 360.0;
    }

    var canvas = document.getElementById("glcanvas");

     function lockChangeCallback(e)
     {
        if (document.pointerLockElement === canvas ||
                document.mozPointerLockElement === canvas ||
                document.webkitPointerLockElement === canvas)
        {
            document.addEventListener("mousemove", moveCallback, false);
            document.addEventListener("keydown", keyDown, false);
            document.addEventListener("keyup", keyUp, false);
            console.log('lock start');
            // isLocked=true;
            self.isLocked.val=true;

        }
        else
        {
            document.removeEventListener("mousemove", moveCallback, false);
            document.removeEventListener("keydown", keyDown, false);
            document.removeEventListener("keyup", keyUp, false);
            // isLocked=false;
            self.isLocked.val=false;
            pressedW=false;
            pressedA=false;
            pressedS=false;
            pressedD=false;

            console.log('lock exit');
        }
    }
       
    document.addEventListener('pointerlockchange', lockChangeCallback, false);
    document.addEventListener('mozpointerlockchange', lockChangeCallback, false);
    document.addEventListener('webkitpointerlockchange', lockChangeCallback, false);

    document.getElementById('glcanvas').addEventListener('mousedown',function()
    {
        document.addEventListener("mousemove", moveCallback, false);
        canvas.requestPointerLock = canvas.requestPointerLock ||
                                    canvas.mozRequestPointerLock ||
                                    canvas.webkitRequestPointerLock;
        canvas.requestPointerLock();

    });

    var lastMove=0;
    function move()
    {
        var timeOffset = window.performance.now()-lastMove;

        posX+=speedx;
        posY+=speedy;
        posZ+=speedz;

        lastMove = window.performance.now();
    }

    var pressedW=false;
    var pressedA=false;
    var pressedS=false;
    var pressedD=false;

    function keyDown(e)
    {
        switch(e.which)
        {
            case 87:
                pressedW=true;
            break;
            case 65:
                pressedA=true;
            break;
            case 83:
                pressedS=true;
            break;
            case 68:
                pressedD=true;
            break;

            default:
                console.log('key:',e.which);
            break;
        }
    }

    function keyUp(e)
    {
        console.log('key');
                
        switch(e.which)
        {
            case 87:
                pressedW=false;
            break;
            case 65:
                pressedA=false;
            break;
            case 83:
                pressedS=false;
            break;
            case 68:
                pressedD=false;
            break;
        }
    }


};

Ops.Gl.Matrix.WASDCamera.prototype = new Op();


// --------------------------------------------------------------------------
