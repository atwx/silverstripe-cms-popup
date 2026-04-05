import React from 'react';
import { render } from '@testing-library/react';
import Spinner from '../Spinner';

describe('Spinner', () => {
  it('renders a span with the correct class', () => {
    const { container } = render(<Spinner />);
    const span = container.querySelector('span.cms-popup__spinner');
    expect(span).toBeInTheDocument();
  });

  it('is aria-hidden so screen readers skip it', () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });
});
