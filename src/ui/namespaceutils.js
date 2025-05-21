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
     * @param {String} opname
     * @returns {String}
     */
    getCollectionName(opname)
    {
        return opname ? opname.split(".", 3).join(".") : null;
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
    isTeamOp(opname)
    {
        return opname && opname.startsWith(defaultOps.prefixes.teamOp);
    }

    isCollectionOp(opname)
    {
        return opname && (this.isExtensionOp(opname) || this.isTeamOp(opname));
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
    isTeamNamespace(opname)
    {
        if (!opname) return false;
        if (!opname.startsWith(defaultOps.prefixes.teamOp)) return false;
        if (!opname.endsWith(".")) opname += ".";
        const parts = opname.split(".");
        return parts.length < 5;
    }

    getNamespaceHierarchyProblem(outerName, innerName)
    {
        if (!outerName || !innerName) return "Unknown op";
        if (this.getNamespace(innerName).startsWith(this.getNamespace(outerName)) || this.getNamespace(outerName).startsWith(this.getNamespace(innerName))) return false;

        if (this.isCoreOp(outerName))
        {
            if (this.isExtensionOp(innerName)) return "(SubpatchOp) Core ops cannot contain extension ops.";
            if (this.isTeamOp(innerName)) return "(SubpatchOp) Core ops cannot contain team ops.";
            if (this.isUserOp(innerName)) return "(SubpatchOp) Core ops cannot contain user ops.";
            if (this.isPatchOp(innerName)) return "(SubpatchOp) Core ops cannot contain patch ops.";
        }
        else if (this.isExtensionOp(outerName))
        {
            if (this.isTeamOp(innerName)) return "(SubpatchOp) Extension ops cannot contain team ops.";
            if (this.isUserOp(innerName)) return "(SubpatchOp) Extension ops cannot contain user ops.";
            if (this.isPatchOp(innerName)) return "(SubpatchOp) Extension ops cannot contain patch ops.";
        }
        else if (this.isTeamOp(outerName))
        {
            if (this.isTeamOp(innerName) && this.getNamespace(innerName) !== this.getNamespace(outerName)) return "(SubpatchOp) Team ops cannot contain ops of other teams.";
            if (this.isUserOp(innerName)) return "(SubpatchOp) Team ops cannot contain user ops.";
            if (this.isPatchOp(innerName)) return "(SubpatchOp) Team ops cannot contain patch ops.";
        }
        else if (this.isUserOp(outerName))
        {
            if (this.isUserOp(innerName) && this.getNamespace(innerName) !== this.getNamespace(outerName)) return "(SubpatchOp) User ops cannot contain ops of other users.";
            if (this.isPatchOp(innerName)) return "(SubpatchOp) User ops cannot contain patch ops.";
        }
        else if (this.isPatchOp(outerName))
        {
            // valid in editor, since they will be renamed
            // if (this.isPatchOp(innerName) && this.getNamespace(innerName) !== this.getNamespace(outerName)) return "(SubpatchOp) Patch ops cannot contain ops of other patches.";
        }

        return false;
    }

    capitalizeNamespaceParts(opName)
    {
        if (!opName) return;
        const opUsername = gui.user ? gui.user.usernameLowercase : "";
        const nameParts = opName.split(".");
        const capitalizedParts = nameParts.map((part) =>
        {
            if (opUsername && part === opUsername) return part; // username is the only part of ops that can be lowercase
            return (part[0].toUpperCase() + part.slice(1));
        });
        return capitalizedParts.join(".");
    }

}

export default new namespace();
