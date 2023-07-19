/* tslint:disable */

/**
 *
 * @export
 * @interface TestCase
 */
export interface TestCase {
  /**
   * The ID of the test case
   * @type {string}
   * @memberof TestCase
   */
  id: string;
  /**
   * The date and time when the test case was created
   * @type {string}
   * @memberof TestCase
   */
  createdAt: string;
  /**
   * The date and time when the test case was archived, can be null if the test case has not been archived
   * @type {string}
   * @memberof TestCase
   */
  archivedAt?: string | null;
  /**
   * The date and time when the test case was last updated
   * @type {string}
   * @memberof TestCase
   */
  updatedAt: string;
  /**
   * The expected outputs for the test case
   * @type {object}
   * @memberof TestCase
   */
  expectedOutputs?: object | null;
  /**
   * The input data for the test case as a JSON object
   * @type {{ [key: string]: any; }}
   * @memberof TestCase
   */
  inputs: { [key: string]: any };
  /**
   * The name of the test case
   * @type {string}
   * @memberof TestCase
   */
  name: string;
  /**
   * The ID of the pipeline that the test case belongs to
   * @type {string}
   * @memberof TestCase
   */
  pipelineId: string;
}
