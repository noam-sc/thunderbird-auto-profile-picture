import { expect } from 'chai';
import RecipientInitial from '../../src/src/RecipientInitial.js';
import Mail from '../../src/src/Mail.js';

const SAMPLE_AUTHOR = 'John Doe <john@example.com>';
const SAMPLE_EMAIL = 'john@example.com';

describe('RecipientInitial', () => {
    beforeEach(() => {
        // Mock browser API for testing
        globalThis.browser = {
            messengerUtilities: {
                parseMailboxString: async () => null
            }
        };
    });

    describe('getColor()', () => {
        it('should generate consistent oklch colors for the same identifier', () => {
            const identifier = SAMPLE_EMAIL;
            const color1 = RecipientInitial.getColor(identifier);
            const color2 = RecipientInitial.getColor(identifier);

            expect(color1).to.equal(color2);
            expect(color1).to.be.a('string');
        });

        it('should generate different colors for different identifiers', () => {
            const color1 = RecipientInitial.getColor('test1@example.com');
            const color2 = RecipientInitial.getColor('test2@example.com');

            expect(color1).to.not.equal(color2);
        });

        it('should return light-dark CSS function format', () => {
            const color = RecipientInitial.getColor(SAMPLE_EMAIL);

            expect(color).to.match(/^light-dark\(oklch\(.+\), oklch\(.+\)\)$/);
        });

        it('should generate valid oklch color values', () => {
            const color = RecipientInitial.getColor(SAMPLE_EMAIL);
            const match = color.match(/^light-dark\(oklch\(([0-9.]+) ([0-9.]+) ([0-9.]+)\), oklch\(([0-9.]+) ([0-9.]+) ([0-9.]+)\)\)$/);

            expect(match).to.not.be.null;

            // Check light mode values
            const lightL = parseFloat(match[1]);
            const lightC = parseFloat(match[2]);
            const lightH = parseFloat(match[3]);

            // Check dark mode values
            const darkL = parseFloat(match[4]);
            const darkC = parseFloat(match[5]);
            const darkH = parseFloat(match[6]);

            // Lightness should be in expected ranges
            expect(lightL).to.be.at.least(0.80).and.at.most(0.89);
            expect(darkL).to.be.at.least(0.40).and.at.most(0.49);

            // Chroma should be in expected ranges
            expect(lightC).to.be.at.least(0.050).and.at.most(0.054);
            expect(darkC).to.be.at.least(0.050).and.at.most(0.054);

            // Hue should be the same for both modes and in valid range
            expect(lightH).to.equal(darkH);
            expect(lightH).to.be.at.least(0).and.at.most(360);
        });

        it('should format numbers with correct precision', () => {
            const color = RecipientInitial.getColor(SAMPLE_EMAIL);
            const matches = color.match(/oklch\(([0-9.]+) ([0-9.]+) ([0-9.]+)\)/g);

            matches.forEach(match => {
                const values = match.match(/oklch\(([0-9.]+) ([0-9.]+) ([0-9.]+)\)/);
                const lightness = values[1];
                const chroma = values[2];
                const hue = values[3];

                // Check decimal places
                expect(lightness.split('.')[1]).to.have.length(2); // 2 decimal places
                expect(chroma.split('.')[1]).to.have.length(3); // 3 decimal places
                expect(hue.split('.')[1]).to.have.length(2); // 2 decimal places
            });
        });

        it('should handle empty string identifiers', () => {
            const color = RecipientInitial.getColor('');
            expect(color).to.be.a('string');
            expect(color).to.match(/^light-dark\(oklch\(.+\), oklch\(.+\)\)$/);
        });

        it('should handle special characters in identifiers', () => {
            const specialChars = ['test+tag@example.com', 'test.name@example.com', 'test_name@example.com'];

            specialChars.forEach(identifier => {
                const color = RecipientInitial.getColor(identifier);
                expect(color).to.be.a('string');
                expect(color).to.match(/^light-dark\(oklch\(.+\), oklch\(.+\)\)$/);
            });
        });

        it('should handle unicode characters in identifiers', () => {
            const unicodeIdentifiers = ['测试@example.com', 'тест@example.com', 'tëst@example.com'];

            unicodeIdentifiers.forEach(identifier => {
                const color = RecipientInitial.getColor(identifier);
                expect(color).to.be.a('string');
                expect(color).to.match(/^light-dark\(oklch\(.+\), oklch\(.+\)\)$/);
            });
        });
    });

    describe('buildInitials()', () => {
        it('should build initials object with correct structure', async () => {
            const mail = await Mail.fromAuthor(SAMPLE_AUTHOR);
            const author = SAMPLE_AUTHOR;

            const initials = RecipientInitial.buildInitials(mail, author);

            expect(initials).to.be.an('object');
            expect(initials).to.have.property('value');
            expect(initials).to.have.property('color');
        });

        it('should use mail.mail for color generation when available', async () => {
            const mail = await Mail.fromAuthor(SAMPLE_AUTHOR);
            const author = SAMPLE_AUTHOR;

            const initials = RecipientInitial.buildInitials(mail, author);
            const expectedColor = RecipientInitial.getColor(SAMPLE_EMAIL);

            expect(initials.color).to.equal(expectedColor);
        });

        it('should fallback to author for color generation when mail.mail is not available', async () => {
            const mail = await Mail.fromAuthor(SAMPLE_AUTHOR);
            mail.mail = null; // Simulate missing mail
            const author = SAMPLE_AUTHOR;

            const initials = RecipientInitial.buildInitials(mail, author);
            const expectedColor = RecipientInitial.getColor(author);

            expect(initials.color).to.equal(expectedColor);
        });

        it('should handle edge cases gracefully', async () => {
            const edgeCases = [
                { author: 'invalid-email', mail: 'invalid-email' },
                { author: 'test', mail: 'test' },
                { author: '@domain.com', mail: '@domain.com' }
            ];

            for (const edgeCase of edgeCases) {
                const mail = new Mail(edgeCase.author, edgeCase.mail);
                const initials = RecipientInitial.buildInitials(mail, edgeCase.author);

                expect(initials).to.have.property('value');
                expect(initials).to.have.property('color');
                expect(initials.value).to.match(/^\/\/INITIAL:.$/);
                expect(initials.color).to.be.a('string');
            }
        });
    });
});
