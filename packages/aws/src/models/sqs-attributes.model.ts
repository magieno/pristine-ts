
export class SqsAttributesModel {
    approximateReceiveCount?: number;
    sentTime: Date;
    senderId: string;
    approximateFirstReceiveTime: Date;

    // For fifo queues
    sequenceNumber?: number;
    messageGroupId?: string;
    messageDeduplicationId?: string;
}
