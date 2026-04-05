/**
 * Mock for lib/Injector (provided by silverstripe/admin at runtime).
 * Returns a named mock component that renders `null`, so unit tests can
 * call loadComponent() without needing a full SilverStripe stack.
 */
const loadComponent = (name) => {
  const Mock = () => null;
  Mock.displayName = `MockComponent(${name})`;
  return Mock;
};

module.exports = { loadComponent };
