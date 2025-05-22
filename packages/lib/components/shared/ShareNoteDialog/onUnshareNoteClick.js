"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ShareService_1 = require("../../../services/share/ShareService");
const onUnshareNoteClick = async (event) => {
    await ShareService_1.default.instance().unshareNote(event.noteId);
    await ShareService_1.default.instance().refreshShares();
};
exports.default = onUnshareNoteClick;
//# sourceMappingURL=onUnshareNoteClick.js.map