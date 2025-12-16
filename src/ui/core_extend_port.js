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
        super(op, name, type, uiAttribs = {});

    }

    /**
     * @param {any} v
     */
    _onSetProfiling(v) // used in editor: profiler tab
    {
        if (this.op.patch.debuggerEnabled)
        {
            // console.log(this.op.name + " - port " + this.name + ": set value to " + v);
            const cv = v;

            this.op.patch.emitEvent("debuggerstep",
                {
                    "opname": this.op.name,
                    "opid": this.op.id,
                    "portname": this.name,
                    "log": this.op.name + " - port " + this.name + ": set value to " + v,
                    "exec": () =>
                    {
                        this.setValue(cv);
                    }
                });
            return;
        }

        this.op.patch.profiler.add("port", this);
        this.setValue(v);
        this.op.patch.profiler.add("port", null);
    }

    _onTriggeredProfiling() // used in editor: profiler tab
    {
        if (this.op.enabled && this.onTriggered)
        {
            if (this.op.patch.debuggerEnabled)
            {
                console.log();
                this.op.patch.emitEvent("debuggerstep",
                    {
                        "opname": this.op.name,
                        "opid": this.op.id,
                        "portname": this.name,
                        "log": this.op.name + " - triggered " + this.name,
                        "exec": () =>
                        {
                            this.onTriggered();
                        }

                    });
                return;

            }

            this.op.patch.profiler.add("port", this);
            this.onTriggered();
            this.op.patch.profiler.add("port", null);
        }
    }

}

export { UiPort };
