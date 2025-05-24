import { expect } from 'chai';
import MailService from '../../src/src/MailService.js';

const GOOGLE_DRIVE_PROXY_EMAIL = 'drive-shares-noreply@google.com';
const GOOGLE_DRIVE_REAL_EMAIL = 'real@sender.com';
const DUCK_RELAY_EMAIL = 'realsender_at_email.com_user-alias-email@duck.com';
const DUCK_REAL_EMAIL = 'realsender@email.com';
const DUCK_INVALID_RELAY_EMAIL = 'invalid_relay_email@duck.com';

describe('MailService.getCorrespondent - relays', () => {
    const mailService = new MailService({
        getAvatar: async () => null
    });

    it('should handle Duck relay pattern', async () => {
        let msg = { author: DUCK_RELAY_EMAIL, folder: {}, recipients: [] };
        let result = await mailService.getCorrespondent(msg);
        expect(result).to.equal(DUCK_REAL_EMAIL);
    });

    it('should fallback to original for no Duck relay pattern', async () => {
        let msg = { author: DUCK_INVALID_RELAY_EMAIL, folder: {}, recipients: [] };
        let result = await mailService.getCorrespondent(msg);
        expect(result).to.equal(DUCK_INVALID_RELAY_EMAIL);
    });

    it('should handle Google Drive proxy', async () => {
        let msg = { author: GOOGLE_DRIVE_PROXY_EMAIL, id: 1, folder: {}, recipients: [] };
        globalThis.browser = { messages: { getFull: async () => ({ headers: { 'reply-to': [GOOGLE_DRIVE_REAL_EMAIL] } }) } };
        let result = await mailService.getCorrespondent(msg);
        expect(result).to.equal(GOOGLE_DRIVE_REAL_EMAIL);
    });

    it('should return author if no reply-to header when Google Drive proxy', async () => {
        let msg = { author: GOOGLE_DRIVE_PROXY_EMAIL, id: 1, folder: {}, recipients: [] };
        globalThis.browser = { messages: { getFull: async () => ({ headers: {} }) } };
        let result = await mailService.getCorrespondent(msg);
        expect(result).to.equal(GOOGLE_DRIVE_PROXY_EMAIL);
    });
});