/**
 * The adapters between API responses and what components render.
 *
 * These are where a field-name mistake hides: the compiler cannot catch a mapper
 * that reads `sport_tag` and writes it to the wrong property, and every one of
 * these functions exists because a page expected a shape the API does not send.
 * A wrong mapping here shows up as a blank field, which is exactly the failure mode
 * this project spent most of its time removing.
 */
import { describe, expect, it } from 'vitest';

import { readBlob, blobString, blobPollOptions } from '@/hooks/useMessages';
import { levelStyleFor, LEVELS, getLevelTitle } from '@/store/gamificationStore';

describe('readBlob', () => {
  it('accepts an already-parsed object', () => {
    expect(readBlob({ formation: '4-3-3' })).toEqual({ formation: '4-3-3' });
  });

  // The API parses these before sending, but a realtime payload carries the raw
  // string — a renderer that assumed one shape showed nothing for the other.
  it('parses a JSON string, which is what a realtime payload carries', () => {
    expect(readBlob('{"formation":"4-3-3"}')).toEqual({ formation: '4-3-3' });
  });

  it('returns null for malformed JSON rather than throwing', () => {
    expect(readBlob('{not json')).toBeNull();
  });

  it('returns null for a JSON scalar, which is not a blob', () => {
    expect(readBlob('42')).toBeNull();
    expect(readBlob('"a string"')).toBeNull();
  });

  it('treats empty and nullish as absent', () => {
    expect(readBlob(null)).toBeNull();
    expect(readBlob(undefined)).toBeNull();
    expect(readBlob('')).toBeNull();
  });
});

describe('blobString', () => {
  it('reads a key from either shape', () => {
    expect(blobString({ match_time: 'Saturday 6PM' }, 'match_time')).toBe('Saturday 6PM');
    expect(blobString('{"match_time":"Sunday"}', 'match_time')).toBe('Sunday');
  });

  it('stringifies a number, so a numeric field still renders', () => {
    expect(blobString({ round: 3 }, 'round')).toBe('3');
  });

  it('returns an empty string for a missing key, never "undefined"', () => {
    expect(blobString({ a: 1 }, 'b')).toBe('');
    expect(blobString(null, 'b')).toBe('');
  });

  it('ignores a non-scalar value rather than rendering "[object Object]"', () => {
    expect(blobString({ nested: { a: 1 } }, 'nested')).toBe('');
  });
});

describe('blobPollOptions', () => {
  it('reads options from a parsed blob', () => {
    expect(blobPollOptions({ options: [{ text: '4-3-3', votes: 2 }] }))
      .toEqual([{ text: '4-3-3', votes: 2 }]);
  });

  it('reads options from a raw JSON string', () => {
    expect(blobPollOptions('{"options":[{"text":"A","votes":1}]}'))
      .toEqual([{ text: 'A', votes: 1 }]);
  });

  it('defaults a missing vote count to zero rather than NaN', () => {
    expect(blobPollOptions({ options: [{ text: 'A' }] })).toEqual([{ text: 'A', votes: 0 }]);
  });

  it('coerces a non-string label instead of dropping the option', () => {
    expect(blobPollOptions({ options: [{ text: 7, votes: 1 }] }))
      .toEqual([{ text: '7', votes: 1 }]);
  });

  it('returns an empty list when options are absent or not a list', () => {
    expect(blobPollOptions({ question: 'no options' })).toEqual([]);
    expect(blobPollOptions({ options: 'nope' })).toEqual([]);
    expect(blobPollOptions(null)).toEqual([]);
  });
});

describe('levelStyleFor', () => {
  // This replaced a formula that derived the level from *current* Pulse, which
  // disagreed with the server and could go down when Pulse was spent. It must be a
  // pure lookup on the number the server gives, with no arithmetic of its own.
  it('returns the style for the level asked for', () => {
    expect(levelStyleFor(1).level).toBe(1);
    expect(levelStyleFor(42).level).toBe(42);
  });

  it('clamps below and above the table rather than returning undefined', () => {
    expect(levelStyleFor(0).level).toBe(1);
    expect(levelStyleFor(-5).level).toBe(1);
    expect(levelStyleFor(9999).level).toBe(LEVELS.length);
  });

  it('always returns a title, colour and icon, so no card renders blank', () => {
    for (const lvl of [1, 50, 100, 101, 150]) {
      const style = levelStyleFor(lvl);
      expect(style.title).toBeTruthy();
      expect(style.color).toMatch(/^#/);
      expect(style.icon).toBeTruthy();
    }
  });

  it('never derives a level from a Pulse score', () => {
    // Passing a Pulse-shaped number must be treated as a level, not converted.
    expect(levelStyleFor(2450).level).toBe(LEVELS.length);
  });
});

describe('getLevelTitle', () => {
  it('gives every level in the table a title', () => {
    expect(LEVELS.every(l => Boolean(getLevelTitle(l.level)))).toBe(true);
  });
});
