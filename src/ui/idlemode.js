CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.idling=false;
CABLES.UI.idleTimeout=null;
CABLES.UI.idleTime=90;

CABLES.UI.startIdleMode=function()
{
    if(CABLES.UI.idling)return;


    // if( CABLES.UI.idleFocus)
    // {
    //     console.log("is focussed, not starting idle mode!!");
    //     return;
    // }

    // console.log("start idle...");
    // console.log("document.hidden:",document.hidden);
    // console.log("CABLES.UI.idleFocus:",CABLES.UI.idleFocus);
    
    CABLES.UI.MODAL.show('<center><b>cables is paused!</b><br/>click to resume<br/></center>');

    gui.patch().scene.pause();
    CABLES.UI.idling=true;
    clearTimeout(CABLES.UI.idleTimeout);
}

CABLES.UI.stopIdleMode=function()
{
    if(!CABLES.UI.idling) return;

    gui.patch().scene.resume();
    CABLES.UI.MODAL.hide();
    CABLES.UI.idling=false;
    clearTimeout(CABLES.UI.idleTimeout);
}

CABLES.UI.visibilityChanged=function(e)
{
    CABLES.UI.idleTimeout=clearTimeout(CABLES.UI.idleTimeout);
    if(document.hidden) setTimeout(CABLES.UI.startIdleMode,5000);
    else CABLES.UI.stopIdleMode();
}

window.addEventListener('focus', (event) => {
    CABLES.UI.idleFocus=true;
    clearTimeout(CABLES.UI.idleTimeout);
    CABLES.UI.stopIdleMode();
});

window.addEventListener('blur', (event) => {
    CABLES.UI.idleFocus=false;
    clearTimeout(CABLES.UI.idleTimeout);
    CABLES.UI.idleTimeout=setTimeout(CABLES.UI.startIdleMode,CABLES.UI.idleTime*1000);
});

document.addEventListener('mousemove', (event) => {
    if(CABLES.UI.idleFocus)
    {
        if(CABLES.UI.idling) CABLES.UI.stopIdleMode();
        if(!document.hidden)
        {
            clearTimeout(CABLES.UI.idleTimeout);
            CABLES.UI.idleTimeout=setTimeout(CABLES.UI.startIdleMode,CABLES.UI.idleTime*1000);
        }
    }
});



CABLES.UI.idleTimeout=setTimeout(CABLES.UI.startIdleMode,CABLES.UI.idleTime*1000);

document.addEventListener("visibilitychange", CABLES.UI.visibilityChanged);

