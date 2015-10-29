
CABLES = CABLES || {};

CABLES.Editor=function()
{
    var contents=[];

    var currentTabId='';

    var editor = ace.edit("ace");
    editor.setTheme("ace/theme/twilight");
    // editor.session.setMode("ace/mode/javascript");
    editor.resize();

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
                if(contents.length>0)this.setTab(contents[0].id);
                    else editor.setValue('');
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


                editor.setValue(contents[i].content);
            }
            else
            {
                $('#editortab'+contents[i].id).removeClass('active');
            }
        }
    };





    this.addTab({
        title:'hund.js',
        content:'wurstsalat!!!!!'
    });

    this.addTab({
        title:'hans.js',
        content:'a alles andere ist euer bier!!!!!',
        onSave:function()
        {
            console.log('hallo save!');
        }
    });




};




