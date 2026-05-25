import {DataNormalizerUniqueKey} from "../types/data-normalizer-unique-key.type";

/**
 * Thrown when a leaf references a normalizer key that hasn't been registered with the DataMapper.
 */
export class DataNormalizerNotFoundError extends Error {
  public constructor(message: string, public readonly normalizerUniqueKey: DataNormalizerUniqueKey) {
    super(message);

    Object.setPrototypeOf(this, DataNormalizerNotFoundError.prototype);
  }
}
