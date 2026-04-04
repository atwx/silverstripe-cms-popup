/**
 * Mock for lib/Injector (provided by silverstripe/admin at runtime).
 * Returns the component unchanged so unit tests can render components
 * that call loadComponent() without needing a full SilverStripe stack.
 */
const loadComponent = (name) => {
  const mock = (props) => null; // eslint-disable-line react/display-name
  mock.displayName = `MockComponent(${name})`;
  return mock;
};

export { loadComponent };
