import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import CmsModalOverlay from '../CmsModalOverlay';

describe('CmsModalOverlay', () => {
  it('renders children', () => {
    const { getByText } = render(
      <CmsModalOverlay onClose={() => {}}>
        <span>inner</span>
      </CmsModalOverlay>,
    );
    expect(getByText('inner')).toBeInTheDocument();
  });

  it('calls onClose when the overlay is clicked', () => {
    const handleClose = jest.fn();
    const { container } = render(
      <CmsModalOverlay onClose={handleClose}>
        <span>child</span>
      </CmsModalOverlay>,
    );

    fireEvent.click(container.firstChild);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('registers and cleans up the keydown listener', () => {
    const handleClose = jest.fn();
    const addSpy = jest.spyOn(document, 'addEventListener');
    const removeSpy = jest.spyOn(document, 'removeEventListener');

    const { unmount } = render(<CmsModalOverlay onClose={handleClose}><span /></CmsModalOverlay>);

    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
