// + Carlos R. L. Rodrigues
// @ http://jsfromhell.com/classes/math-parser [rev. #3]

const MathParser = function ()
{
    let o = this, p = o.operator = {};
    p["+"] = function (n, m) { return n + m; };
    p["-"] = function (n, m) { return n - m; };
    p["*"] = function (n, m) { return n * m; };
    p["/"] = function (m, n) { return n / m; };
    p["%"] = function (m, n) { return n % m; };
    p["^"] = function (m, n) { return n ** m; };
    p["~"] = function (m, n) { return Math.sqrt(n, m); };
    o.custom = {}, p.f = function (s, n)
    {
        if (Math[s]) return Math[s](n);
        else if (o.custom[s]) return o.custom[s].apply(o, n);
        else throw new Error("Function \"" + s + "\" not defined.");
    }, o.add = function (n, f) { this.custom[n] = f; };
};
MathParser.prototype.eval = function (e, ig)
{
    let v = [], p = [], i, _, a, c = 0, s = 0, x, t = !ig ? e.indexOf("^") : -1, d = null;
    var cp = e, e = e.split(""), n = "0123456789.", o = "+-/*^%~", f = this.operator;
    if (t + 1)
        do
        {
            for (a = "", _ = t - 1; _ && o.indexOf(e[_]) < 0; a += e[_], e[_--] = "") ;
            a += "^";
            for (_ = t + 1, i = e.length; _ < i && o.indexOf(e[_]) < 0; a += e[_], e[_++] = "") ;
            e = e.slice(0, t)
                .concat((this.eval(a, 1) + "").split(""))
                .concat(e.slice(t + 1));
        }
        while (t = cp.indexOf("^", ++t) + 1);
    let l;
    for (i = 0, l = e.length; i < l; i++)
    {
        if (o.indexOf(e[i]) > -1)
            e[i] == "-" && (s > 1 || d === null) && ++s, !s && d !== null && (p.push(e[i]), s = 2), "+-".indexOf(e[i]) < (d = null) && (c = 1);
        else if (a = n.indexOf(e[i]) + 1 ? e[i++] : "")
        {
            while (n.indexOf(e[i]) + 1) a += e[i++];
            v.push(d = (s & 1 ? -1 : 1) * a), c && v.push(f[p.pop()](v.pop(), v.pop())) && (c = 0), --i, s = 0;
        }
    }
    for (c = v[0], i = 0, l = p.length; l--; c = f[p[i]](c, v[++i])) ;
    return c;
};
MathParser.prototype.parse = function (e)
{
    let p = [], f = [], ag, n, c, a, o = this, v = "0123456789.+-*/^%~(, )";
    for (var x, i = 0, l = e.length; i < l; i++)
    {
        if (v.indexOf(c = e.charAt(i)) < 0)
        {
            for (a = c; v.indexOf(c = e.charAt(++i)) < 0; a += c) ;
            f.push((--i, a));
        }
        else if (!(c == "(" && p.push(i)) && c == ")")
        {
            if (a = e.slice(0, (n = p.pop()) - (x = v.indexOf(e.charAt(n - 1)) < 0 ? y = (c = f.pop()).length : 0)), x)
                for (let j = (ag = e.slice(n, ++i)
                    .split(",")).length; j--; ag[j] = o.eval(ag[j])) ;
            l = (e = a + (x ? o.operator.f(c, ag) : o.eval(e.slice(n, ++i))) + e.slice(i)).length, i -= i - n + c.length;
        }
    }
    let r = o.eval(e);

    if (!CABLES.UTILS.isNumeric(r))
    {
        console.warn("non numeric math eval result");
        r = 0;
    }

    return r;
};

export default MathParser;


