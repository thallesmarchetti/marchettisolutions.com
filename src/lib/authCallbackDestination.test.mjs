import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getAuthCallbackDestination } from './authCallbackDestination.mjs';

test('preserves supported callback destinations', () => {
  assert.equal(getAuthCallbackDestination('/admin', null), '/admin');
  assert.equal(getAuthCallbackDestination('/reset-password', null), '/reset-password');
  assert.equal(getAuthCallbackDestination('/reset-password', '/admin'), '/reset-password?next=/admin');
  assert.equal(getAuthCallbackDestination('/client', null), '/client');
});

test('falls back to the client page for unapproved and external destinations', () => {
  const destinations = [
    '//evil.example',
    '/\\evil.example',
    'https://evil.example',
    '/admin?external=1',
  ];

  for (const destination of destinations) {
    assert.equal(getAuthCallbackDestination(destination, null), '/client');
  }

  const encodedDestinations = [
    'next=%2F%2Fevil.example',
    'next=%2F%5Cevil.example',
    'next=https%3A%2F%2Fevil.example',
  ];

  for (const query of encodedDestinations) {
    const next = new URLSearchParams(query).get('next');
    assert.equal(getAuthCallbackDestination(next, null), '/client');
  }
});
