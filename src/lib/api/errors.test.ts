import { describe, it, expect } from 'vitest';
import { friendlyMessage } from './errors';

describe('friendlyMessage', () => {
  it('prefers the backend message for a 400', () => {
    expect(friendlyMessage(400, { error: 'Segment already booked' })).toBe('Segment already booked');
  });

  it('falls back to a generic message for a 400 with no backend text', () => {
    expect(friendlyMessage(400, null)).toBe('Some details are invalid. Please check and try again.');
  });

  it('always uses a fixed message for 401, regardless of backend text', () => {
    expect(friendlyMessage(401, { error: 'anything' })).toBe('Your session has expired. Please sign in again.');
  });

  it('always uses a fixed message for 403', () => {
    expect(friendlyMessage(403, null)).toBe("You don't have access to this.");
  });

  it('always uses a fixed message for 404', () => {
    expect(friendlyMessage(404, null)).toBe("We couldn't find what you were looking for.");
  });

  it('prefers the backend message for a 409 conflict', () => {
    expect(friendlyMessage(409, { error: 'That seat is already taken' })).toBe('That seat is already taken');
  });

  it('always uses a fixed message for 429', () => {
    expect(friendlyMessage(429, { error: 'ignored' })).toBe('Too many requests — please wait a moment and try again.');
  });

  it('uses a generic server-error message for any 5xx', () => {
    expect(friendlyMessage(500, { error: 'stack trace leak' })).toBe('Something went wrong on our end. Please retry.');
    expect(friendlyMessage(503, null)).toBe('Something went wrong on our end. Please retry.');
  });

  it('falls back to the backend message for an unrecognized status', () => {
    expect(friendlyMessage(418, { error: "I'm a teapot" })).toBe("I'm a teapot");
  });
});
