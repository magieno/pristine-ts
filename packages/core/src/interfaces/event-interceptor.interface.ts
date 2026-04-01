import {ExecutionContextInterface} from "./execution-context.interface";
import {EventResponse} from "../models/event.response";
import {Event} from "../models/event";

/**
 * The Event Interceptor Interface defines the methods that an Event Interceptor must implement. This
 * interceptor is called before the event is being dispatched to the event listeners.
 */
export interface EventInterceptorInterface {
  /**
   * This method receives a raw event object (before the an event is parsed into a know Pristine Event) and must return a transformed raw event object. If you don't want to
   * manipulate the raw event (when logging for example), juste resolve a promise with the raw event passed to this method.
   *
   * If you force to never resolve the promise, the execution will stall. Be careful.
   *
   * @param event
   * @param executionContextInterface
   */
  preMappingIntercept?(event: object, executionContextInterface: ExecutionContextInterface<any>): Promise<object>;

  /**
   * This method receives an event object and must return a transformed event object. If you don't want to
   * manipulate the event object (when logging for example), juste resolve a promise with the event passed to this method.
   *
   * If you force to never resolve the promise, the execution will stall. Be careful.
   *
   * @param event
   */
  postMappingIntercept?(event: Event<any>): Promise<Event<any>>;

  /**
   * This method receives the EventResponse returned by the EventDispatcher before it is being reverse mapped by the EventMappers.
   *
   * If you force to never resolve the promise, the execution will stall. Be careful.
   *
   * @param eventResponse
   */
  preResponseMappingIntercept?(eventResponse: EventResponse<any, any>): Promise<EventResponse<any, any>>;

  /**
   * This method receives the reverse mapped EventResponse returned by the EventMappers, but before they are leaving Pristine entirely.
   *
   * If you force to never resolve the promise, the execution will stall. Be careful.
   *
   * @param eventResponse
   */
  postResponseMappingIntercept?(eventResponse: object): Promise<object>;
}
