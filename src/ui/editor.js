
CABLES = CABLES || {};

CABLES.Editor=function()
{
    var contents=[];
    var currentTabId='';

    var editor = ace.edit("ace");
    editor.setValue('nothing to edit right now :/');
    editor.setOption("showPrintMargin", false);
    editor.setTheme("ace/theme/cables");
    editor.session.setMode("ace/mode/text");
    editor.$blockScrolling = Infinity;
    editor.resize();
    editor.focus();

    // Hover text
    $('#ace').hover(function (e)
    {
        CABLES.UI.showInfo(CABLES.UI.TEXTS.editor);
    },function()
    {
        CABLES.UI.hideInfo();
    });

    this.resize=function()
    {
        editor.resize();
    };

    function updateTabs()
    {
        var html='';
        html+=CABLES.UI.getHandleBarHtml('editor_bar',{contents:contents});
        $('#editorbar').html(html);
    }

    this.closeCurrentTab=function()
    {
        for(var i=0;i<contents.length;i++)
        {
            if(contents[i].id==currentTabId)
            {
                if(contents[i].onClose)
                    contents[i].onClose(contents[i]);

                contents.splice(i,1);

                updateTabs();
                if(contents.length>0)
                {
                    this.setTab(contents[0].id);
                }
                else
                {
                    $('#editorbar').html('');
                    editor.setValue('nothing to edit right now :/',-1);
                    gui.closeEditor();
                }
                return;
            }
        }
    };

    this.addTab=function(c)
    {
        for(var i in contents)
        {
            if(contents[i].title==c.title)
            {
                this.setTab(contents[i].id);
                return;
            }
        }
        c.id=generateUUID();

        contents.push(c);
        updateTabs();
        this.setTab(c.id);
        return c;
    };

    function setStatus(txt,stay)
    {
        $('#editorstatus').html(txt);

        if(!stay)
            setTimeout(function()
            {
                $('#editorstatus').html('');
            },500);
    }
    this.setStatus=setStatus;

    this.save=function()
    {
        $('#editorstatus').html('<i class="fa fa-spinner fa-pulse"></i>');

        this.setCurrentTabContent();
        for(var i=0;i<contents.length;i++)
        {
            if(contents[i].onSave && contents[i].id==currentTabId)
            {
                contents[i].onSave(setStatus,editor.getValue());
            }
        }
    };

    this.setCurrentTabContent=function()
    {
        for(var i=0;i<contents.length;i++)
        {
            if(contents[i].id==currentTabId)
            {
                contents[i].content=editor.getValue();
            }
        }
    };

    this.setTab=function(id)
    {
        this.setCurrentTabContent();

        for(var i=0;i<contents.length;i++)
        {
            if(contents[i].id==id)
            {
                currentTabId=id;
                $('#editortab'+contents[i].id).addClass('active');

                if(contents[i].syntax=='md')  editor.session.setMode("ace/mode/Markdown");
                else if(contents[i].syntax=='js')  editor.session.setMode("ace/mode/javascript");
                else if(contents[i].syntax=='glsl')  editor.session.setMode("ace/mode/glsl");
                else editor.session.setMode("ace/mode/Text");

                editor.setValue(contents[i].content,-1);
                editor.setReadOnly(contents[i].readOnly);

                if(contents[i].readOnly)$('.editorsavebutton').hide();
                    else $('.editorsavebutton').show();

                $('#editorbar .iconbar .editortoolbar').html(contents[i].toolbarHtml || '');
            }
            else
            {
                $('#editortab'+contents[i].id).removeClass('active');
            }
        }
    };

    // this.addTab({
    //     title:'nothing',
    //     content:'empty'
    // });
    // this.closeCurrentTab();

};
