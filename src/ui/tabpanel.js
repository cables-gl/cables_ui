CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

// -----------------

CABLES.UI.Tab=function(title)
{
    CABLES.EventTarget.apply(this);

    this.title=title;
    this.active=false;
    this.unsaved=false;
    this.id=CABLES.uuid();
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

    
    var t1=new CABLES.UI.Tab("tab 1");
    t1.unsaved=true;
    t1.closable=true;
    this.addTab(t1);

    var t2=new CABLES.UI.Tab("tab 2");
    t2.active=true;
    t2.icon="eye";
    this.addTab(t2);

    var t3=new CABLES.UI.Tab("tab with a long name!");
    t3.icon="code";
    t3.closable=true;
    this.addTab(t3);

    var t4=new CABLES.UI.Tab("");
    t4.icon="eye";
    this.addTab(t4);

    var t5=new CABLES.UI.Tab("");
    t5.icon="clock";
    this.addTab(t5);

    var t6=new CABLES.UI.Tab("");
    t6.icon="code";
    this.addTab(t6);

    var t7=new CABLES.UI.Tab("");
    t7.icon="pie-chart";
    this.addTab(t7);

    var t8=new CABLES.UI.Tab("");
    t8.icon="book-open";
    this.addTab(t8);

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
                // console.log('yoyo',e.target.dataset.id);
                if(e.target.dataset.id) this.activateTab(e.target.dataset.id);

            }.bind(this));
    }
}

CABLES.UI.TabPanel.prototype.activateTab=function(id)
{
    for(var i=0;i<this._tabs.length;i++)
    {
        if(this._tabs[i].id==id)
        {
            this._tabs[i].active=true;
            this._tabs[i].contentEle.style.display="block";
        }
        else
        {
            this._tabs[i].active=false;
            this._tabs[i].contentEle.style.display="none";
        }
            
        this.updateHtml();
    }            

}

CABLES.UI.TabPanel.prototype.addTab=function(tab)
{
    var contentEle=document.createElement("div");
    contentEle.id="content"+tab.id;
    contentEle.classList.add("tabcontent");
    contentEle.innerHTML="hello<br/><br/>the tab "+tab.id;
    this._eleContentContainer.appendChild(contentEle);
    tab.contentEle=contentEle;

    this._tabs.push(tab);
    this.activateTab(tab.id);
    return tab;
}

