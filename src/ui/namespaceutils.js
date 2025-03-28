import defaultOps from "./defaultops.js";
import { gui } from "./gui.js";

class namespace
{

    /**
     * @param {String} opname
     * @returns {String}
     */
    getNamespace(opname)
    {
        if (!opname) return "";
        const parts = opname.split(".");
        parts.length -= 1;
        return parts.join(".") + ".";
    }

    /**
     * @param {String} namespaceName
     * @returns {Boolean}
     */
    isNamespaceNameValid(namespaceName)
    {
        return this.isOpNameValid(namespaceName, 4, 1);
    }

    /**
     * @param {String} opName
     * @param {Number} minLength
     * @param {Number} minParts
     * @returns {Boolean}
     */
    isOpNameValid(opName, minLength = 6, minParts = 3)
    {
        if (!opName) return false;
        if (opName.length < minLength) return false;
        if (opName.indexOf("..") !== -1) return false;
        let matchString = "[^abcdefghijklmnopqrstuvwxyz._ABCDEFGHIJKLMNOPQRSTUVWXYZ0-9";
        // patchops can have - because they contain the patch shortid
        if (this.isPatchOp(opName) || this.isTeamOp(opName)) matchString += "\\-";
        matchString += "]";
        if (opName.match(matchString)) return false;

        const parts = opName.split(".");
        if (parts.length < minParts) return false;

        for (let i = 0; i < parts.length; i++) // do not start
        {
            const firstChar = parts[i].charAt(0);
            const isnum = firstChar && !isNaN(firstChar);
            if (isnum) return false;
            if (firstChar === "-") return false;
        }

        if (opName.endsWith(".json")) return false;

        return opName.startsWith(defaultOps.prefixes.op);
    }

    /**
     * @param {String} opname
     * @returns {Boolean}
     */
    isDevOp(opname)
    {
        return opname && opname.includes(".Dev.");
    }

    /**
     * @param {String} opname
     * @returns {Boolean}
     */
    isUserOp(opname)
    {
        return opname && opname.startsWith(defaultOps.prefixes.userOp);
    }

    /**
     * @param {String} opname
     * @returns {Boolean}
     */
    isCurrentUserOp(opname)
    {
        return this.isUserOpOfUser(opname, gui.user.usernameLowercase);
    }

    /**
     * @param {String} opname
     * @param {String} userNameLowercase
     * @returns {Boolean}
     */
    isUserOpOfUser(opname, userNameLowercase)
    {
        return opname && opname.startsWith(defaultOps.prefixes.userOp + userNameLowercase);
    }

    /**
     * @param {String} opname
     * @returns {Boolean}
     */
    isDeprecatedOp(opname)
    {
        return opname && opname.includes(".Deprecated.");
    }

    /**
     * @param {String} opname
     * @returns {Boolean}
     */
    isExtensionOp(opname)
    {
        return opname && opname.startsWith(defaultOps.prefixes.extensionOp);
    }

    /**
     * @param {String} opname
     * @returns {Boolean}
     */
    isCoreOp(opname)
    {
        return !(this.isUserOp(opname) || this.isExtensionOp(opname) || this.isTeamOp(opname) || this.isPatchOp(opname));
    }

    /**
     * @param {String} opname
     * @returns {Boolean}
     */
    isPrivateOp(opname)
    {
        return this.isTeamOp(opname) || this.isPatchOp(opname) || this.isUserOp(opname);
    }

    /**
     * @param {String} opname
     * @returns {Boolean}
     */
    isPatchOp(opname)
    {
        return opname && opname.indexOf(defaultOps.prefixes.patchOp) === 0;
    }

    /**
     * @param {String} opname
     * @returns {Boolean}
     */
    isExtension(opname)
    {
        if (!opname) return false;
        if (!opname.startsWith(defaultOps.prefixes.extensionOp)) return false;
        if (!opname.endsWith(".")) opname += ".";
        const parts = opname.split(".");
        return parts.length < 5;
    }

    /**
     * @param {String} opname
     * @returns {Boolean}
     */
    isCollection(opname)
    {
        return opname && (this.isExtension(opname) || this.isTeamNamespace(opname));
    }

    /**
     * @param {String} opname
     * @returns {Boolean}
     */
    isTeamOp(opname)
    {
        return opname && opname.startsWith(defaultOps.prefixes.teamOp);
    }

    /**
     * @param {String} opname
     * @returns {Boolean}
     */
    isTeamNamespace(opname)
    {
        if (!opname) return false;
        if (!opname.startsWith(defaultOps.prefixes.teamOp)) return false;
        if (!opname.endsWith(".")) opname += ".";
        const parts = opname.split(".");
        return parts.length < 5;
    }
}

export default new namespace();
