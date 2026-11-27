export function getAuthCallbackDestination(next, after) {
  if (next === '/admin') return '/admin';
  if (next === '/reset-password') {
    return after === '/admin' ? '/reset-password?next=/admin' : '/reset-password';
  }
  return '/client';
}
