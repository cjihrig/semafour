# semafour

[![Current Version](https://img.shields.io/npm/v/semafour.svg)](https://www.npmjs.org/package/semafour)
[![Build Status via Travis CI](https://travis-ci.org/continuationlabs/semafour.svg?branch=master)](https://travis-ci.org/continuationlabs/semafour)
![Dependencies](http://img.shields.io/david/continuationlabs/semafour.svg)

[![belly-button-style](https://cdn.rawgit.com/continuationlabs/belly-button/master/badge.svg)](https://github.com/continuationlabs/belly-button)

Node.js semaphore with synchronous and asynchronous APIs.

## Example

```javascript
const sem = new Semafour();

// Acquire semaphore
sem.wait(() => {
  // Perform some activity that requires synchronization.

  // Release semaphore
  sem.postSync();
});
```

## API

### `Semafour([value])` constructor

  - Arguments
    - `value` (number) - An unsigned integer representing the initial value of the semaphore. Optional. Defaults to `0`.

Constructs a new semaphore. Must be called with `new`.

### `post(callback)`

  - Arguments
    - `callback` (function) - Callback function, which takes no arguments.
  - Returns
    - Nothing

Posts the semaphore, and invokes `callback` on the next tick.

### `postSync()`

  - Arguments
    - None
  - Returns
    - Nothing

Posts the semaphore synchronously.

### `wait(callback)`

  - Arguments
    - `callback` (function) - Callback function, which takes no arguments.
  - Returns
    - Nothing

Acquires the semaphore asynchronously. The wait operation is performed on a separate thread in the libuv thread pool to avoid blocking the event loop. Once the semaphore is acquired, the callback is invoked.

### `waitSync()`

  - Arguments
    - None
  - Returns
    - Nothing

Acquires the semaphore synchronously. The wait operation is performed on the main thread, and will block the event loop until the semaphore is acquired.
