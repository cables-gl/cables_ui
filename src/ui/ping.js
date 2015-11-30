function guid()
{
  function s4()
  {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

CABLES = CABLES || {};
CABLES.API = CABLES.API || {};

CABLES.API.PING ={};
CABLES.API.PING.pingDelay=10000;
CABLES.API.PING.windowUUID=guid();
CABLES.API.PING.delay=0;
CABLES.API.isConnected=true;



CABLES.API.PING.ping=function()
{
    $.ajax(
    {
        url: "/api/ping/"+CABLES.API.PING.windowUUID+'/editor',
    })
    .done(function()
    {
        CABLES.API.PING.delay=CABLES.API.PING.pingDelay;
        if(!CABLES.API.isConnected) CABLES.UI.setStatusText('connection to server ESTABLISHED...');
        CABLES.API.isConnected=true;
    })
    .fail(function()
    {
        CABLES.API.PING.delay=CABLES.API.PING.pingDelay*2;

        CABLES.API.isConnected=false;
        CABLES.UI.setStatusText('connection to server lost...');
    });

    setTimeout(CABLES.API.PING.ping,CABLES.API.PING.delay);
};

CABLES.API.PING.ping();
