export default class CancelError extends Error {
  public isCancelled: boolean = true;
}
