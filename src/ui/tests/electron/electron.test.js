import { TalkerAPI } from "cables-shared-client";
import { gui } from "../../gui.js";
import ServerOps from "../../api/opsserver.js";

/**
 * @param {import("../index.js").TestContext} t
 */
export default function (t)
{
    if (CABLES.platform.isElectron())
    {
        describe("electron: ops", () =>
        {
            it("createop and rename", (done) =>
            {
                const opname = "Ops.Hund.Hund";
                t.gui.serverOps.create(opname, (a) =>
                {

                    t.platform.talkerAPI.send(TalkerAPI.CMD_GET_OP_INFO, { "opName": a.id }, (err, res) =>
                    {
                        try
                        {
                            t.expect(err).to.not.exist;
                            t.expect(res).to.exist;
                            console.log("resss", res);

                            const renameRequest = {
                                "oldId": a.id,
                                "newName": "Ops.Hund.Katze"
                            };

                            t.platform.talkerAPI.send(TalkerAPI.CMD_ELECTRON_RENAME_OP, renameRequest, (err, res) =>
                            {
                                t.expect(err).to.not.exist;
                                t.expect(res).to.exist;
                                gui.corePatch().emitEvent(ServerOps.EVENT_OP_RENAME_FINISHED, res.data);
                                setTimeout(() =>
                                {
                                    t.platform.talkerAPI.send(TalkerAPI.CMD_ELECTRON_DELETE_OP, { "opId": a.id }, (err, res) =>
                                    {
                                        gui.corePatch().emitEvent(ServerOps.EVENT_OP_FILE_DELETE_FINISHED, res?.data);
                                        done();
                                    });
                                }, 500);
                            });
                        }
                        catch (e) { done(e); }
                    });

                }, false);
            });
        });
    }

}
