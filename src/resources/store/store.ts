// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../../core/resource';
import * as OrdersAPI from './orders';
import { OrderCreateParams, Orders } from './orders';
import { APIPromise } from '../../core/api-promise';
import { RequestOptions } from '../../internal/request-options';

export class Store extends APIResource {
  orders: OrdersAPI.Orders = new OrdersAPI.Orders(this._client);

  /**
   * Returns a map of status codes to quantities
   */
  inventory(options?: RequestOptions): APIPromise<StoreInventoryResponse> {
    return this._client.get('/store/inventory', options);
  }
}

export type StoreInventoryResponse = Record<string, number>;

Store.Orders = Orders;

export declare namespace Store {
  export { type StoreInventoryResponse as StoreInventoryResponse };

  export { Orders as Orders, type OrderCreateParams as OrderCreateParams };
}
