import { expect } from 'chai';
import MailService from '../src/src/MailService.js';

describe('MailService.getCorrespondent - DuckDuckGo relay', () => {
    const mailService = new MailService({
        getAvatar: async () => null
    });

    it('should handle Duck relay pattern', async () => {
        let msg = { author: 'realsender_at_email.com_user-alias-email@duck.com', folder: {}, recipients: [] };
        let result = await mailService.getCorrespondent(msg);
        expect(result).to.equal('realsender@email.com');
    });

    it('should fallback to original for no Duck relay pattern', async () => {
        let msg = { author: 'random@duck.com', folder: {}, recipients: [] };
        let result = await mailService.getCorrespondent(msg);
        expect(result).to.equal('random@duck.com');
    });

    it('should handle Google Drive proxy', async () => {
        let msg = { author: 'drive-shares-noreply@google.com', id: 1, folder: {}, recipients: [] };
        globalThis.browser = { messages: { getFull: async () => ({ headers: { 'reply-to': ['real@sender.com'] } }) } };
        let result = await mailService.getCorrespondent(msg);
        expect(result).to.equal('real@sender.com');
    });
});
