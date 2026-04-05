import React from 'react';
import { render } from '@testing-library/react';
import StatusIcon from '../StatusIcon';

describe('StatusIcon', () => {
  it('renders a Spinner for "running" status', () => {
    const { container } = render(<StatusIcon status="running" />);
    expect(container.querySelector('.cms-popup__spinner')).toBeInTheDocument();
  });

  it('renders a success icon for "success" status', () => {
    const { container } = render(<StatusIcon status="success" />);
    const icon = container.querySelector('.cms-popup__status-icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('aria-label', 'Success');
    expect(icon.classList.contains('font-icon-check-mark')).toBe(true);
  });

  it('renders an error icon for "error" status', () => {
    const { container } = render(<StatusIcon status="error" />);
    const icon = container.querySelector('.cms-popup__status-icon');
    expect(icon).toHaveAttribute('aria-label', 'Error');
  });

  it('renders a warning icon for "warning" status', () => {
    const { container } = render(<StatusIcon status="warning" />);
    const icon = container.querySelector('.cms-popup__status-icon');
    expect(icon).toHaveAttribute('aria-label', 'Warning');
  });

  it('renders nothing for an unknown status', () => {
    const { container } = render(<StatusIcon status="unknown" />);
    expect(container.firstChild).toBeNull();
  });
});
