import "reflect-metadata";
import {TokenExpiredError} from "./token-expired.error";
import {UnauthorizedError} from "./unauthorized.error";
import {PristineError} from "./pristine.error";
import {PristineErrorKind} from "./pristine-error-kind.enum";

describe("TokenExpiredError", () => {
  it("should carry a 401 status and the TOKEN_EXPIRED code so a client can decide to refresh", () => {
    const error = new TokenExpiredError();

    expect(error.options.httpStatus).toBe(401);
    expect(error.options.code).toBe("TOKEN_EXPIRED");
    expect(error.options.kind).toBe(PristineErrorKind.UserError);
    expect(error.message).toBe("The token has expired");
  });

  it("should remain an UnauthorizedError and a PristineError so existing 401 handling keeps working", () => {
    const error = new TokenExpiredError();

    expect(error).toBeInstanceOf(TokenExpiredError);
    expect(error).toBeInstanceOf(UnauthorizedError);
    expect(error).toBeInstanceOf(PristineError);
    expect(error).toBeInstanceOf(Error);
  });

  it("should accept a custom message and details while keeping the fixed 401/TOKEN_EXPIRED contract", () => {
    const error = new TokenExpiredError("Session expired", {details: {tokenId: "abc"}});

    expect(error.message).toBe("Session expired");
    expect(error.options.details).toEqual({tokenId: "abc"});
    expect(error.options.httpStatus).toBe(401);
    expect(error.options.code).toBe("TOKEN_EXPIRED");
  });
});
