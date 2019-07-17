CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

// -----------------

CABLES.UI.Tab=function(title,options)
{
    CABLES.EventTarget.apply(this);
    this.options=options||{};
    this.icon=this.options.icon||null;
    this.title=title;
    this.active=false;
    this.unsaved=false;
    this.id=CABLES.uuid();
}

CABLES.UI.Tab.prototype.initHtml=function(eleContainer)
{
    this.contentEle=document.createElement("div");
    this.contentEle.id="content"+this.id;
    this.contentEle.classList.add("tabcontent");
    this.contentEle.innerHTML="hello<br/><br/>the tab "+this.id;
    eleContainer.appendChild(this.contentEle);
}

CABLES.UI.Tab.prototype.remove=function()
{
    this.contentEle.remove();
}

CABLES.UI.Tab.prototype.html=function(html)
{
    this.contentEle.innerHTML=html;
}

CABLES.UI.Tab.prototype.isVisible=function()
{
    return this.active;
}

CABLES.UI.Tab.prototype.activate=function()
{
    this.active=true;
    this.contentEle.style.display="block";
    this.emitEvent("onactivate");
}

CABLES.UI.Tab.prototype.deactivate=function()
{
    this.active=false;
    this.contentEle.style.display="none";
    this.emitEvent("ondeactivate");
}


// -----------------

CABLES.UI.TabPanel=function(eleId)
{
    CABLES.EventTarget.apply(this);

    this._eleId=eleId;
    this._tabs=[];
    this._eleContentContainer=null;
    this._eleTabPanel=null;


    //////

    if(!this._eleTabPanel)
    {
        this._eleTabPanel=document.createElement("div");
        this._eleTabPanel.classList.add("tabpanel")
        this._eleTabPanel.innerHTML="";
        
        const ele=document.querySelector('#'+this._eleId);
        ele.appendChild(this._eleTabPanel);

        this._eleContentContainer=document.createElement("div");
        this._eleContentContainer.classList.add("contentcontainer")
        this._eleContentContainer.innerHTML="";
        ele.appendChild(this._eleContentContainer);
    }

    /////////

    
    // var t4=new CABLES.UI.Tab("");
    // t4.icon="eye";
    // this.addTab(t4);

    // var t5=new CABLES.UI.Tab("");
    // t5.icon="clock";
    // this.addTab(t5);

    // var t6=new CABLES.UI.Tab("");
    // t6.icon="code";
    // this.addTab(t6);

    // var t7=new CABLES.UI.Tab("");
    // t7.icon="pie-chart";
    // this.addTab(t7);

    // var t8=new CABLES.UI.Tab("");
    // t8.icon="book-open";
    // this.addTab(t8);

}

CABLES.UI.TabPanel.prototype.updateHtml=function(name)
{
    var html='';
    html+=CABLES.UI.getHandleBarHtml('tabpanel_bar',{tabs:this._tabs});
    this._eleTabPanel.innerHTML=html;

    for(var i=0;i<this._tabs.length;i++)
    {
        document.getElementById("editortab"+this._tabs[i].id).addEventListener("click",
            function(e){
                if(e.target.dataset.id) this.activateTab(e.target.dataset.id);

            }.bind(this));

        if(document.getElementById("closetab"+this._tabs[i].id))
            document.getElementById("closetab"+this._tabs[i].id).addEventListener("click",
                function(e){
                    if(e.target.dataset.closeid) this.closeTab(e.target.dataset.closeid);

                }.bind(this));
    }
}

CABLES.UI.TabPanel.prototype.activateTab=function(id)
{
    for(var i=0;i<this._tabs.length;i++)
    {
        if(this._tabs[i].id==id)
            this._tabs[i].activate();
        else
            this._tabs[i].deactivate();
            
        this.updateHtml();
    }

}

CABLES.UI.TabPanel.prototype.closeTab=function(id)
{
    console.log("num tabs before",this._tabs.length);
    var tab=null;
    for(var i=0;i<this._tabs.length;i++)
    {
        if(this._tabs[i].id==id)
        {
            tab=this._tabs[i];
            this._tabs.splice(i,1);
            break;
        }
    }

    tab.remove();

    if(this._tabs.length>0) this.activateTab(this._tabs[0].id);
    // this.updateHtml();

    console.log("num tabs",this._tabs.length);

    
}
CABLES.UI.TabPanel.prototype.setTabNum=function(num)
{
    var tab=this._tabs[Math.min(this._tabs.length,num)];
    this.activateTab(tab.id);
}


CABLES.UI.TabPanel.prototype.addTab=function(tab)
{

    tab.initHtml(this._eleContentContainer);

    this._tabs.push(tab);
    this.activateTab(tab.id);
    return tab;
}


