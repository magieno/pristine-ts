import "reflect-metadata"
import {
  CreateEmailIdentityCommand,
  GetAccountCommand,
  GetEmailIdentityCommand,
  PutEmailIdentityMailFromAttributesCommand,
  SendEmailCommand,
} from "@aws-sdk/client-sesv2";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {SesV2Client} from "./ses-v2.client";
import {SesV2RequestError} from "../errors/ses-v2-request.error";

describe("SES v2 client", () => {
  const logHandlerMock: LogHandlerInterface = {
    critical(message: string, extra?: any): void {
    }, debug(message: string, extra?: any): void {
    }, error(message: string, extra?: any): void {
    }, info(message: string, extra?: any): void {
    }, success(message: string, extra?: any): void {
    }, notice(message: string, extra?: any): void {
    }, warning(message: string, extra?: any): void {
    }, terminate() {
    }
  }

  const createClient = (send: jest.Mock) => {
    const client = new SesV2Client(logHandlerMock, "us-east-2");
    client.getClient = () => ({send} as any);
    return client;
  }

  const awsError = (name: string, httpStatusCode: number, retryable?: any) => {
    const error: any = new Error(name);
    error.name = name;
    error.$metadata = {httpStatusCode};
    error.$retryable = retryable;
    return error;
  }

  it("should use the configured region.", async () => {
    expect(await new SesV2Client(logHandlerMock, "us-east-2").getClient().config.region()).toBe("us-east-2");
  })

  it("should send a raw email with its tags and configuration set.", async () => {
    const send = jest.fn().mockResolvedValue({MessageId: "abc", $metadata: {httpStatusCode: 200}});

    const result = await createClient(send).sendRawEmail({
      rawMessage: "Subject: Hi\r\n\r\nHello",
      from: "noreply@example.com",
      destinations: ["marie@example.com"],
      configurationSetName: "default",
      tags: {project: "p1"},
    });

    expect(result.messageId).toBe("abc");
    const command: SendEmailCommand = send.mock.calls[0][0];
    expect(command).toBeInstanceOf(SendEmailCommand);
    expect(command.input.FromEmailAddress).toBe("noreply@example.com");
    expect(command.input.Destination).toEqual({ToAddresses: ["marie@example.com"]});
    expect(command.input.ConfigurationSetName).toBe("default");
    expect(command.input.EmailTags).toEqual([{Name: "project", Value: "p1"}]);
    expect(new TextDecoder().decode(command.input.Content!.Raw!.Data)).toBe("Subject: Hi\r\n\r\nHello");
  })

  it("should mark throttling as retryable and a rejected message as permanent.", async () => {
    const throttled = createClient(jest.fn().mockRejectedValue(awsError("TooManyRequestsException", 429, {throttling: true})));
    const rejected = createClient(jest.fn().mockRejectedValue(awsError("MessageRejected", 400)));

    const throttledError: SesV2RequestError = await throttled.sendRawEmail({rawMessage: "x"}).catch(e => e);
    const rejectedError: SesV2RequestError = await rejected.sendRawEmail({rawMessage: "x"}).catch(e => e);

    expect(throttledError).toBeInstanceOf(SesV2RequestError);
    expect(throttledError.isRetryable).toBe(true);
    expect(throttledError.awsErrorName).toBe("TooManyRequestsException");
    expect(rejectedError.isRetryable).toBe(false);
    expect(rejectedError.awsErrorName).toBe("MessageRejected");
    expect(rejectedError.operation).toBe("SendEmail");
  })

  it("should mark a server error as retryable.", async () => {
    const client = createClient(jest.fn().mockRejectedValue(awsError("InternalFailure", 500)));
    const error: SesV2RequestError = await client.getAccount().catch(e => e);
    expect(error.isRetryable).toBe(true);
  })

  it("should return the DKIM tokens of a new identity.", async () => {
    const send = jest.fn().mockResolvedValue({
      IdentityType: "DOMAIN",
      VerifiedForSendingStatus: false,
      DkimAttributes: {Status: "PENDING", Tokens: ["t1", "t2", "t3"]},
    });

    const identity = await createClient(send).createEmailIdentity("example.com", "default");

    expect(send.mock.calls[0][0]).toBeInstanceOf(CreateEmailIdentityCommand);
    expect(send.mock.calls[0][0].input).toEqual({EmailIdentity: "example.com", ConfigurationSetName: "default"});
    expect(identity.identity).toBe("example.com");
    expect(identity.dkimStatus).toBe("PENDING");
    expect(identity.dkimTokens).toEqual(["t1", "t2", "t3"]);
    expect(identity.verifiedForSendingStatus).toBe(false);
  })

  it("should map an existing identity.", async () => {
    const send = jest.fn().mockResolvedValue({
      IdentityType: "DOMAIN",
      VerifiedForSendingStatus: true,
      VerificationStatus: "SUCCESS",
      DkimAttributes: {Status: "SUCCESS", Tokens: ["t1"]},
      MailFromAttributes: {MailFromDomain: "bounce.example.com", MailFromDomainStatus: "SUCCESS"},
    });

    const identity = await createClient(send).getEmailIdentity("example.com");

    expect(send.mock.calls[0][0]).toBeInstanceOf(GetEmailIdentityCommand);
    expect(identity).toEqual(expect.objectContaining({
      identity: "example.com",
      verifiedForSendingStatus: true,
      verificationStatus: "SUCCESS",
      dkimStatus: "SUCCESS",
      mailFromDomain: "bounce.example.com",
      mailFromDomainStatus: "SUCCESS",
    }));
  })

  it("should return null for an unknown identity and ignore its deletion.", async () => {
    const client = createClient(jest.fn().mockRejectedValue(awsError("NotFoundException", 404)));

    expect(await client.getEmailIdentity("unknown.com")).toBeNull();
    await expect(client.deleteEmailIdentity("unknown.com")).resolves.toBeUndefined();
  })

  it("should set the MAIL FROM domain with the right MX failure behavior.", async () => {
    const send = jest.fn().mockResolvedValue({});
    const client = createClient(send);

    await client.putEmailIdentityMailFromAttributes("example.com", "bounce.example.com");
    await client.putEmailIdentityMailFromAttributes("example.com", "bounce.example.com", false);

    expect(send.mock.calls[0][0]).toBeInstanceOf(PutEmailIdentityMailFromAttributesCommand);
    expect(send.mock.calls[0][0].input.BehaviorOnMxFailure).toBe("USE_DEFAULT_VALUE");
    expect(send.mock.calls[1][0].input.BehaviorOnMxFailure).toBe("REJECT_MESSAGE");
  })

  it("should map the account limits.", async () => {
    const send = jest.fn().mockResolvedValue({
      SendingEnabled: true,
      ProductionAccessEnabled: false,
      EnforcementStatus: "HEALTHY",
      SendQuota: {MaxSendRate: 1, Max24HourSend: 200, SentLast24Hours: 3},
    });

    const account = await createClient(send).getAccount();

    expect(send.mock.calls[0][0]).toBeInstanceOf(GetAccountCommand);
    expect(account).toEqual(expect.objectContaining({
      sendingEnabled: true,
      productionAccessEnabled: false,
      enforcementStatus: "HEALTHY",
      maxSendRate: 1,
      max24HourSend: 200,
      sentLast24Hours: 3,
    }));
  })
});
