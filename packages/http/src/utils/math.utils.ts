export class MathUtils {
  /**
   * This method returns a value for the exponentialBackoffWithJitter.
   * src:
   * - https://docs.microsoft.com/en-us/javascript/api/azure-iot-common/exponentialbackoffwithjitterparameters?view=azure-node-latest
   * - https://docs.microsoft.com/en-us/javascript/api/azure-iot-common/exponentialbackoffwithjitter?view=azure-node-latest#ExponentialBackOffWithJitter_boolean__ErrorFilter_
   * @param retryCount
   * @param initialRetryInterval
   * @param maximumRetryInterval
   * @param minimumRetryInterval
   * @param maximumJitterFactor
   * @param minimumJitterFactor
   */
  public static exponentialBackoffWithJitter(retryCount: number,
                                             initialRetryInterval = 100,
                                             maximumRetryInterval = 10000,
                                             minimumRetryInterval = 100,
                                             maximumJitterFactor = 0.5,
                                             minimumJitterFactor = 0.25): number {
    return Math.min(minimumRetryInterval + Math.pow(2, (retryCount - 1) - 1) * MathUtils.random(initialRetryInterval * (1 - maximumJitterFactor), initialRetryInterval * (1 - minimumJitterFactor)),
      maximumRetryInterval)
  }

  /**
   * Returns a random number between min (inclusive) and max (exclusive).
   * @param min The minimum number the random can be (included).
   * @param max The maximum number the random can be (excluded).
   */
  public static random(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }
}
