'use strict';
const Crypto = require('crypto');
const Code = require('code');
const Lab = require('lab');
const Semafour = require('../');
const SemafourWrap = require('../build/Release/semafour').Semafour;

const lab = exports.lab = Lab.script();
const expect = Code.expect;
const describe = lab.describe;
const it = lab.it;

function getName () {
  return `sem_${Crypto.randomBytes(10).toString('hex')}`;
}

// TODO: Add test(s) with multiple processes.

describe('Semafour', () => {
  it('obtains the semaphore synchronously', (done) => {
    let sem = Semafour.create({ name: getName(), value: 1 });

    sem.waitSync();
    sem.unlinkSync();

    sem = Semafour.create({ name: getName() });
    sem.postSync();
    sem.waitSync();
    sem.unlinkSync();
    done();
  });

  it('obtains the semaphore asynchronously', (done) => {
    const sem = Semafour.create({ name: getName() });

    sem.post((err) => {
      expect(err).to.equal(null);
      sem.wait((err) => {
        expect(err).to.equal(null);
        sem.unlink((err) => {
          expect(err).to.equal(null);
          done();
        });
      });
    });
  });

  it('create() fails to create a new semaphore if the name exists', (done) => {
    const name = getName();
    const sem = Semafour.create({ name });

    expect(() => {
      Semafour.create({ name });
    }).to.throw(Error, 'EEXIST: file already exists, sem_open');
    sem.unlinkSync();
    done();
  });

  it('use() retrieves an existing named semaphore', (done) => {
    const name = getName();
    Semafour.create({ name, value: 1 });
    const sem = Semafour.use({ name });

    sem.waitSync();
    sem.unlinkSync();
    done();
  });

  it('post() and postSync() fail if semaphore is invalid', (done) => {
    const sem = Semafour.create({ name: getName(), value: 1 });

    sem.closeSync();

    expect(() => {
      sem.postSync();
    }).to.throw(Error, 'EBADF: bad file descriptor, sem_post');

    sem.post((err) => {
      expect(err).to.be.an.error(Error, 'EBADF: bad file descriptor, sem_post');
      sem.unlinkSync();
      done();
    });
  });

  it('wait() and waitSync() fail if semaphore is invalid', (done) => {
    const sem = Semafour.create({ name: getName(), value: 1 });

    sem.closeSync();

    expect(() => {
      sem.waitSync();
    }).to.throw(Error, 'EBADF: bad file descriptor, sem_wait');

    sem.wait((err) => {
      expect(err).to.be.an.error(Error, 'EBADF: bad file descriptor, sem_wait');
      sem.unlinkSync();
      done();
    });
  });

  it('close() and closeSync() fail if semaphore is invalid', (done) => {
    const sem = Semafour.create({ name: getName(), value: 1 });

    sem.closeSync();

    expect(() => {
      sem.closeSync();
    }).to.throw(Error, 'EBADF: bad file descriptor, sem_close');

    sem.close((err) => {
      expect(err).to.be.an.error(Error, 'EBADF: bad file descriptor, sem_close');
      sem.unlinkSync();
      done();
    });
  });

  it('semaphore can only be unlinked once', (done) => {
    const sem = Semafour.create({ name: getName() });

    sem.unlinkSync();

    expect(() => {
      sem.unlinkSync();
    }).to.throw(Error, 'EINVAL: invalid argument, sem_unlink');

    sem.unlink((err) => {
      expect(err).to.be.an.error(Error, 'EINVAL: invalid argument, sem_unlink');
      done();
    });
  });

  it('constructor throws on invalid input', (done) => {
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
    done();
  });

  it('post() throws if callback is not a function', (done) => {
    const sem = Semafour.create({ name: getName() });

    expect(() => {
      sem.post();
    }).to.throw(TypeError, 'callback must be a function');
    sem.unlinkSync();
    done();
  });

  it('wait() throws if callback is not a function', (done) => {
    const sem = Semafour.create({ name: getName() });

    expect(() => {
      sem.wait();
    }).to.throw(TypeError, 'callback must be a function');
    sem.unlinkSync();
    done();
  });

  it('unlink() throws if callback is not a function', (done) => {
    const sem = Semafour.create({ name: getName() });

    expect(() => {
      sem.unlink();
    }).to.throw(TypeError, 'callback must be a function');
    sem.unlinkSync();
    done();
  });

  it('close() throws if callback is not a function', (done) => {
    const sem = Semafour.create({ name: getName() });

    expect(() => {
      sem.close();
    }).to.throw(TypeError, 'callback must be a function');
    sem.unlinkSync();
    done();
  });

  it('binding throws when constructed without new', (done) => {
    expect(() => {
      SemafourWrap();
    }).to.throw(Error, 'Semafour must be constructed using new');
    done();
  });
});
