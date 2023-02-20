export class EmailModel {
    /**
     * The to email addresses.
     */
    toAddresses: string[];

    /**
     * The cc email addresses.
     */
    ccAddresses: string[];

    /**
     * The bcc email addresses.
     */
    bccAddresses: string[];

    /**
     * From email address
     */
    from: string;

    /**
     * The subject
     */
    subject: string;

    /**
     * The body.
     */
    body: {
        html: string;

        text: string;
    }
}