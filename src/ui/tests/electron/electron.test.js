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
            // ops left over from an earlier failed run
            before((done) =>
            {
                const ids = ["Ops.Hund.Hund", "Ops.Hund.Katze"].map((name) => { return gui.opDocs.getOpDocByName(name); }).filter(Boolean).map((opDoc) => { return opDoc.id; });
                let num = ids.length;
                if (num == 0) return done();
                ids.forEach((opId) =>
                {
                    t.platform.talkerAPI.send(TalkerAPI.CMD_ELECTRON_DELETE_OP, { "opId": opId }, (err, res) =>
                    {
                        gui.corePatch().emitEvent(ServerOps.EVENT_OP_FILE_DELETE_FINISHED, res?.data);
                        if (--num == 0) done();
                    });
                });
            });

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
