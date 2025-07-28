import 'reflect-metadata';
import {ErrorResponseSanitizerRequestInterceptor} from './error-response-sanitizer.request-interceptor';
import {Response} from '@pristine-ts/common';

describe('ErrorResponseSanitizerRequestInterceptor', () => {
  it('should remove stack, extra, and errors from the response body', async () => {
    const interceptor = new ErrorResponseSanitizerRequestInterceptor(true);

    const error = new Error('Test error');
    const response = new Response();
    response.body = {
      message: 'An error occurred',
      stack: 'Error stack trace',
      extra: {details: 'Extra details'},
      errors: ['Error 1', 'Error 2'],
    };

    const newResponse = await interceptor.interceptError(error, response, {} as any);

    expect(newResponse.body).toEqual({
      message: 'An error occurred',
      errors: ['Error 1', 'Error 2'],
    });
  });

  it('should not modify the response body if it is not an object', async () => {
    const interceptor = new ErrorResponseSanitizerRequestInterceptor(true);

    const error = new Error('Test error');
    const response = new Response();
    response.body = 'Error message';

    const newResponse = await interceptor.interceptError(error, response, {} as any);

    expect(newResponse.body).toBe('Error message');
  });

  it('should not modify the response body if isActive is false', async () => {
    const interceptor = new ErrorResponseSanitizerRequestInterceptor(false);

    const error = new Error('Test error');
    const response = new Response();
    const body = {
      message: 'An error occurred',
      stack: 'Error stack trace',
      extra: {details: 'Extra details'},
      errors: ['Error 1', 'Error 2'],
    };
    response.body = body;

    const newResponse = await interceptor.interceptError(error, response, {} as any);

    expect(newResponse.body).toEqual(body);
  });
});
