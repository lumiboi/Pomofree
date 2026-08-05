import { act, renderHook } from '@testing-library/react';
import { useBackgroundTimer } from './useBackgroundTimer';

const workers = [];

class WorkerMock {
  constructor() {
    workers.push(this);
  }

  terminate() {}
}

beforeEach(() => {
  workers.length = 0;
  localStorage.clear();
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-08-05T10:00:00.000Z'));
  global.Worker = WorkerMock;
  URL.createObjectURL = jest.fn(() => 'blob:timer-worker');
  URL.revokeObjectURL = jest.fn();
});

afterEach(() => {
  jest.useRealTimers();
  delete global.Worker;
});

test('arka planda pencere timerı durdurulsa bile worker tıkında gerçek saate yetişir', () => {
  const { result } = renderHook(() => useBackgroundTimer(60, false, 'timer-worker-test'));

  act(() => result.current.startTimer());
  expect(workers).toHaveLength(1);

  jest.setSystemTime(new Date('2026-08-05T10:00:10.000Z'));
  act(() => workers[0].onmessage());

  expect(result.current.time).toBe(50);
});
