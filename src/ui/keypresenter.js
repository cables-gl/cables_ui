

var CABLES=CABLES||{};
CABLES.UI=CABLES.UI||{};

CABLES.UI.Keypresenter=function()
{
    this.counter=0;
    this._lastTextElement=null;
    this._lastKeyEvent=0;
    // this.lines=[];
    this._lastWheel=0;
    this._lineCounter=0;
    $('body').append('<div id="keypresenter"></div>');


};

CABLES.UI.Keypresenter.prototype.addLine=function(title)
{
    function setUpDeath(id)
    {
        setTimeout(function()
        {
            $(id).fadeOut(400,function()
            {
                $(id).remove();
            });
        },2000);
    }

    if(Date.now()-this._lastKeyEvent>500)
    {

        setUpDeath('#kp-line'+this._lineCounter);

        this._lineCounter++;
        $('#keypresenter').append('<div class="kp-line" id="kp-line'+this._lineCounter+'"></div>');
    }


};

CABLES.UI.Keypresenter.prototype.showMetaKey=function(title)
{

    var id="kp-ele-"+this.counter;

    // if(Date.now()-this._lastKeyEvent>500)$('#keypresenter').append('<br/>');

    $('#kp-line'+this._lineCounter).append('<span id="'+id+'" class="kp-ele">'+title+'</span>');

    // setUpDeath(id);

    this.counter++;
    return id;
};


CABLES.UI.Keypresenter.prototype.start=function()
{
    setInterval(this.addLine.bind(this),250);

    $(document).keydown(function(e)
    {
        console.log(e.key);
        if(e.key.length==1)
        {
            var str=e.key;
            if(e.key==' ')str="_";

            if(this._lastTextElement!==null && Date.now()-this._lastKeyEvent<300)
            {
                str=this._lastTextElement.html()+str;
                this._lastTextElement.remove();
            }

            var id=this.showMetaKey(str);
            this._lastTextElement=$('#'+id);
        }
        else
        {
            this.showMetaKey(e.key);
            this._lastTextElement=null;
        }

        this._lastKeyEvent=Date.now();
        console.log(e);
    }.bind(this));

    $(document).on("mousedown", function(e)
    {
        var which="left";
        if(e.buttons==4)which="middle";
        if(e.buttons==2)which="right";
        this.showMetaKey('click '+which);
        this._lastKeyEvent=Date.now();
    }.bind(this));

    document.addEventListener('wheel', function()
    {
        if(Date.now()-this._lastWheel>1000)
        {
            this.showMetaKey('mousewheel');
            this._lastWheel=Date.now();
        }

    }.bind(this));


};
