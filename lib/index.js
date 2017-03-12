'use strict';
const SemafourWrap = require('../build/Release/semafour').Semafour;
const wrapSymbol = Symbol('wrapSymbol');
const constructorDefaults = { value: 0, create: true };
const createDefaults = { create: true };
const useDefaults = { create: false };


class Semafour {
  constructor (options) {
    const opts = Object.assign({}, constructorDefaults, options);

    this[wrapSymbol] = new SemafourWrap(opts.name, opts.value, opts.create);
  }
  static create (options) {
    const opts = Object.assign({}, options, createDefaults);

    return new Semafour(opts);
  }
  static use (options) {
    const opts = Object.assign({}, options, useDefaults);

    return new Semafour(opts);
  }
  post (callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('callback must be a function');
    }

    const err = this[wrapSymbol].post();
    setImmediate(callback, err);
  }
  postSync () {
    const err = this[wrapSymbol].post();

    if (err !== null) {
      throw err;
    }
  }
  wait (callback) {
    this[wrapSymbol].wait(callback);
  }
  waitSync () {
    this[wrapSymbol].wait();
  }
  unlink (callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('callback must be a function');
    }

    const err = this[wrapSymbol].unlink();
    setImmediate(callback, err);
  }
  unlinkSync () {
    const err = this[wrapSymbol].unlink();

    if (err !== null) {
      throw err;
    }
  }
  close (callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('callback must be a function');
    }

    const err = this[wrapSymbol].close();
    setImmediate(callback, err);
  }
  closeSync () {
    const err = this[wrapSymbol].close();

    if (err !== null) {
      throw err;
    }
  }
}

module.exports = Semafour;
