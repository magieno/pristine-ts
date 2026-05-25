import "reflect-metadata";
import {Request} from "./request";
import {HttpMethod} from "../enums/http-method.enum";

describe("Request", () => {
  describe("constructor", () => {
    it("stores the http method, url and id", () => {
      const request = new Request(HttpMethod.Get, "/products", "req-1");
      expect(request.httpMethod).toBe(HttpMethod.Get);
      expect(request.url).toBe("/products");
      expect(request.id).toBe("req-1");
    });

    it("defaults body to an empty object", () => {
      const request = new Request(HttpMethod.Post, "/products", "req-2");
      expect(request.body).toEqual({});
    });

    it("accepts a custom http-method string outside the enum", () => {
      const request = new Request("PATCH", "/products/1", "req-3");
      expect(request.httpMethod).toBe("PATCH");
    });
  });

  describe("getPath", () => {
    it("returns a bare path unchanged", () => {
      expect(new Request(HttpMethod.Get, "/products", "id").getPath()).toBe("/products");
    });

    it("strips a single-parameter query string", () => {
      expect(new Request(HttpMethod.Get, "/products?q=1", "id").getPath()).toBe("/products");
    });

    it("strips a multi-parameter query string", () => {
      expect(new Request(HttpMethod.Get, "/products?q=1&page=2&sort=desc", "id").getPath()).toBe("/products");
    });

    it("returns the path when the query string is empty (trailing '?')", () => {
      expect(new Request(HttpMethod.Get, "/products?", "id").getPath()).toBe("/products");
    });

    it("returns '/' for the root path", () => {
      expect(new Request(HttpMethod.Get, "/", "id").getPath()).toBe("/");
    });

    it("strips at the first '?' when a query value contains additional '?' characters", () => {
      expect(new Request(HttpMethod.Get, "/products?q=foo?bar", "id").getPath()).toBe("/products");
    });

    it("returns an empty string when url is empty", () => {
      expect(new Request(HttpMethod.Get, "", "id").getPath()).toBe("");
    });
  });

  describe("headers", () => {
    it("normalizes header names to lowercase on set + get", () => {
      const request = new Request(HttpMethod.Get, "/", "id");
      request.setHeader("Content-Type", "application/json");
      expect(request.getHeader("content-type")).toBe("application/json");
      expect(request.getHeader("Content-Type")).toBe("application/json");
      expect(request.getHeader("CONTENT-TYPE")).toBe("application/json");
    });

    it("hasHeader matches case-insensitively", () => {
      const request = new Request(HttpMethod.Get, "/", "id");
      request.setHeader("Authorization", "Bearer token");
      expect(request.hasHeader("authorization")).toBe(true);
      expect(request.hasHeader("AUTHORIZATION")).toBe(true);
      expect(request.hasHeader("missing")).toBe(false);
    });

    it("getHeader returns undefined for an unset header", () => {
      const request = new Request(HttpMethod.Get, "/", "id");
      expect(request.getHeader("x-anything")).toBeUndefined();
    });

    it("setHeaders merges a batch of headers, each normalized to lowercase", () => {
      const request = new Request(HttpMethod.Get, "/", "id");
      request.setHeaders({
        "Content-Type": "application/json",
        "X-Request-Id": "req-7",
      });
      expect(request.getHeader("content-type")).toBe("application/json");
      expect(request.getHeader("x-request-id")).toBe("req-7");
    });

    it("a later setHeader overwrites an earlier value for the same logical name", () => {
      const request = new Request(HttpMethod.Get, "/", "id");
      request.setHeader("Content-Type", "text/plain");
      request.setHeader("content-type", "application/json");
      expect(request.getHeader("Content-Type")).toBe("application/json");
    });
  });
});
