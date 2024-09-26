/* tslint:disable */
/* eslint-disable */
/**
 * Gentrace API
 * These API routes are designed to ingest events from clients.
 *
 * The version of the OpenAPI document: 0.27.0
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 *
 * @export
 * @interface FolderV2
 */
export interface FolderV2 {
  /**
   * The ID of the folder
   * @type {string}
   * @memberof FolderV2
   */
  id: string;
  /**
   * Timestamp in seconds since the UNIX epoch. Can be transformed into a Date object.
   * @type {number}
   * @memberof FolderV2
   */
  createdAt: number;
  /**
   * Timestamp in seconds since the UNIX epoch. Can be transformed into a Date object.
   * @type {number}
   * @memberof FolderV2
   */
  updatedAt: number;
  /**
   * The name of the folder
   * @type {string}
   * @memberof FolderV2
   */
  name: string;
  /**
   * The ID of the organization that owns the folder
   * @type {string}
   * @memberof FolderV2
   */
  organizationId: string;
  /**
   * The ID of the parent folder
   * @type {string}
   * @memberof FolderV2
   */
  parentFolderId: string | null;
}
