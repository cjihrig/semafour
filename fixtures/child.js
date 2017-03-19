'use strict';
const Assert = require('assert');

Assert(process.env.semafour, 'fixture requires semafour environment variable');

const Semafour = require('../');
const sem = Semafour.use({ name: process.env.semafour });
let waiting = false;

sem.wait((err) => {
  waiting = false;
  Assert.ifError(err);
  sem.postSync();
  sem.closeSync();
  process.disconnect();
});

waiting = true;

process.on('message', (msg) => {
  Assert.strictEqual(msg.msg, 'online?', 'unexpected message received');
  Assert.strictEqual(waiting, true, 'not waiting. this should be impossible');
  process.send({ msg: 'ack' });
});
