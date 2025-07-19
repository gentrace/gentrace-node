// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import type { Gentrace } from '../client';

export abstract class APIResource {
  protected _client: Gentrace;

  constructor(client: Gentrace) {
    this._client = client;
  }
}
