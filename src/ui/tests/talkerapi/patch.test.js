/**
 * @param {import("../index.js").TestContext} t
 */
export default function (t)
{
    describe("talkerapi: patch", () =>
    {
        it("getPatch returns the current patch", (done) =>
        {
            t.platform.talkerAPI.send(t.TalkerAPI.CMD_GET_PATCH, {}, (err, patch) =>
            {
                try
                {
                    t.expect(err).to.not.exist;
                    t.expect(patch).to.be.an("object");
                    t.expect(patch.ops).to.be.an("array");
                    t.expect(patch.shortId).to.equal(t.gui.project().shortId);
                    done();
                }
                catch (e) { done(e); }
            });
        });

        it("getRecentPatches returns a list", (done) =>
        {
            t.platform.talkerAPI.send(t.TalkerAPI.CMD_GET_RECENT_PATCHES, {}, (err, res) =>
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
