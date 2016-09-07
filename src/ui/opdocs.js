
CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};
CABLES.UI.OpDocs=function()
{
    var self=this;
    var opDocs=[];
    this.libs=[];

    CABLES.api.get(
        'doc/ops/all',
        function(res)
        {
            logStartup('Op docs loaded');
            opDocs=res.opDocs;
            self.libs=res.libs;
        },
        function(res){ console.log('err',res); }
        );

    this.getPopularity=function(opname)
    {
        for(var i=0;i<opDocs.length;i++)
            if(opDocs[i].name==opname)
                return opDocs[i].pop;

        return 0;
    };

    this.getAttachmentFiles=function(opname)
    {
        for(var i=0;i<opDocs.length;i++)
            if(opDocs[i].name==opname)
                return opDocs[i].attachmentFiles||[];
        return [];
    };

    this.get=function(opname)
    {
        for(var i=0;i<opDocs.length;i++)
            if(opDocs[i].name==opname)
                return opDocs[i].content;

        return '';
    };

    this.getSuggestions=function(objName,portName)
    {
        for(var i=0;i<opDocs.length;i++)
        {
            if(opDocs[i].name==objName)
            {
                if(opDocs[i].portSuggestions && opDocs[i].portSuggestions[portName])
                {
                    var suggestions=opDocs[i].portSuggestions[portName].ops;
                    return suggestions;
                }
            }
        }
    };


    this._loadedLibs=[];

    this.getOpLibs=function(opname)
    {

        for(i=0;i<opDocs.length;i++)
        {
            if(opDocs[i].name==opname)
            {
                if(opDocs[i].libs)
                {
                    var libs=[];
                    for(var j=0;j<opDocs[i].libs.length;j++)
                    {
                        var libName='/libs/'+opDocs[i].libs[j];
                        if(this._loadedLibs.indexOf(libName)==-1)
                        {
                            libs.push(libName);
                        }
                        this._loadedLibs.push(libName);
                    }

                    return libs;
                }
            }
        }
        return [];
    };

    this.loadProjectLibs=function(proj,next)
    {
        console.log('loading project libs...');

        var libsToLoad=[];
        var i=0;

        for(i=0;i<proj.ops.length;i++)
        {
            libsToLoad=libsToLoad.concat( this.getOpLibs(proj.ops[i].objName) );
        }

        libsToLoad=CABLES.uniqueArray(libsToLoad);



        console.log(libsToLoad);

        if(libsToLoad.length===0)
        {
            next();
            return;
        }

        loadjs(libsToLoad,'oplibs');

        loadjs.ready('oplibs', function()
        {
            console.log('finished loading libs...');
            next();
        });


    };

    this.loadOpLibs=function(opName,next)
    {
        var libsToLoad=this.getOpLibs(opName);

        if(libsToLoad.length===0)
        {
            next();
            return;
        }

        var lid='oplibs'+CABLES.generateUUID();
        loadjs(libsToLoad,lid);

        loadjs.ready(lid, function()
        {
            console.log('finished loading libs for '+opName);
            next();
        });


    };

};
