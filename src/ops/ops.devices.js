

Ops.Devices= Ops.Devices || {};

Ops.Devices.GamePad = function()
{
    Op.apply(this, arguments);

    this.name='GamePad';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));
    this.numPads=this.addOutPort(new Port(this,"numPads"));
    this.axis1=this.addOutPort(new Port(this,"axis1"));
    this.axis2=this.addOutPort(new Port(this,"axis2"));
    this.axis3=this.addOutPort(new Port(this,"axis3"));
    this.axis4=this.addOutPort(new Port(this,"axis4"));
    this.button0=this.addOutPort(new Port(this,"button0"));
    this.button1=this.addOutPort(new Port(this,"button1"));
    this.button2=this.addOutPort(new Port(this,"button2"));
    this.button3=this.addOutPort(new Port(this,"button3"));
    this.button4=this.addOutPort(new Port(this,"button4"));

    var self=this;
    var startTime=Date.now()/1000.0;

    this.exe.onTriggered=function()
    {
        var gamePads=navigator.getGamepads();
        var count=0;

        for(var gp in gamePads)
        {
            if(gamePads[gp].axes)
            {
                self.axis1.val=gamePads[gp].axes[0];
                self.axis2.val=gamePads[gp].axes[1];
                self.axis3.val=gamePads[gp].axes[2];
                self.axis4.val=gamePads[gp].axes[3];

                self.button0.val=gamePads[gp].buttons[0].pressed;
                self.button0.val=gamePads[gp].buttons[1].pressed;
                self.button2.val=gamePads[gp].buttons[2].pressed;
                self.button3.val=gamePads[gp].buttons[3].pressed;
                self.button4.val=gamePads[gp].buttons[4].pressed;

                count++;
            }
        }

        self.numPads.val=count;
    };

    this.exe.onTriggered();

};

Ops.Devices.GamePad.prototype = new Op();

// --------------------------------------------------------------------------


Ops.Devices.LeapMotion = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='LeapMotion';

    this.transX=this.addOutPort(new Port(this,"translationX"));
    this.transY=this.addOutPort(new Port(this,"translationY"));
    this.transZ=this.addOutPort(new Port(this,"translationZ"));

    this.finger0X=this.addOutPort(new Port(this,"finger0X"));
    this.finger0Y=this.addOutPort(new Port(this,"finger0Y"));
    this.finger0Z=this.addOutPort(new Port(this,"finger0Z"));

    Leap.loop(function (frame)
    {
        self.transX.val=frame._translation[0];
        self.transY.val=frame._translation[1];
        self.transZ.val=frame._translation[2];

        if(frame.fingers.length>0)
        {
            self.finger0X.val=frame.fingers[0].tipPosition[0];
            self.finger0Y.val=frame.fingers[0].tipPosition[1];
            self.finger0Z.val=frame.fingers[0].tipPosition[2];
        }
    });
};

Ops.Devices.LeapMotion.prototype = new Op();

// --------------------------------------------------------------------------
