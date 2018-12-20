'use strict';
const Cp = require('child_process');
const Crypto = require('crypto');
const Path = require('path');
const Barrier = require('cb-barrier');
const Code = require('code');
const Lab = require('lab');
const StandIn = require('stand-in');
const Semafour = require('../');
const SemafourWrap = require('../build/Release/semafour').Semafour;

const lab = exports.lab = Lab.script();
const expect = Code.expect;
const describe = lab.describe;
const it = lab.it;

function getName () {
  return `sem_${Crypto.randomBytes(10).toString('hex')}`;
}

function syncMock () {
  return new Error('mock-error');
}


describe('Semafour', () => {
  it('can try locking semaphores', () => {
    const sem = Semafour.create({ name: getName(), value: 1 });
    expect(sem.tryWaitSync()).to.equal(true);

    expect(sem.tryWaitSync()).to.equal(false);
    sem.postSync();
    expect(sem.tryWaitSync()).to.equal(true);
    sem.unlinkSync();
  });

  it('can try locking semaphores asynchronously', () => {
    const barrier = new Barrier();
    const sem = Semafour.create({ name: getName(), value: 1 });

    sem.tryWait((err, value) => {
      expect(err).to.equal(null);
      expect(value).to.equal(true);

      sem.tryWait((err, value) => {
        expect(err).to.equal(null);
        expect(value).to.equal(false);

        sem.unlink((err) => {
          expect(err).to.equal(null);
          barrier.pass();
        });
      });
    });
  });

  it('obtains the semaphore synchronously', () => {
    let sem = Semafour.create({ name: getName(), value: 1 });

    sem.waitSync();
    sem.unlinkSync();

    sem = Semafour.create({ name: getName() });
    sem.postSync();
    sem.waitSync();
    sem.unlinkSync();
  });

  it('obtains the semaphore asynchronously', () => {
    const barrier = new Barrier();
    const sem = Semafour.create({ name: getName() });

    sem.post((err) => {
      expect(err).to.equal(null);
      sem.wait((err) => {
        expect(err).to.equal(null);
        sem.unlink((err) => {
          expect(err).to.equal(null);
          barrier.pass();
        });
      });
    });

    return barrier;
  });

  it('create() fails to create a new semaphore if the name exists', () => {
    const name = getName();
    const sem = Semafour.create({ name });

    expect(() => {
      Semafour.create({ name });
    }).to.throw(Error, 'EEXIST: file already exists, sem_open');
    sem.unlinkSync();
  });

  it('use() retrieves an existing named semaphore', () => {
    const name = getName();
    Semafour.create({ name, value: 1 });
    const sem = Semafour.use({ name });

    sem.waitSync();
    sem.unlinkSync();
  });

  it('post() and postSync() handle errors from the binding layer', () => {
    const barrier = new Barrier();
    const sem = Semafour.create({ name: getName(), value: 1 });

    sem.unlinkSync();

    expect(() => {
      StandIn.replaceOnce(SemafourWrap.prototype, 'post', syncMock);
      sem.postSync();
    }).to.throw(Error, 'mock-error');

    StandIn.replaceOnce(SemafourWrap.prototype, 'post', syncMock);
    sem.post((err) => {
      expect(err).to.be.an.error(Error, 'mock-error');
      barrier.pass();
    });

    return barrier;
  });

  it('wait() and waitSync() handle errors from the binding layer', () => {
    const barrier = new Barrier();
    const sem = Semafour.create({ name: getName(), value: 1 });

    sem.unlinkSync();

    expect(() => {
      StandIn.replaceOnce(SemafourWrap.prototype, 'wait', () => {
        throw new Error('mock-error');
      });
      sem.waitSync();
    }).to.throw(Error, 'mock-error');

    StandIn.replaceOnce(SemafourWrap.prototype, 'wait', (stand, cb) => {
      cb(new Error('mock-error'));
    });
    sem.wait((err) => {
      expect(err).to.be.an.error(Error, 'mock-error');
      barrier.pass();
    });

    return barrier;
  });

  it('close() and closeSync() handle errors from the binding layer', () => {
    const barrier = new Barrier();
    const sem = Semafour.create({ name: getName(), value: 1 });

    sem.unlinkSync();

    expect(() => {
      StandIn.replaceOnce(SemafourWrap.prototype, 'close', syncMock);
      sem.closeSync();
    }).to.throw(Error, 'mock-error');

    StandIn.replaceOnce(SemafourWrap.prototype, 'close', syncMock);
    sem.close((err) => {
      expect(err).to.be.an.error(Error, 'mock-error');
      barrier.pass();
    });

    return barrier;
  });

  it('semaphore can only be unlinked once', () => {
    const barrier = new Barrier();
    const sem = Semafour.create({ name: getName() });

    sem.unlinkSync();

    expect(() => {
      sem.unlinkSync();
    }).to.throw(Error, 'EINVAL: invalid argument, sem_unlink');

    sem.unlink((err) => {
      expect(err).to.be.an.error(Error, 'EINVAL: invalid argument, sem_unlink');
      barrier.pass();
    });

    return barrier;
  });

  it('semaphore can be unlinked after closing', () => {
    const sem = Semafour.create({ name: getName() });

    sem.closeSync();
    sem.unlinkSync();
  });

  it('constructor throws on invalid input', () => {
    function failName (name) {
      expect(() => {
        new Semafour({ name });  // eslint-disable-line no-new
      }).to.throw(TypeError, 'name must be a string');
    }

    function failValue (value) {
      expect(() => {
        new Semafour({ name: getName(), value });  // eslint-disable-line no-new
      }).to.throw(TypeError, 'value must be an unsigned integer');
    }

    function failCreate (create) {
      expect(() => {
        new Semafour({ name: getName(), create });  // eslint-disable-line no-new
      }).to.throw(TypeError, 'create must be a boolean');
    }

    [null, true, false, {}, /x/, [], NaN, Infinity, 3.14, -1].forEach(failName);
    [null, true, {}, /x/, '', 'foo', [], NaN, 3.14, -1].forEach(failValue);
    [null, {}, /x/, '', 'foo', [], NaN, 3.14, -1].forEach(failCreate);
  });

  it('post() throws if callback is not a function', () => {
    const sem = Semafour.create({ name: getName() });

    expect(() => {
      sem.post();
    }).to.throw(TypeError, 'callback must be a function');
    sem.unlinkSync();
  });

  it('wait() throws if callback is not a function', () => {
    const sem = Semafour.create({ name: getName() });

    expect(() => {
      sem.wait();
    }).to.throw(TypeError, 'callback must be a function');
    sem.unlinkSync();
  });

  it('unlink() throws if callback is not a function', () => {
    const sem = Semafour.create({ name: getName() });

    expect(() => {
      sem.unlink();
    }).to.throw(TypeError, 'callback must be a function');
    sem.unlinkSync();
  });

  it('close() throws if callback is not a function', () => {
    const sem = Semafour.create({ name: getName() });

    expect(() => {
      sem.close();
    }).to.throw(TypeError, 'callback must be a function');
    sem.unlinkSync();
  });

  it('binding throws when constructed without new', () => {
    expect(() => {
      SemafourWrap();
    }).to.throw(Error, 'Semafour must be constructed using new');
  });

  it('works across processes', () => {
    const barrier = new Barrier();
    const name = getName();
    const sem = Semafour.create({ name });
    const child = Cp.fork(Path.resolve(__dirname, '..', 'fixtures', 'child.js'),
      { silent: true, env: { semafour: name } });
    let waited = false;
    let closed = false;

    function maybeDone () {
      if (waited === true && closed === true) {
        sem.unlinkSync();
        barrier.pass();
      }
    }

    child.on('message', (msg) => {
      expect(msg.msg).to.equal('ack');
      sem.postSync();
      sem.wait((err) => {
        expect(err).to.equal(null);
        waited = true;
        maybeDone();
      });
    });

    child.on('close', (code, signal) => {
      expect(code).to.equal(0);
      expect(signal).to.equal(null);
      closed = true;
      maybeDone();
    });

    child.send({ msg: 'online?' });

    return barrier;
  });
});
