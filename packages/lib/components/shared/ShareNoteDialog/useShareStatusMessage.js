"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const locale_1 = require("../../../locale");
const shim_1 = require("../../../shim");
const types_1 = require("./types");
const useShareStatusMessage = ({ sharesState, noteCount }) => {
    if (sharesState === types_1.SharingStatus.Synchronizing) {
        return (0, locale_1._)('Synchronising...');
    }
    if (sharesState === types_1.SharingStatus.Creating) {
        return (0, locale_1._n)('Generating link...', 'Generating links...', noteCount);
    }
    if (sharesState === types_1.SharingStatus.Created) {
        // On web, copying text after a long delay (e.g. to sync) fails.
        // As such, the web UI for copying links is a bit different:
        if (shim_1.default.mobilePlatform() === 'web') {
            return (0, locale_1._n)('Link created!', 'Links created!', noteCount);
        }
        else {
            return (0, locale_1._n)('Link has been copied to clipboard!', 'Links have been copied to clipboard!', noteCount);
        }
    }
    return '';
};
exports.default = useShareStatusMessage;
//# sourceMappingURL=useShareStatusMessage.js.map