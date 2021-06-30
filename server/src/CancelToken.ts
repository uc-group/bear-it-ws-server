import CancelError from './CancelError';

export default class CancelToken {
  public cancelled: boolean = false;

  constructor(private reject: Function) {}

  cancel(reason?: string) {
    if (this.cancelled) {
      return;
    }

    this.cancelled = true;
    this.reject(new CancelError(reason));
  }
}
