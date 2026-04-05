import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CmsModal from '../CmsModal';

describe('CmsModal', () => {
  const noop = () => {};

  it('renders the modal title', () => {
    render(<CmsModal title="My Popup" onClose={noop} />);
    expect(screen.getByText('My Popup')).toBeInTheDocument();
  });

  it('renders children inside the modal body', () => {
    render(
      <CmsModal title="Test" onClose={noop}>
        <p>Modal content</p>
      </CmsModal>,
    );
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    const handleClose = jest.fn();
    render(<CmsModal title="Close test" onClose={handleClose} />);

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape is pressed', () => {
    const handleClose = jest.fn();
    render(<CmsModal title="Keyboard test" onClose={handleClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('applies the size class to the dialog', () => {
    const { container } = render(<CmsModal title="Large" size="lg" onClose={noop} />);
    expect(container.querySelector('.cms-popup__dialog--lg')).toBeInTheDocument();
  });

  it('defaults to md size', () => {
    const { container } = render(<CmsModal title="Default size" onClose={noop} />);
    expect(container.querySelector('.cms-popup__dialog--md')).toBeInTheDocument();
  });
});
