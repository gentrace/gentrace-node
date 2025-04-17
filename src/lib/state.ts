import { AsyncLocalStorage } from 'node:async_hooks';
import { ClientOptions, Gentrace } from '../client';

/**
 * GentraceState manages the configuration and client instance for Gentrace.
 * It provides a way to store and access Gentrace client instances within different execution contexts
 * using AsyncLocalStorage, allowing for context-aware operations.
 */
export class GentraceState {
  private options: ClientOptions;
  private client: Gentrace;
  private static activeStateStorage = new AsyncLocalStorage<GentraceState>();

  constructor(options: ClientOptions = {}) {
    this.options = options;
    this.client = new Gentrace(this.options);
  }

  public getClient(): Gentrace {
    return this.client;
  }

  public getOptions(): Readonly<ClientOptions> {
    return this.options;
  }

  public runWith<R>(fn: () => R): R {
    return GentraceState.activeStateStorage.run(this, fn);
  }

  public static getActiveState() {
    return GentraceState.activeStateStorage.getStore() ?? _globalState;
  }
}

export let _globalState: GentraceState | null = null;

export function _setGlobalState(globalState: GentraceState) {
  _globalState = globalState;
}
