'use strict';
const SemafourWrap = require('../build/Release/semafour').Semafour;
const wrapSymbol = Symbol('wrapSymbol');


class Semafour {
  constructor (value) {
    this[wrapSymbol] = new SemafourWrap(value);
  }
  post (callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('callback must be a function');
    }

    this[wrapSymbol].post();
    process.nextTick(callback);
  }
  postSync () {
    this[wrapSymbol].post();
  }
  wait (callback) {
    this[wrapSymbol].wait(callback);
  }
  waitSync () {
    this[wrapSymbol].wait();
  }
}

module.exports = Semafour;
