import {BooleanAnswerParser} from "./boolean-answer-parser";

describe("BooleanAnswerParser", () => {
  it.each(["y", "yes", "YES", "Yes", "true", "TRUE", "1", "  y  "])(
    "parses '%s' as true",
    (input) => {
      expect(BooleanAnswerParser.parse(input)).toBe(true);
    },
  );

  it.each(["n", "no", "NO", "No", "false", "FALSE", "0", "  n  "])(
    "parses '%s' as false",
    (input) => {
      expect(BooleanAnswerParser.parse(input)).toBe(false);
    },
  );

  it.each(["maybe", "yep", "2", "", "   ", "ok"])(
    "returns undefined for the unrecognized answer '%s'",
    (input) => {
      expect(BooleanAnswerParser.parse(input)).toBeUndefined();
    },
  );
});
