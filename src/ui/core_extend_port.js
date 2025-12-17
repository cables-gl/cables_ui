import { Port } from "cables";

class UiPort extends Port
{

    /**
     * @param {import("cables").Op} op
     * @param {string} name
     * @param {number} type
     */
    constructor(op, name, type, uiAttribs = {})
    {
        super(op, name, type, uiAttribs);
    }

    _onStepDebugTriggered()
    {

        this.op.patch.continueStepDebugLog.push({
            "port": this,
            "action": "triggered in"
        });
        // this.op.patch.continueStepDebugSet.push(() =>
        // {
        console.log("port trigger", this.op.name, this.name,);
        this.onTriggered();

        // });
        // console.log("steps", gui.corePatch().continueStepDebugSet.length);
    }

    _onStepDebugTrigger()
    {

        this.op.patch.continueStepDebugLog.push({
            "port": this,
            "action": "triggered out"
        });
        // this.op.patch.continueStepDebugSet.push(() =>
        // {
        console.log("port trigger out", this.op.name, this.name,);
        this._ogTrigger();

        // });
        // console.log("steps", gui.corePatch().continueStepDebugSet.length);
    }

    _onStepDebugSet(v)
    {

        // this.op.patch.continueStepDebugSet.push(() =>
        // {
        this.op.patch.continueStepDebugLog.push({
            "port": this,
            "action": "set ",
            "vold": structuredClone(this.get()),
            "v": structuredClone(v)
        });
        console.log("port set", this.op.name, this.name, v);
        this.setValue(v);

        // });
        // console.log("steps", gui.corePatch().continueStepDebugSet.length);

    }

    /**
     * @param {any} v
     */
    _onSetProfiling(v) // used in editor: profiler tab
    {
        // if (this.op.patch.debuggerEnabled)
        // {
        //     // console.log(this.op.name + " - port " + this.name + ": set value to " + v);
        //     const cv = v;

        //     this.op.patch.emitEvent("debuggerstep",
        //         {
        //             "opname": this.op.name,
        //             "opid": this.op.id,
        //             "portname": this.name,
        //             "log": this.op.name + " - port " + this.name + ": set value to " + v,
        //             "exec": () =>
        //             {
        //                 this.setValue(cv);
        //             }
        //         });
        //     return;
        // }

        this.op.patch.profiler.add("port", this);
        this.setValue(v);
        this.op.patch.profiler.add("port", null);
    }

    _onTriggeredProfiling() // used in editor: profiler tab
    {
        if (this.op.enabled && this.onTriggered)
        {
            // if (this.op.patch.debuggerEnabled)
            // {
            //     console.log();
            //     this.op.patch.emitEvent("debuggerstep",
            //         {
            //             "opname": this.op.name,
            //             "opid": this.op.id,
            //             "portname": this.name,
            //             "log": this.op.name + " - triggered " + this.name,
            //             "exec": () =>
            //             {
            //                 this.onTriggered();
            //             }

            //         });
            //     return;

            // }

            this.op.patch.profiler.add("port", this);
            this.onTriggered();
            this.op.patch.profiler.add("port", null);
        }
    }

}

export { UiPort };
