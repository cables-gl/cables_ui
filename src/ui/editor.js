
CABLES = CABLES || {};

CABLES.Editor=function()
{
    var contents=[];

    var currentTabId='';

    var editor = ace.edit("ace");
    editor.setValue('nothing to edit right now :/');
    editor.setTheme("ace/theme/twilight");
    editor.session.setMode("ace/mode/text");
    editor.resize();
    editor.focus();
    

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
                contents.splice(i,1);

                updateTabs();
                if(contents.length>0)
                {
                    this.setTab(contents[0].id);
                }
                else
                {
                    $('#editorbar').html('');
                    editor.setValue('nothing to edit right now :/');
                }
                return;
            }
        }
    };

    this.addTab=function(c)
    {
        c.id=generateUUID();
        contents.push(c);
        updateTabs();
        this.setTab(c.id);
    };

    this.save=function()
    {
        this.setCurrentTabContent();
        for(var i=0;i<contents.length;i++)
        {
            if(contents[i].id==currentTabId)
            {
                contents[i].onSave(editor.getValue());
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
        console.log('setTab',id);
                
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

                editor.setValue(contents[i].content);
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




