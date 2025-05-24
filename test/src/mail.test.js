import { expect } from 'chai';
import Mail from '../../src/src/Mail.js';

const SAMPLE_AUTHOR = 'John Doe <john@example.com>';
const SAMPLE_EMAIL = 'john@example.com';
const SAMPLE_SUBDOMAIN_AUTHOR = 'John Doe <john@mail.example.com>';
const UK_AUTHOR = 'John Doe <john@example.co.uk>';
const NUMBERED_AUTHOR = '123 John Doe <john@example.com>';

describe('Mail', () => {
    describe('Constructor', () => {
        it('should create a Mail instance with author and email', () => {
            const mail = new Mail(SAMPLE_AUTHOR, SAMPLE_EMAIL);
            expect(mail.author).to.equal(SAMPLE_AUTHOR);
            expect(mail.mail).to.equal(SAMPLE_EMAIL);
            expect(mail.hasName).to.be.true;
        });

        it('should detect when author has no name format', () => {
            const mail = new Mail(SAMPLE_EMAIL, SAMPLE_EMAIL);
            expect(mail.hasName).to.be.false;
        });

        it('should detect when author has name format', () => {
            const mail = new Mail(SAMPLE_AUTHOR, SAMPLE_EMAIL);
            expect(mail.hasName).to.be.true;
        });
    }); describe('parse() static method', () => {
        beforeEach(() => {
            globalThis.browser = {
                messengerUtilities: {
                    parseMailboxString: async () => null
                }
            };
        });

        it('should parse emails from various formats and handle edge cases', async () => {
            // Parse from author string with name and brackets
            let email = await Mail.parse(SAMPLE_AUTHOR);
            expect(email).to.equal(SAMPLE_EMAIL);

            // Parse from plain email
            email = await Mail.parse(SAMPLE_EMAIL);
            expect(email).to.equal(SAMPLE_EMAIL);

            // Handle uppercase and whitespace
            email = await Mail.parse('John Doe < JOHN@EXAMPLE.COM >');
            expect(email).to.equal(SAMPLE_EMAIL);

            // Handle empty string
            email = await Mail.parse('');
            expect(email).to.equal('');
        });

        it('should use browser API when available (Thunderbird 128+)', async () => {
            globalThis.browser = {
                messengerUtilities: {
                    parseMailboxString: async (author) => {
                        if (author === SAMPLE_AUTHOR) {
                            return [{ email: 'browser@example.com' }];
                        }
                        return null;
                    }
                }
            };

            const email = await Mail.parse(SAMPLE_AUTHOR);
            expect(email).to.equal('browser@example.com');
        });
    }); describe('Mail properties and basic methods', () => {
        beforeEach(() => {
            globalThis.browser = {
                messengerUtilities: {
                    parseMailboxString: async () => null
                }
            };
        });

        it('should create instance and handle name detection', async () => {
            const mailWithName = await Mail.fromAuthor(SAMPLE_AUTHOR);
            expect(mailWithName.author).to.equal(SAMPLE_AUTHOR);
            expect(mailWithName.getEmail()).to.equal(SAMPLE_EMAIL);
            expect(mailWithName.hasAName()).to.be.true;

            const mailWithoutName = await Mail.fromAuthor(SAMPLE_EMAIL);
            expect(mailWithoutName.hasAName()).to.be.false;
        });
    }); describe('Domain methods', () => {
        it('should handle domain extraction and subdomain operations', async () => {
            const mail = await Mail.fromAuthor(SAMPLE_AUTHOR);
            expect(mail.getDomain()).to.equal('example.com');
            expect(mail.getDomainWithoutTld()).to.equal('example');
            expect(mail.getTopDomain()).to.equal('example.com');
            expect(mail.hasSubDomain()).to.be.false;

            const subdomainMail = await Mail.fromAuthor(SAMPLE_SUBDOMAIN_AUTHOR);
            expect(subdomainMail.getDomain()).to.equal('mail.example.com');
            expect(subdomainMail.hasSubDomain()).to.be.true;
            expect(subdomainMail.getTopDomain()).to.equal('example.com');

            const newMail = subdomainMail.removeSubDomain();
            expect(newMail.getEmail()).to.equal(SAMPLE_EMAIL);
        });

        it('should handle special domain cases', async () => {
            const ukMail = await Mail.fromAuthor(UK_AUTHOR);
            expect(ukMail.getDomainWithoutTld()).to.equal('example.co');
            expect(ukMail.getTopDomain()).to.equal('co.uk');

            const invalidMail = await Mail.fromAuthor('invalid-email');
            expect(invalidMail.getDomain()).to.equal('');
            expect(invalidMail.hasSubDomain()).to.be.false;
        });
    }); describe('getInitial()', () => {
        it('should return first letter of author name when hasName is true', async () => {
            const mail = await Mail.fromAuthor('Z' + SAMPLE_AUTHOR);
            expect(mail.getInitial()).to.equal('Z');
        });

        it('should return first letter of author name ignoring special characters', async () => {
            const mail = await Mail.fromAuthor(NUMBERED_AUTHOR);
            expect(mail.getInitial()).to.equal('J');
        });

        it('should return first letter of email for public domains when no name', async () => {
            const mail = await Mail.fromAuthor('john@gmail.com');
            expect(mail.getInitial()).to.equal('J');
        });

        it('should return first letter of domain for private domains when no name', async () => {
            const mail = await Mail.fromAuthor('john@company.com');
            expect(mail.getInitial()).to.equal('C');
        });

        it('should handle edge cases gracefully', async () => {
            // Handle empty domain gracefully (ghost mails)
            const mail = await Mail.fromAuthor('john');
            expect(mail.getInitial()).to.equal('J');

            // Return question mark for completely empty author
            const emptyMail = await Mail.fromAuthor('');
            expect(emptyMail.getInitial()).to.equal('?');

            // Convert to uppercase
            const lowerMail = await Mail.fromAuthor(SAMPLE_AUTHOR.toLowerCase());
            expect(lowerMail.getInitial()).to.equal('J');
        });
    }); describe('Edge cases and error handling', () => {
        it('should handle malformed email addresses and empty strings gracefully', async () => {
            const invalidMail = await Mail.fromAuthor('invalid-email');
            expect(invalidMail.getDomain()).to.equal('');
            expect(invalidMail.hasSubDomain()).to.be.false;
            expect(invalidMail.getInitial()).to.equal('I');

            const emptyMail = await Mail.fromAuthor('');
            expect(emptyMail.getEmail()).to.equal('');
            expect(emptyMail.hasAName()).to.be.false;
            expect(emptyMail.getDomain()).to.equal('');
        });

        it('should handle null gracefully in constructor', () => {
            // Note: Constructor expects strings, testing what happens with null
            const mail = new Mail('test', null);
            expect(() => mail.getEmail()).to.not.throw();
            expect(() => mail.hasAName()).to.not.throw();
            // getDomain() will throw because null.split() fails
            expect(() => mail.getDomain()).to.throw();
        });
    });
});
