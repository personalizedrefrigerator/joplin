"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const locale_1 = require("../../../locale");
const syncInfoUtils_1 = require("../../../services/synchronizer/syncInfoUtils");
const useEncryptionWarningMessage = () => {
    if (!(0, syncInfoUtils_1.getEncryptionEnabled)())
        return null;
    return (0, locale_1._)('Note: When a note is shared, it will no longer be encrypted on the server.');
};
exports.default = useEncryptionWarningMessage;
//# sourceMappingURL=useEncryptionWarningMessage.js.map