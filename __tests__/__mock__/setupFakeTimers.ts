export function setupFakeTimers() {
  let spySetTimeout: jest.SpyInstance;
  let spySetInterval: jest.SpyInstance;
  let spyClearTimeout: jest.SpyInstance;
  let spyClearInterval: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    spySetTimeout = jest.spyOn(global, 'setTimeout');
    spySetInterval = jest.spyOn(global, 'setInterval');
    spyClearTimeout = jest.spyOn(global, 'clearTimeout');
    spyClearInterval = jest.spyOn(global, 'clearInterval');
  });

  afterEach(() => {
    jest.clearAllTimers();
    spySetTimeout.mockRestore();
    spySetInterval.mockRestore();
    spyClearTimeout.mockRestore();
    spyClearInterval.mockRestore();
    jest.useRealTimers();
  });
}
