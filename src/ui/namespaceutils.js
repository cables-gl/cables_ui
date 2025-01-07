import defaultOps from "./defaultops.js";

export default class namespace {}

namespace.getNamespaceClassName = function (opName)
{
    const opNameParts = opName.split(".");
    return "nsColor_" + opNameParts[0] + "_" + opNameParts[1];
};

namespace.getNamespace = function (opname)
{
    if (!opname) return "";
    const parts = opname.split(".");
    parts.length -= 1;
    return parts.join(".") + ".";
};

namespace.isDevOp = function (opname)
{
    return opname && opname.includes(".Dev.");
};

namespace.isUserOp = function (opname)
{
    return opname && opname.startsWith(defaultOps.prefixes.userOp);
};

namespace.isCurrentUserOp = function (opname)
{
    return namespace.isUserOpOfUser(opname, gui.user.usernameLowercase);
};

namespace.isUserOpOfUser = function (opname, userNameLowercase)
{
    return opname && opname.startsWith(defaultOps.prefixes.userOp + userNameLowercase);
};

namespace.isDeprecatedOp = function (opname)
{
    return opname && opname.includes(".Deprecated.");
};

namespace.isExtensionOp = function (opname)
{
    return opname && opname.startsWith(defaultOps.prefixes.extensionOp);
};

namespace.isCoreOp = function (opname)
{
    return !namespace.isNonCoreOp(opname);
};

namespace.isNonCoreOp = function (opname)
{
    return namespace.isUserOp(opname) || namespace.isExtensionOp(opname) || namespace.isTeamOp(opname) || namespace.isPatchOp(opname);
};

namespace.isPrivateOp = function (opname)
{
    return namespace.isTeamOp(opname) || namespace.isPatchOp(opname) || namespace.isUserOp(opname);
};

namespace.isPatchOp = function (opname)
{
    return opname && opname.indexOf(defaultOps.prefixes.patchOp) === 0;
};

namespace.isExtension = function (opname)
{
    if (!opname) return false;
    if (!opname.startsWith(defaultOps.prefixes.extensionOp)) return false;
    if (!opname.endsWith(".")) opname += ".";
    const parts = opname.split(".");
    return parts.length < 5;
};

namespace.isCollection = function (opname)
{
    return opname && (namespace.isExtension(opname) || namespace.isTeamNamespace(opname));
};

namespace.isTeamOp = function (opname)
{
    return opname && opname.startsWith(defaultOps.prefixes.teamOp);
};

namespace.isTeamNamespace = function (opname)
{
    if (!opname) return false;
    if (!opname.startsWith(defaultOps.prefixes.teamOp)) return false;
    if (!opname.endsWith(".")) opname += ".";
    const parts = opname.split(".");
    return parts.length < 5;
};



