/**
 * This interface represents the object that will contain the information required to know how to handle the
 * @queryParameter decorator.
 */
export interface QueryParameterDecoratorInterface {
    type: "queryParameter";
    queryParameterName: string;
}