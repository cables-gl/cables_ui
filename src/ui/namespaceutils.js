import defaultOps from "./defaultops.js";
import { gui } from "./gui.js";

export default class namespace {}

/**
 * @param {String} opname
 * @returns {String}
 */
namespace.getNamespace = (opname) =>
{
    if (!opname) return "";
    const parts = opname.split(".");
    parts.length -= 1;
    return parts.join(".") + ".";
};

/**
 * @param {String} opName
 * @returns {Boolean}
 */
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
    if (parts.length < 3) return false;

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

/**
 * @param {String} opname
 * @returns {Boolean}
 */
namespace.isDevOp = (opname) =>
{
    return opname && opname.includes(".Dev.");
};

/**
 * @param {String} opname
 * @returns {Boolean}
 */
namespace.isUserOp = (opname) =>
{
    return opname && opname.startsWith(defaultOps.prefixes.userOp);
};

/**
 * @param {String} opname
 * @returns {Boolean}
 */
namespace.isCurrentUserOp = (opname) =>
{
    return namespace.isUserOpOfUser(opname, gui.user.usernameLowercase);
};

/**
 * @param {String} opname
 * @param {String} userNameLowercase
 * @returns {Boolean}
 */
namespace.isUserOpOfUser = (opname, userNameLowercase) =>
{
    return opname && opname.startsWith(defaultOps.prefixes.userOp + userNameLowercase);
};

/**
 * @param {String} opname
 * @returns {Boolean}
 */
namespace.isDeprecatedOp = (opname) =>
{
    return opname && opname.includes(".Deprecated.");
};

/**
 * @param {String} opname
 * @returns {Boolean}
 */
namespace.isExtensionOp = (opname) =>
{
    return opname && opname.startsWith(defaultOps.prefixes.extensionOp);
};

/**
 * @param {String} opname
 * @returns {Boolean}
 */
namespace.isCoreOp = (opname) =>
{
    return !(namespace.isUserOp(opname) || namespace.isExtensionOp(opname) || namespace.isTeamOp(opname) || namespace.isPatchOp(opname));
};

/**
 * @param {String} opname
 * @returns {Boolean}
 */
namespace.isPrivateOp = (opname) =>
{
    return namespace.isTeamOp(opname) || namespace.isPatchOp(opname) || namespace.isUserOp(opname);
};

/**
 * @param {String} opname
 * @returns {Boolean}
 */
namespace.isPatchOp = (opname) =>
{
    return opname && opname.indexOf(defaultOps.prefixes.patchOp) === 0;
};

/**
 * @param {String} opname
 * @returns {Boolean}
 */
namespace.isExtension = (opname) =>
{
    if (!opname) return false;
    if (!opname.startsWith(defaultOps.prefixes.extensionOp)) return false;
    if (!opname.endsWith(".")) opname += ".";
    const parts = opname.split(".");
    return parts.length < 5;
};

/**
 * @param {String} opname
 * @returns {Boolean}
 */
namespace.isCollection = (opname) =>
{
    return opname && (namespace.isExtension(opname) || namespace.isTeamNamespace(opname));
};

/**
 * @param {String} opname
 * @returns {Boolean}
 */
namespace.isTeamOp = (opname) =>
{
    return opname && opname.startsWith(defaultOps.prefixes.teamOp);
};

/**
 * @param {String} opname
 * @returns {Boolean}
 */
namespace.isTeamNamespace = (opname) =>
{
    if (!opname) return false;
    if (!opname.startsWith(defaultOps.prefixes.teamOp)) return false;
    if (!opname.endsWith(".")) opname += ".";
    const parts = opname.split(".");
    return parts.length < 5;
};
