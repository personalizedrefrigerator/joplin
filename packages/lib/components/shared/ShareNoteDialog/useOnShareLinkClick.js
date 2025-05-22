"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const JoplinServerApi_1 = require("../../../JoplinServerApi");
const registry_1 = require("../../../registry");
const ShareService_1 = require("../../../services/share/ShareService");
const shim_1 = require("../../../shim");
const types_1 = require("./types");
const { useCallback } = shim_1.default.react();
const getShareLinks = (shares) => {
    const links = [];
    for (const share of shares) {
        links.push(ShareService_1.default.instance().shareUrl(ShareService_1.default.instance().userId, share));
    }
    return links;
};
const useOnShareLinkClick = ({ setSharesState, onShareUrlsReady, notes, recursiveShare, }) => {
    return useCallback(async () => {
        const service = ShareService_1.default.instance();
        let hasSynced = false;
        let tryToSync = false;
        while (true) {
            try {
                if (tryToSync) {
                    setSharesState(types_1.SharingStatus.Synchronizing);
                    await registry_1.reg.waitForSyncFinishedThenSync();
                    tryToSync = false;
                    hasSynced = true;
                }
                setSharesState(types_1.SharingStatus.Creating);
                const newShares = [];
                for (const note of notes) {
                    const share = await service.shareNote(note.id, recursiveShare);
                    newShares.push(share);
                }
                setSharesState(types_1.SharingStatus.Synchronizing);
                await registry_1.reg.waitForSyncFinishedThenSync();
                setSharesState(types_1.SharingStatus.Creating);
                onShareUrlsReady(getShareLinks(newShares));
                setSharesState(types_1.SharingStatus.Created);
                await ShareService_1.default.instance().refreshShares();
            }
            catch (error) {
                if (error.code === 404 && !hasSynced) {
                    registry_1.reg.logger().info('ShareNoteDialog: Note does not exist on server - trying to sync it.', error);
                    tryToSync = true;
                    continue;
                }
                registry_1.reg.logger().error('ShareNoteDialog: Cannot publish note:', error);
                setSharesState(types_1.SharingStatus.Idle);
                void shim_1.default.showErrorDialog(JoplinServerApi_1.default.connectionErrorMessage(error));
            }
            break;
        }
    }, [recursiveShare, notes]);
};
exports.default = useOnShareLinkClick;
//# sourceMappingURL=useOnShareLinkClick.js.map