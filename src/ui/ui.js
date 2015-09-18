
var uiConfig=
{
    portSize:10,
    portHeight:7,
    portPadding:2,

    colorBackground:'#333',
    colorLink:'#fff',
    colorLinkHover:'#fff',
    colorLinkInvalid:'#888',
    colorOpBg:'#fff',
    colorOpBgSelected:'#ff9',
    colorPort:'#6c9fde',
    colorRubberBand:'#6c9fde',
    colorPortHover:'#f00',
    colorPatchStroke:'#6c9fde',

    colorSelected:'#fff',
    colorKey:'#6c9fde',
    colorCursor:'#ea6638',

    watchValuesInterval:100,
    rendererSizes:[{w:640,h:360},{w:1024,h:768},{w:1280,h:720},{w:0,h:0}]
};


CABLES.UI=CABLES.UI|| {};
CABLES.undo = new UndoManager();

CABLES.UI.GUI=function()
{
    var self=this;
    var rendererSize=0;
    var showTiming=true;
    var _scene=new Scene();
    var _patch=null;

    this.timeLine=function()
    {
        return _patch.timeLine;
    };

    this.scene=function()
    {
        return _scene;
    };

    this.patch=function()
    {
        return _patch;
    };

    this.setLayout=function()
    {
        var statusBarHeight=20;
        var menubarHeight=30;
        var optionsWidth=400;
        var timingHeight=250;
        var timelineUiHeight=40;
        var timedisplayheight=25;

        var rendererWidth=uiConfig.rendererSizes[rendererSize].w+2;
        var rendererHeight=uiConfig.rendererSizes[rendererSize].h+2;

        var patchHeight=window.innerHeight-statusBarHeight-menubarHeight;
        if(showTiming)patchHeight-=timingHeight;

        $('#patch svg').css('height',patchHeight-2);
        $('#patch svg').css('width',window.innerWidth-rendererWidth-2);
        // $('#patch svg').css('top',menubarHeight);

        $('#patch').css('height',patchHeight-2);
        $('#patch').css('width',window.innerWidth-rendererWidth-2);
        $('#patch').css('top',menubarHeight);

        $('#timelineui').css('width',window.innerWidth-rendererWidth-2);

        $('#timing').css('width',window.innerWidth-rendererWidth-2);
        $('#timing').css('bottom',statusBarHeight);
        if(showTiming)
        {
            $('#timing').css('height',timingHeight);

            $('#timetimeline').css('width',window.innerWidth-rendererWidth-2);
            $('#timetimeline').css('height',timingHeight-timedisplayheight);
            $('#timetimeline').css('margin-top',timelineUiHeight);

            $('#timetimeline svg').css('width',window.innerWidth-rendererWidth-2);
            $('#timetimeline svg').css('height',timingHeight-timedisplayheight);

            $('#timeline svg').css('width',window.innerWidth-rendererWidth-2);
            $('#timeline svg').css('height',timingHeight-timedisplayheight);
            $('#timeline svg').css('margin-top',timelineUiHeight+timedisplayheight);
            $('#timeline svg').show();
        }
        else
        {
            $('#timeline svg').hide();
            $('#timing').css('height',timelineUiHeight);
        }
        if(self.timeLine())self.timeLine().updateViewBox();

        $('#options').css('left',window.innerWidth-rendererWidth);
        $('#options').css('top',rendererHeight);
        $('#options').css('width',optionsWidth);
        $('#options').css('height',window.innerHeight-rendererHeight-statusBarHeight);

        $('#meta').css('right',0);
        $('#meta').css('top',rendererHeight);
        $('#meta').css('width',rendererWidth-optionsWidth);
        $('#meta').css('height',window.innerHeight-rendererHeight-statusBarHeight);

        $('#menubar').css('top',0);
        $('#menubar').css('width',window.innerWidth-rendererWidth);
        $('#menubar').css('height',menubarHeight);

        if(uiConfig.rendererSizes[rendererSize].w===0)
        {
            $('#glcanvas').attr('width',window.innerWidth);
            $('#glcanvas').attr('height',window.innerHeight);
            $('#glcanvas').css('z-index',9999);
        }
        else
        {
            $('#glcanvas').attr('width',uiConfig.rendererSizes[rendererSize].w);
            $('#glcanvas').attr('height',uiConfig.rendererSizes[rendererSize].h);
            CABLES.UI.setStatusText('webgl renderer set to size: '+uiConfig.rendererSizes[rendererSize].w+' x '+uiConfig.rendererSizes[rendererSize].h);
        }
    };

    this.importDialog=function()
    {
        var html='';
        html+='import:<br/><br/>';
        html+='<textarea id="serialized"></textarea>';
        html+='<br/>';
        html+='<br/>';
        html+='<a class="button" onclick="gui.patch().scene.clear();gui.patch().scene.deSerialize($(\'#serialized\').val());CABLES.UI.MODAL.hide();">import</a>';
        CABLES.UI.MODAL.show(html);
    };

    this.exportDialog=function()
    {
        var html='';
        html+='export:<br/><br/>';
        html+='<textarea id="serialized"></textarea>';
        CABLES.UI.MODAL.show(html);
        $('#serialized').val(self.patch().scene.serialize());
    };

    this.cycleRendererSize=function()
    {
        rendererSize++;
        if(rendererSize>uiConfig.rendererSizes.length-1)rendererSize=0;

        self.setLayout();
    };

    this.toggleTiming=function()
    {
        showTiming=!showTiming;
        self.setLayout();
    };

    this.toggleSideBar=function()
    {
        $('#sidebar').animate({width:'toggle'},200);
    };


    this.createProject=function()
    {
        CABLES.api.post('project',{name: prompt('projectname','') },function()
            {
                self.patch().updateProjectList();
            });

    };

    this.bind=function()
    {
        $('#glcanvas').attr('tabindex','3');

        $('#button_toggleTiming').bind("mousedown", function (event) { self.toggleTiming(); });
        $('#button_cycleRenderSize').bind("mousedown", function (event) { self.cycleRendererSize(); });
        $('.button_toggleSidebar').bind("mousedown", function (event) { self.toggleSideBar(); });
        $('.button_export').bind("mousedown", function (event) { self.exportDialog(); });
        $('.button_import').bind("mousedown", function (event) { self.importDialog(); });
        $('.button_saveCurrentProject').bind("mousedown", function (event) { self.patch().saveCurrentProject(); });
        $('.button_addOp').bind("mousedown", function (event) { CABLES.UI.OPSELECT.showOpSelect({x:0,y:0}); });
        $('.button_clearPatch').bind("mousedown", function (event) { self.scene().clear(); });




        $('.button_saveLocalStorage').bind("mousedown", function (event) { localStorage['cables']=self.scene().serialize(); });
        $('.button_loadLocalStorage').bind("mousedown", function (event) { self.scene().clear();self.scene().deSerialize(localStorage['cables']); });
        
        
        window.addEventListener( 'resize', self.setLayout, false );

        document.addEventListener('copy', function(e)
        {
            if($('#patch').is(":focus")) self.patch().copy(e);
            if($('#timeline').is(":focus"))self.patch().timeLine.copy(e);
        });

        document.addEventListener('paste', function(e)
        {
            if($('#patch').is(":focus")) self.patch().paste(e);
            if($('#timeline').is(":focus"))self.patch().timeLine.paste(e);
        });

        document.addEventListener('cut', function(e)
        {
            if($('#timeline').is(":focus"))self.patch().timeLine.cut(e);
        });

        $(document).keydown(function(e)
        {
            switch(e.which)
            {
                case 83: // s - save
                    if(e.metaKey || e.ctrlKey)
                    {
                        self.patch().saveCurrentProject();
                        e.preventDefault();
                    }
                break;

                case 27:
                    $('.tooltip').hide();

                    if(rendererSize==uiConfig.rendererSizes.length-1)
                    {
                        self.cycleRendererSize();
                    }
                    else
                    if( $('#sidebar').is(':visible') )
                    {
                        $('#sidebar').animate({width:'toggle'},200);
                    }
                    else
                    if( $('.easingselect').is(':visible') )
                    {
                        $('.easingselect').hide();
                    }
                    else
                    if( $('#modalcontent').is(':visible') )
                    {
                        CABLES.UI.MODAL.hide();
                    }
                    else
                    {
                        CABLES.UI.OPSELECT.showOpSelect({x:0,y:0});
                    }
                    
                break;
            }
        });

    };


    function initRouting()
    {
        var router = new Simrou();

        router.addRoute('/').get(function(event, params)
        {
            if(!localStorage.holo || localStorage.holo===''  || localStorage.holo.length<20)
            {
                self.scene.clear();
            }

            self.patch().scene.deSerialize(localStorage.holo);
        });

        router.addRoute('/example/:index').get(function(event, params)
        {
            self.patch().showExample(params.index);
        });

        router.addRoute('/project/:id').get(function(event, params)
        {
            CABLES.UI.MODAL.showLoading('loading');

            CABLES.api.get('project/'+params.id,function(proj)
            {
                self.patch().setProject(proj);
            });
        });

        router.start('/');
    }

    this.init=function()
    {
        _patch=new CABLES.UI.Patch(this);
        _patch.show(_scene);

        initRouting();
    };

};


document.addEventListener("DOMContentLoaded", function(event)
{
    $(document).bind("contextmenu", function(e)
    {
        if(e.preventDefault) e.preventDefault();
    });

    gui=new CABLES.UI.GUI();
    // _patch=ui;

    gui.init();
    gui.bind();

});
