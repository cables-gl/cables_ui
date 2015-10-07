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

var pingDelay=10000;
var windowUUID=guid();
var delay=pingDelay;
var hasFailed=false;

var ping=function()
{
    $.ajax(
    {
        url: "/api/ping/"+windowUUID+'/editor',
    })
    .done(function()
    {
        delay=pingDelay;
        if(hasFailed) CABLES.UI.setStatusText('connection to server ESTABLISHED...');
        hasFailed=false;
    })
    .fail(function()
    {
        delay=pingDelay*2;
        hasFailed=true;
        CABLES.UI.setStatusText('connection to server lost...');
    });

    setTimeout(ping,delay);
};

ping();
