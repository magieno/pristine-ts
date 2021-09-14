/**
 * Model representing the identity that triggered the S3 event.
 */
export class IdentityModel {
    // Amazon-customer-ID-of-the-user-who-caused-the-event
    principalId: string;
}
