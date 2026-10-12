/**
 * @param {import("../index.js").TestContext} t
 */
export default function (t)
{
    describe("ui: patch", () =>
    {
        let op = null;

        afterEach(() =>
        {
            if (op) t.gui.corePatch().deleteOp(op.id);
            op = null;
        });

        it("adds and deletes an op", () =>
        {
            const numOps = t.gui.corePatch().ops.length;
            op = t.gui.corePatch().addOp("Ops.Math.Sum");
            t.expect(t.gui.corePatch().ops.length).to.equal(numOps + 1);

            t.gui.corePatch().deleteOp(op.id);
            op = null;
            t.expect(t.gui.corePatch().ops.length).to.equal(numOps);
        });

        it("computes Ops.Math.Sum", () =>
        {
            op = t.gui.corePatch().addOp("Ops.Math.Sum");
            op.getPort("number1").set(2);
            op.getPort("number2").set(3);
            t.expect(op.getPort("result").get()).to.equal(5);
        });
    });
}
