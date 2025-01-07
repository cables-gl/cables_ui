import defaultOps from "./defaultops.js";

export default class namespace {}

namespace.getNamespaceClassName = (opName) =>
{
    const opNameParts = opName.split(".");
    return "nsColor_" + opNameParts[0] + "_" + opNameParts[1];
};

namespace.getNamespace = (opname) =>
{
    if (!opname) return "";
    const parts = opname.split(".");
    parts.length -= 1;
    return parts.join(".") + ".";
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
    return !namespace.isNonCoreOp(opname);
};

namespace.isNonCoreOp = (opname) =>
{
    return namespace.isUserOp(opname) || namespace.isExtensionOp(opname) || namespace.isTeamOp(opname) || namespace.isPatchOp(opname);
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



