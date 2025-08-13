import { expect } from 'chai';
import MailService from '../../src/src/MailService.js';

describe('MailService.getCorrespondent - Proton aliases', () => {
    const mailService = new MailService({
        getAvatar: async () => null
    });

    describe('passmail.com aliases', () => {
        it('should handle simple passmail.com alias', async () => {
            const protonEmail = 'aws-marketing-email-replies_at_amazon_com_ltycnmavpv@passmail.com';
            const expectedEmail = 'aws-marketing-email-replies@amazon.com';

            const msg = { author: protonEmail, folder: {}, recipients: [] };
            const result = await mailService.getCorrespondent(msg);

            expect(result.getEmail()).to.equal(expectedEmail);
        });

        it('should handle passmail.com alias with subdomain', async () => {
            const protonEmail = 'hmfusa_at_servicing_hmfusa_com_adtoxf@passmail.com';
            const expectedEmail = 'hmfusa@servicing.hmfusa.com';

            const msg = { author: protonEmail, folder: {}, recipients: [] };
            const result = await mailService.getCorrespondent(msg);

            expect(result.getEmail()).to.equal(expectedEmail);
        });

        it('should handle passmail.com alias with dashes in domain', async () => {
            const protonEmail = 'posta-certificata_at_legalmail_it_dpesdredr@passmail.com';
            const expectedEmail = 'posta-certificata@legalmail.it';

            const msg = { author: protonEmail, folder: {}, recipients: [] };
            const result = await mailService.getCorrespondent(msg);

            expect(result.getEmail()).to.equal(expectedEmail);
        });
    });

    describe('passmail.net aliases', () => {
        it('should handle passmail.net alias with complex domain', async () => {
            const protonEmail = 'noreply_at_dewatermark-be991_firebaseapp_com_marznkjmrb@passmail.net';
            const expectedEmail = 'noreply@dewatermark-be991.firebaseapp.com';

            const msg = { author: protonEmail, folder: {}, recipients: [] };
            const result = await mailService.getCorrespondent(msg);

            expect(result.getEmail()).to.equal(expectedEmail);
        });

        it('should handle passmail.net alias with nested subdomains', async () => {
            const protonEmail = 'mail_at_em_marketing_ext_seagate_com_aglynsecsw@passmail.net';
            const expectedEmail = 'mail@em.marketing.ext.seagate.com';

            const msg = { author: protonEmail, folder: {}, recipients: [] };
            const result = await mailService.getCorrespondent(msg);

            expect(result.getEmail()).to.equal(expectedEmail);
        });

        it('should handle passmail.net alias with multiple _at_ in username', async () => {
            const protonEmail = 'for_at_me_at_gmail_com_psjoheozyn@passmail.net';
            const expectedEmail = 'for_at_me@gmail.com';

            const msg = { author: protonEmail, folder: {}, recipients: [] };
            const result = await mailService.getCorrespondent(msg);

            expect(result.getEmail()).to.equal(expectedEmail);
        });
    });

    describe('passinbox.com aliases', () => {
        it('should handle passinbox.com alias', async () => {
            const protonEmail = 'support_at_valuemeapp_com_yafgsnwsxe@passinbox.com';
            const expectedEmail = 'support@valuemeapp.com';

            const msg = { author: protonEmail, folder: {}, recipients: [] };
            const result = await mailService.getCorrespondent(msg);

            expect(result.getEmail()).to.equal(expectedEmail);
        });
    });

    describe('passfwd.com aliases', () => {
        it('should handle passfwd.com alias', async () => {
            const protonEmail = 'newsletter_at_example_org_randomsuffix@passfwd.com';
            const expectedEmail = 'newsletter@example.org';

            const msg = { author: protonEmail, folder: {}, recipients: [] };
            const result = await mailService.getCorrespondent(msg);

            expect(result.getEmail()).to.equal(expectedEmail);
        });
    });

    describe('Edge cases', () => {
        it('should fallback to original for invalid Proton alias pattern', async () => {
            const invalidProtonEmail = 'invalid_pattern@passmail.com';

            const msg = { author: invalidProtonEmail, folder: {}, recipients: [] };
            const result = await mailService.getCorrespondent(msg);

            expect(result.getEmail()).to.equal(invalidProtonEmail);
        });

        it('should handle Proton alias without _at_ separator', async () => {
            const invalidProtonEmail = 'no_separator_example_com_suffix@passmail.com';

            const msg = { author: invalidProtonEmail, folder: {}, recipients: [] };
            const result = await mailService.getCorrespondent(msg);

            expect(result.getEmail()).to.equal(invalidProtonEmail);
        });

        it('should not affect non-Proton domains', async () => {
            const regularEmail = 'user_at_domain_com_suffix@example.com';

            const msg = { author: regularEmail, folder: {}, recipients: [] };
            const result = await mailService.getCorrespondent(msg);

            expect(result.getEmail()).to.equal(regularEmail);
        });

        it('should handle Proton alias with numeric suffix', async () => {
            const protonEmail = 'test_at_example_com_123456@passmail.com';
            const expectedEmail = 'test@example.com';

            const msg = { author: protonEmail, folder: {}, recipients: [] };
            const result = await mailService.getCorrespondent(msg);

            expect(result.getEmail()).to.equal(expectedEmail);
        });

        it('should handle Proton alias with alphanumeric suffix', async () => {
            const protonEmail = 'test_at_example_com_abc123xyz@passmail.net';
            const expectedEmail = 'test@example.com';

            const msg = { author: protonEmail, folder: {}, recipients: [] };
            const result = await mailService.getCorrespondent(msg);

            expect(result.getEmail()).to.equal(expectedEmail);
        });
    });

    describe('Header-based resolution', () => {
        it('should use x-simplelogin-original-from header when present', async () => {
            const protonEmail = 'test_at_example_com_suffix@passmail.com';
            const headerEmail = 'original@sender.com';

            const msg = { author: protonEmail, id: 1, folder: {}, recipients: [] };
            globalThis.browser = { messages: { getFull: async () => ({ headers: { 'x-simplelogin-original-from': [headerEmail] } }) } };
            const result = await mailService.getCorrespondent(msg);

            expect(result.getEmail()).to.equal(headerEmail);
        });

        it('should fallback to email parsing when x-simplelogin-original-from header is missing', async () => {
            const protonEmail = 'test_at_example_com_suffix@passmail.com';
            const expectedEmail = 'test@example.com';

            const msg = { author: protonEmail, id: 1, folder: {}, recipients: [] };
            globalThis.browser = { messages: { getFull: async () => ({ headers: {} }) } };
            const result = await mailService.getCorrespondent(msg);

            expect(result.getEmail()).to.equal(expectedEmail);
        });
    });
});
