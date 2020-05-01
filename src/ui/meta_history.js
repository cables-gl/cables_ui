CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.MetaHistory=class
{
    constructor(tabs)
    {
        this._tab=new CABLES.UI.Tab("doc",{"icon":"list","infotext":"tab_history","showTitle":false,"hideToolbar":true,"padding":true});
        tabs.addTab(this._tab);

        this.html='';

        CABLES.undo.setCallback(this.update.bind(this));
        
        this.update();
    }

    update()
    {
        console.log("undo update!!!");
        this.html='<h3>history</h3>';

        this.html+='<span onclick="CABLES.undo.undo();" class="iconbutton"><span class="icon icon-arrow-left" ></span></span>';
        this.html+='<span onclick="CABLES.undo.redo();" class="iconbutton"><span class="icon icon-arrow-right"></span></span>';

        // if(this._tab.isVisible())
        const commands=CABLES.undo.getCommands();

        this.html+='&nbsp;&nbsp;&nbsp;'+(CABLES.undo.getIndex()+1)+' / '+(commands.length)+'<br/><br/>';

        var groupSummary=[];

        for(var i=0;i<commands.length;i++)
        {
            console.log(commands[i]);

            var style="";
            if(!commands[i].group || (i>0 && commands[i-1].group && commands[i-1].group!=commands[i].group))
            {
                style+="margin-top:4px;"
                groupSummary=[];
            }


            if(CABLES.undo.getIndex()==i) style+="border-left:4px solid var(--color-09);background-color:var(--color-05);";
            else if(CABLES.undo.getIndex()<i) style+='opacity:0.4;border-left:4px solid var(--color-08);background-color:var(--color-03);';
            else style+='border-left:4px solid var(--color-08);background-color:var(--color-03);';

            this.html+='<div style="padding:2px;padding-left:7px;'+style+'">';

            if(!commands[i].group) this.html+='<b>'+commands[i].title+'</b>';

            groupSummary.push(commands[i].title);
            // this.html+='--';
            // this.html+=i;
            // if(commands[i].group)
            // {
            //     this.html+='--';
            //     this.html+=commands[i].group;
            // }

            if(commands[i].groupName)
            {
                this.html+=groupSummary.join(", ");
                this.html+='<br/>';
                this.html+='<b>'+commands[i].groupName+'</b>';
            }
            


            this.html+='</div>';

        }

        this._tab.html(this.html);
    }

    show()
    {
        this._tab.html(this.html);
    }

};

// CABLES.UI.MetaDoc=function(tabs)
// {
//     this._tab=new CABLES.UI.Tab("doc",{"icon":"book-open","infotext":"tab_doc","showTitle":false,"hideToolbar":true,"padding":true});
//     tabs.addTab(this._tab);
    
//     this._op=null;
//     this.html='';


//     this._tab.addEventListener("onActivate",function()
//     {
//         this.update();
//         this.show();
//     }.bind(this));
// };

// CABLES.UI.MetaDoc.prototype.init=function()
// {
//     gui.patch().addEventListener('opSelected',function(_op)
//     {
//         this._op=_op;
//         if(this._tab.isVisible())
//         {
//             this.update();
//             this.show();
//         }
//     }.bind(this));
// };

// CABLES.UI.MetaDoc.prototype.update=function()
// {
//     if(!this._op)return;

//     gui.getOpDoc(this._op.objName, true, function(html)
//     {
//         var doclink = '<div><a href="'+CABLES.sandbox.getCablesUrl()+'/op/' + this._op.objName + '" class="button ">View documentation</a>&nbsp;<br/><br/>';
//         this.html=html+doclink;
//     }.bind(this));

// }

// CABLES.UI.MetaDoc.prototype.show=function()
// {
//     this._tab.html(this.html);
// }
