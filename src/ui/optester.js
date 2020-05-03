CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.OpTester = function () {};

CABLES.UI.OpTester.prototype.run = function ()
{
    function load(opname)
    {
        gui.serverOps.loadOpLibs(opname, function ()
        {
            gui.corePatch().addOp(opname);
        });
    }

    const ops = gui.opDocs.getAll();

    console.log(ops);

    for (const i in ops)
    {
        console.log(ops[i].name);
        const opname = ops[i].name;

        load(opname);
    }
};
