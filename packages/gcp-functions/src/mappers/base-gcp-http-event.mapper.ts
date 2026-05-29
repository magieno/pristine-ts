import {HttpMethod, Request, Response} from "@pristine-ts/common";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {EventResponse} from "@pristine-ts/core";
import {GcpFunctionsHttpEventResponsePayload} from "../event-response-payloads/gcp-functions-http.event-response-payload";

/**
 * Shared base for the three GCP-Functions HTTP mappers. Mirrors
 * `BaseApiEventMapper` in `@pristine-ts/aws-api-gateway`.
 */
export class BaseGcpHttpEventMapper {
  protected mapHttpMethod(method: string): HttpMethod {
    switch ((method ?? "").toLowerCase()) {
      case "get":
        return HttpMethod.Get;
      case "post":
        return HttpMethod.Post;
      case "put":
        return HttpMethod.Put;
      case "patch":
        return HttpMethod.Patch;
      case "delete":
        return HttpMethod.Delete;
      case "options":
        return HttpMethod.Options;
      default:
        return HttpMethod.Get;
    }
  }

  /**
   * Extracts the URL path from a raw URL (which may include query string).
   */
  protected extractPath(url: string): string {
    if (!url) {
      return "/";
    }
    const queryIdx = url.indexOf("?");
    return queryIdx >= 0 ? url.substring(0, queryIdx) : url;
  }

  /**
   * Converts a Pristine `Response` (or arbitrary handler return value) into the
   * `GcpFunctionsHttpEventResponsePayload` shape that the entry-point shim returns to
   * Cloud Functions / Cloud Run.
   */
  protected toResponsePayload(
    eventResponse: EventResponse<any, any>,
    logHandler: LogHandlerInterface,
  ): GcpFunctionsHttpEventResponsePayload {
    if (eventResponse.response instanceof GcpFunctionsHttpEventResponsePayload) {
      return eventResponse.response;
    }
    if (eventResponse.response instanceof Response) {
      let body: any = eventResponse.response.body;
      if (body !== null && body !== undefined && typeof body === "object") {
        try {
          body = JSON.stringify(body);
        } catch (e: any) {
          logHandler.error("BaseGcpHttpEventMapper: Could not stringify response body.", {
            highlights: {errorMessage: e?.message ?? "Unknown error"},
            extra: {error: e},
            eventId: eventResponse.event.id,
          });
        }
      }
      const payload = new GcpFunctionsHttpEventResponsePayload(eventResponse.response.status, body);
      if (eventResponse.response.headers) {
        payload.headers = eventResponse.response.headers;
      }
      payload.isBase64Encoded = false;
      return payload;
    }
    return new GcpFunctionsHttpEventResponsePayload(200, eventResponse.response);
  }

  /**
   * Hydrates a Pristine `Request` from raw HTTP fields. Shared by the Gen 1 and
   * Cloud Run mappers (both deliver raw HTTP).
   */
  protected toPristineRequest(
    method: string,
    url: string,
    headers: { [k: string]: string | string[] } | undefined,
    body: any,
    eventId: string,
  ): Request {
    const path = this.extractPath(url);
    const request = new Request(this.mapHttpMethod(method), path, eventId);
    request.setHeaders(this.flattenHeaders(headers ?? {}));
    request.body = body;
    request.rawBody = typeof body === "string" ? body : (body !== undefined && body !== null ? JSON.stringify(body) : undefined);
    request.id = request.getHeader("x-pristine-request-id") ?? request.id;
    request.groupId = request.getHeader("x-pristine-event-group-id") ?? request.groupId;
    return request;
  }

  /**
   * Lowercases keys and collapses single-element arrays so downstream code can read
   * headers consistently as `string`.
   */
  protected flattenHeaders(headers: { [k: string]: string | string[] }): { [k: string]: string } {
    const flat: { [k: string]: string } = {};
    for (const key of Object.keys(headers)) {
      const value = headers[key];
      if (Array.isArray(value)) {
        flat[key.toLowerCase()] = value.join(",");
      } else if (value !== undefined && value !== null) {
        flat[key.toLowerCase()] = String(value);
      }
    }
    return flat;
  }
}
