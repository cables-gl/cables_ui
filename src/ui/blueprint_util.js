

export function executeBlueprintIfMultiple(opname, next)
{
    const ops = gui.corePatch().getOpsByObjName(opname);

    if (ops.length > 0)
    {
        console.log("execute bp op");
        gui.serverOps.execute(opname, next);
    }
    else
    {
        console.log("no need to execute bp op");
        next();
    }
}
