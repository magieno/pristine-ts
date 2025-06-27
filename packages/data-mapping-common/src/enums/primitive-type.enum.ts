export enum PrimitiveType {
  String = 'string',
  Number = 'number',
  BigInt = 'bigint',
  Boolean = 'boolean',
  Undefined = 'undefined',
  Symbol = 'symbol',
  Date = 'date',
  Null = 'null', // Note: typeof null is 'object', but it is a primitive.
}