'use strict';
const Code = require('code');
const Lab = require('lab');
const Semafour = require('../');
const SemafourWrap = require('../build/Release/semafour').Semafour;

const lab = exports.lab = Lab.script();
const expect = Code.expect;
const describe = lab.describe;
const it = lab.it;


describe('Semafour', () => {
  it('obtains the semaphore synchronously', (done) => {
    let sem = new Semafour(1);

    sem.waitSync();

    sem = new Semafour();
    sem.postSync();
    sem.waitSync();
    done();
  });

  it('obtains the semaphore asynchronously', (done) => {
    const sem = new Semafour();

    sem.post(() => {
      sem.wait(() => {
        done();
      });
    });
  });

  it('constructor throws on invalid input', (done) => {
    function fail (value) {
      expect(() => {
        new Semafour(value);  // eslint-disable-line no-new
      }).to.throw(TypeError, 'value must be an unsigned integer');
    }

    [
      null,
      true,
      false,
      {},
      /x/,
      '',
      'foo',
      [],
      NaN,
      Infinity,
      3.14,
      -1
    ].forEach(fail);
    done();
  });

  it('post() throws if callback is not a function', (done) => {
    expect(() => {
      const sem = new Semafour();

      sem.post();
    }).to.throw(TypeError, 'callback must be a function');
    done();
  });

  it('wait() throws if callback is not a function', (done) => {
    expect(() => {
      const sem = new Semafour();

      sem.wait();
    }).to.throw(TypeError, 'callback must be a function');
    done();
  });

  it('binding throws when constructed without new', (done) => {
    expect(() => {
      SemafourWrap();
    }).to.throw(Error, 'Semafour must be constructed using new');
    done();
  });
});
