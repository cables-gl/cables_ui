CABLES.libLoader=function(libnames,cb)
{
    this.libsToLoad=libnames;
    this._cb=cb;
    console.log('libsToLoad: '+this.libsToLoad.length);

    gui.jobs().start({
        id: 'loadlibs',
        title: 'loading libs'
    });



    for(var i in libnames)
    {

        this.loadLib(libnames[i]);
    }

      


};

CABLES.libLoader.prototype.loadLib=function(name)
{

    CABLES.onLoadedLib[name]=function(name)
    {
        var i=this.libsToLoad.indexOf(name);
        this.libsToLoad.splice(i, 1);
        console.log('libsToLoad: '+this.libsToLoad.length);
        console.log('loaded lib: '+name);

        if(this.libsToLoad.length==0)
        {
            if(this._cb)this._cb();
            gui.jobs().finish('loadlibs');
        }
        
        
    }.bind(this);

    var newscript = document.createElement('script');
    newscript.type = 'text/javascript';
    newscript.async = true;
    newscript.src = '/api/lib/'+name;
    (document.getElementsByTagName('head')[0]||document.getElementsByTagName('body')[0]).appendChild(newscript);


};




CABLES.onLoadedLib={};

CABLES.loadedLib=function(name)
{
    if(CABLES.onLoadedLib[name])
    {
        CABLES.onLoadedLib[name](name);
    }
}