import defaultOps from "./defaultops.js";
import { gui } from "./gui.js";

export default class namespace {}

namespace.getNamespace = (opname) =>
{
    if (!opname) return "";
    const parts = opname.split(".");
    parts.length -= 1;
    return parts.join(".") + ".";
};

namespace.isOpNameValid = (opName) =>
{
    if (!opName) return false;
    if (opName.length < 6) return false;
    if (opName.indexOf("..") !== -1) return false;
    let matchString = "[^abcdefghijklmnopqrstuvwxyz._ABCDEFGHIJKLMNOPQRSTUVWXYZ0-9";
    // patchops can have - because they contain the patch shortid
    if (namespace.isPatchOp(opName) || namespace.isTeamOp(opName)) matchString += "\\-";
    matchString += "]";
    if (opName.match(matchString)) return false;

    const parts = opName.split(".");
    if(parts.length < 3) return false;

    for (let i = 0; i < parts.length; i++) // do not start
    {
        const firstChar = parts[i].charAt(0);
        const isnum = !isNaN(firstChar);
        if (isnum) return false;
        if (firstChar === "-") return false;
    }

    if (opName.endsWith(".json")) return false;

    return opName.startsWith(defaultOps.prefixes.op);
};

namespace.isDevOp = (opname) =>
{
    return opname && opname.includes(".Dev.");
};

namespace.isUserOp = (opname) =>
{
    return opname && opname.startsWith(defaultOps.prefixes.userOp);
};

namespace.isCurrentUserOp = (opname) =>
{
    return namespace.isUserOpOfUser(opname, gui.user.usernameLowercase);
};

namespace.isUserOpOfUser = (opname, userNameLowercase) =>
{
    return opname && opname.startsWith(defaultOps.prefixes.userOp + userNameLowercase);
};

namespace.isDeprecatedOp = (opname) =>
{
    return opname && opname.includes(".Deprecated.");
};

namespace.isExtensionOp = (opname) =>
{
    return opname && opname.startsWith(defaultOps.prefixes.extensionOp);
};

namespace.isCoreOp = (opname) =>
{
    return !(namespace.isUserOp(opname) || namespace.isExtensionOp(opname) || namespace.isTeamOp(opname) || namespace.isPatchOp(opname));
};

namespace.isPrivateOp = (opname) =>
{
    return namespace.isTeamOp(opname) || namespace.isPatchOp(opname) || namespace.isUserOp(opname);
};

namespace.isPatchOp = (opname) =>
{
    return opname && opname.indexOf(defaultOps.prefixes.patchOp) === 0;
};

namespace.isExtension = (opname) =>
{
    if (!opname) return false;
    if (!opname.startsWith(defaultOps.prefixes.extensionOp)) return false;
    if (!opname.endsWith(".")) opname += ".";
    const parts = opname.split(".");
    return parts.length < 5;
};

namespace.isCollection = (opname) =>
{
    return opname && (namespace.isExtension(opname) || namespace.isTeamNamespace(opname));
};

namespace.isTeamOp = (opname) =>
{
    return opname && opname.startsWith(defaultOps.prefixes.teamOp);
};

namespace.isTeamNamespace = (opname) =>
{
    if (!opname) return false;
    if (!opname.startsWith(defaultOps.prefixes.teamOp)) return false;
    if (!opname.endsWith(".")) opname += ".";
    const parts = opname.split(".");
    return parts.length < 5;
};
