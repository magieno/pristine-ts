/**
 * Result returned by an `InstantiationTestInterface.run()`. Tests report failure by returning
 * `passed: false` rather than throwing — uncaught throws are still captured and recorded as
 * failed by `Kernel.verifyInstantiation`, but a structured return lets the test attach a
 * message and arbitrary diagnostic details that surface in the rendered report.
 */
export interface InstantiationTestResultInterface {
  passed: boolean;
  message?: string;
  details?: any;
}
