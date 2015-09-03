
    
    CABLES.TL.UI=CABLES.TL.UI || {};

    CABLES.TL.Key.prototype.isUI=true;
    CABLES.TL.Key.prototype.circle={};
    CABLES.TL.Key.prototype.initUI=function(paper)
    {
        var self=this;

        this.x=this.time*100;
        this.y=this.value*-100;

        var discattr = {fill: "#f0f", stroke: "none"};
        this.circle=paper.circle(self.x, self.y, 6).attr(discattr);
        this.circle.toFront();

        function move(dx, dy)
        {
            if(self.x==-1 && self.y==-1)
            {
                self.x=self.time*100;
                self.y=self.value*-100;
            }

            var posx=dx+self.x;
            var posy=dy+self.y;

            self.circle.attr({ cx:posx, cy:posy });

            self.set({time:ui.timeLine.getTimeFromPaper(posx),value:posy/-100});
        }

        function up()
        {
            self.x=-1;
            self.y=-1;
        }

        this.circle.drag(move,up);
    };


    CABLES.TL.Key.prototype.getPathString=function(viewBox,nextKey)
    {
        var x=this.time*100;
        var y=this.value*-100;

        var str="L "+x+" "+y;
        return str;
    };

    CABLES.TL.UI.TimeLineUI=function()
    {
        var self=this;
        var tl=new CABLES.TL.TimeLine();
        var viewBox={x:-100,y:-400,w:1200,h:1000};
        var fps=30;
        var cursorTime=0.0;

        var paper= Raphael("timeline", 0,0);

        tl.keys.push(new CABLES.TL.Key({paper:paper,time:0.0,value:1.0}) );
        tl.keys.push(new CABLES.TL.Key({paper:paper,time:1.0,value:1.0}) );
        tl.keys.push(new CABLES.TL.Key({paper:paper,time:5.0,value:0.0}) );
        tl.keys.push(new CABLES.TL.Key({paper:paper,time:6.0,value:4.0}) );
        tl.keys.push(new CABLES.TL.Key({paper:paper,time:8.0,value:2.0}) );
        tl.keys.push(new CABLES.TL.Key({paper:paper,time:10.0,value:2.0}) );

        var ki=tl.getKeyIndex(-1.0);
        console.log('ki '+ki);

        var cursorLine = paper.path("M 0 0 L 10 10");
        cursorLine.attr({stroke: "#ff0", "stroke-width": 2});

        function getFrame(time)
        {
            var frame=parseInt(time*fps,10);
            return frame;
        }

        function setCursor(time)
        {
            cursorTime=time;
            time=time*100;
            cursorLine.attr({path: "M "+time+" -1000 L" + time + " " + 1110 });
        }

        this.sortKeys=function()
        {
            tl.keys.sort(function(a, b) {
                return parseFloat(a.time) - parseFloat(b.time);
            });

        };



        var keyLine = paper.path("M "+-1000+" "+0+" L" + 1000 + " " + 0);
        keyLine.attr({ stroke: "#fff", "stroke-width": 2 });

        var zeroLine = paper.path("M "+-1000+" "+0+" L" + 1000 + " " + 0);
        zeroLine.attr({ stroke: "#999", "stroke-width": 1});


        this.updateViewBox=function()
        {
            paper.setViewBox(
                viewBox.x,
                viewBox.y,
                viewBox.w,
                viewBox.h,false
            );
            paper.canvas.setAttribute('preserveAspectRatio', 'none');

        };


        function updateKeyLine()
        {
            self.sortKeys();
            var str="M 0 0 ";
            for(var i=0;i<tl.keys.length;i++)
            {
                var nextKey=null;
                        
                if(tl.keys.length > i+1)
                {
                    nextKey=tl.keys[i+1];
                }

                str+=tl.keys[i].getPathString(viewBox,nextKey);
                tl.keys[i].circle.toFront();

                if(tl.keys[i].onChange===null) tl.keys[i].onChange=updateKeyLine;
            }
            keyLine.attr({ path:str });
        }

        updateKeyLine();
        setCursor(cursorTime);
        this.updateViewBox();

        $(".timeLineInsert").bind("click", function (e)
        {
            console.log('huhu! '+cursorTime);
            tl.keys.push(new CABLES.TL.Key({paper:paper,time:cursorTime,value:2.0}) );
            updateKeyLine();

        });

        $("#timeline").bind("mousemove", function (e)
        {
            e=mouseEvent(e);

            if(e.which==1 && e.offsetY<50)
            {
                var time=self.getTimeFromMouse(e.offsetX);
                $('.timelinetime').html(time+" / "+getFrame(time) );
                setCursor(time);
            }
        });

        $('#timeline').bind("mousewheel", function (event,delta,nbr)
        {
            event=mouseEvent(event);
            if(viewBox.w-delta >0 &&  viewBox.h-delta >0 )
            {
                viewBox.x+=delta/2;
                viewBox.y+=delta/2;
                viewBox.w-=delta;
                viewBox.h-=delta;
            }

            self.updateViewBox();
        });

        this.getTimeFromMouse=function(offsetX)
        {
            var time=offsetX/$('#timeline').width() ;
            time*=(viewBox.w);
            time/=100;
            time+=viewBox.x/100;
            return time;
        };

        this.getTimeFromPaper=function(offsetX)
        {
            var time=offsetX;
            time/=100;
            return time;
        };

    }
