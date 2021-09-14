/**
 * Model representing the attributes of the sqs event.
 */
export class SqsAttributesModel {
    approximateReceiveCount?: number;
    sentTime: Date;
    senderId: string;
    approximateFirstReceiveTime: Date;

    // For fifo queues
    sequenceNumber?: string;
    messageGroupId?: string;
    messageDeduplicationId?: string;
}
