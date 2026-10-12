import { TalkerAPI } from "cables-shared-client";
import { gui } from "../../gui.js";
import ServerOps from "../../api/opsserver.js";

/**
 * @param {import("../index.js").TestContext} t
 */
export default function (t)
{
    describe("talkerapi: ops", () =>
    {
        const opName = "Ops.Math.Sum";

        it("getOpCode returns code of a core op", (done) =>
        {
            t.platform.talkerAPI.send(TalkerAPI.CMD_GET_OP_CODE, { "opname": opName, "projectId": t.gui.patchId }, (err, res) =>
            {
                try
                {
                    t.expect(err).to.not.exist;
                    t.expect(res.name).to.equal(opName);
                    t.expect(res.code).to.be.a("string").and.not.be.empty;
                    done();
                }
                catch (e) { done(e); }
            });
        });

        it("createop and rename", (done) =>
        {
            const opname = "Ops.Hund.Katze";
            t.gui.serverOps.create(opname, (a) =>
            {

                console.log("aaa", a);
                t.platform.talkerAPI.send(TalkerAPI.CMD_GET_OP_INFO, { "opName": a.id }, (err, res) =>
                {
                    try
                    {
                        t.expect(err).to.not.exist;
                        t.expect(res).to.exist;
                        console.log("resss", res);

                        const renameRequest = {
                            "opname": opname,
                            "name": opname + "....."
                        };

                        t.platform.talkerAPI.send(TalkerAPI.CMD_ELECTRON_RENAME_OP, renameRequest, (err, res) =>
                        {
                            t.expect(err).to.exist;
                            gui.corePatch().emitEvent(ServerOps.EVENT_OP_RENAME_FINISHED, res.data);

                            done();
                        });

                    }
                    catch (e) { done(e); }
                });

            }, false);
        });

        it("getOpInfo returns info of a core op", (done) =>
        {
            t.platform.talkerAPI.send(TalkerAPI.CMD_GET_OP_INFO, { "opName": opName }, (err, res) =>
            {
                try
                {
                    t.expect(err).to.not.exist;
                    t.expect(res).to.exist;
                    done();
                }
                catch (e) { done(e); }
            });
        });
    });
}
