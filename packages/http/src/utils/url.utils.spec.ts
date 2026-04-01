import {UrlUtils} from "./url.utils";

describe("URL Utils", () => {
  it("should append a path", () => {
    const url = new URL("https://example.com/current-path");

    const updatedUrl = UrlUtils.appendLocationHeaderToUrl(url, '/new-updated-path');

    expect(updatedUrl.host).toBe("example.com")
    expect(updatedUrl.pathname).toBe("/new-updated-path")
  })

  it("should append a full URL", () => {
    const url = new URL("https://example.com/current-path");

    const updatedUrl = UrlUtils.appendLocationHeaderToUrl(url, 'https://new-example.com/new-updated-path?query=3');

    expect(updatedUrl.host).toBe("new-example.com")
    expect(updatedUrl.pathname).toBe("/new-updated-path")
    expect(updatedUrl.toString()).toBe('https://new-example.com/new-updated-path?query=3')
  })

  it("should throw an error for invalid URL", () => {
    expect(() => {
      UrlUtils.appendLocationHeaderToUrl(new URL("https://example.com/current-path"), '?query=3')
    }).toThrowError("Invalid URL");
  })
});