# semafour

[![Current Version](https://img.shields.io/npm/v/semafour.svg)](https://www.npmjs.org/package/semafour)
[![Build Status via Travis CI](https://travis-ci.org/cjihrig/semafour.svg?branch=master)](https://travis-ci.org/cjihrig/semafour)
![Dependencies](http://img.shields.io/david/cjihrig/semafour.svg)
[![belly-button-style](https://img.shields.io/badge/eslint-bellybutton-4B32C3.svg)](https://github.com/cjihrig/belly-button)


Node.js semaphore with synchronous and asynchronous APIs. `semafour` uses named semaphores, and can be used to achieve synchronization across multiple processes.

**Currently not supported on Windows.**

## Example

```javascript
const sem = Semafour.create({ name: '/sem', value: 1 });

// Acquire semaphore asynchronously.
sem.wait((err) => {
  // Perform some activity that requires synchronization.

  // Release semaphore synchronously.
  sem.postSync();

  // Delete the semaphore synchronously.
  sem.unlinkSync();
});
```

## API

### `Semafour(options)` constructor

  - Arguments
    - `options` (object) - A configuration object with the following schema:
      - `name` (string) - Name for the semaphore. This is global to the operating system.
      - `value` (number) - An unsigned integer representing the initial value of the semaphore. Optional. Defaults to `0`.
      - `create` (boolean) - When `false`, a new semaphore is created if one does not already exist with the provided `name`. If a semaphore already exists with the same name, it will be used. When `create` is `true`, an error is thrown if the named semaphore already exists. Defaults to `true`.

Constructs a new semaphore. Must be called with `new`.

### `Semafour.create(options)`

  - Arguments
    - `options` (object) - A configuration object with the following schema:
      - `name` (string) - Name for the semaphore. This is global to the operating system.
      - `value` (number) - An unsigned integer representing the initial value of the semaphore. Optional. Defaults to `0`.
  - Returns
    - `semaphore` (object) - A semaphore object representing a newly created named semaphore.

Factory function used to construct semaphores with `create` equal to `true`. This is the preferred way to create new semaphores.

### `Semafour.use(options)`

  - Arguments
    - `options` (object) - A configuration object with the following schema:
      - `name` (string) - Name for the semaphore. This is global to the operating system.
      - `value` (number) - An unsigned integer representing the initial value of the semaphore. If the semaphore already exists, `value` is ignored. Optional. Defaults to `0`.
  - Returns
    - `semaphore` (object) - A semaphore object representing a newly created or existing named semaphore.

Factory function used to construct semaphores with `create` equal to `false`. This is the preferred way to retrieve existing semaphores.

### `Semafour.prototype.post(callback)`

  - Arguments
    - `callback(err)` (function) - Callback function, which takes an error argument.
  - Returns
    - Nothing

Posts the semaphore, and invokes `callback`. Any errors that occur are passed to the callback function.

### `Semafour.prototype.postSync()`

  - Arguments
    - None
  - Returns
    - Nothing

Posts the semaphore synchronously. Throws if an error occurs.

### `Semafour.prototype.wait(callback)`

  - Arguments
    - `callback(err)` (function) - Callback function, which takes an error argument.
  - Returns
    - Nothing

Acquires the semaphore asynchronously. The wait operation is performed on a separate thread in the libuv thread pool to avoid blocking the event loop. Once the semaphore is acquired, the callback is invoked. Any errors that occur are passed to the callback function.

### `Semafour.prototype.waitSync()`

  - Arguments
    - None
  - Returns
    - Nothing

Acquires the semaphore synchronously. The wait operation is performed on the main thread, and will block the event loop until the semaphore is acquired. Throws if an error occurs.

### `Semafour.prototype.tryWait(callback)`

  - Arguments
    - `callback(err, succeeded)` (function) - Callback function, which takes an error argument, and a boolean that is true if the semaphore was acquired, false otherwise.
  - Returns
    - Nothing.

Tries to acquire the semaphore asynchronously. The tryWait operation is performed on a separate thread in the libuv thread pool to avoid blocking the event loop. Once the semaphore is acquired (if possible), the callback is invoked. Any errors that occur are passed to the callback function.

### `Semafour.prototype.tryWaitSync()`

  - Arguments
    - None
  - Returns
    - A boolean that is true if the semaphore was acquired, and false otherwise.

Tries to acquire the semaphore synchronously. The tryWait operation is performed on the main thread, and will block the event loop until the semaphore is acquired or we know it's locked. Throws if an error occurs.

### `Semafour.prototype.unlink(callback)`

  - Arguments
    - `callback(err)` (function) - Callback function, which takes an error argument.
  - Returns
    - Nothing

Unlinks the semaphore, and invokes `callback`. Any errors that occur are passed to the callback function. The semaphore is not destroyed until it is closed by all other processes that have it open.

### `Semafour.prototype.unlinkSync()`

  - Arguments
    - None
  - Returns
    - Nothing

Unlinks the semaphore synchronously. Throws if an error occurs. The semaphore is not destroyed until it is closed by all other processes that have it open.

### `Semafour.prototype.close(callback)`

  - Arguments
    - `callback(err)` (function) - Callback function, which takes an error argument.
  - Returns
    - Nothing

Closes the semaphore, and invokes `callback`. Any errors that occur are passed to the callback function.

### `Semafour.prototype.closeSync()`

  - Arguments
    - None
  - Returns
    - Nothing

Closes the semaphore synchronously. Throws if an error occurs.
