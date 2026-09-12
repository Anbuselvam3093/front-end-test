import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Rooms } from './composition.service';

describe('composition.service Rooms', () => {
  it('parses room party composition string a2', () => {
    const parsed = Rooms.parseAndConvert(['a2']);
    assert.deepEqual(parsed, [
      {
        adults: 2,
        childAges: [],
        infants: 0,
      },
    ]);
    assert.equal(Rooms.prettyFormat(parsed!), '2 people / 1 room');
  });

  it('parses multiple rooms composition e.g. a2,c5 and a1', () => {
    const parsed = Rooms.parseAndConvert(['a2,c5', 'a1']);
    assert.equal(parsed?.length, 2);
    assert.equal(Rooms.prettyFormat(parsed!), '4 people / 2 rooms');
  });
});
