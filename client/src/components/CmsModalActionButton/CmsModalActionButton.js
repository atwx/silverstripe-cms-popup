import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { createRoot } from 'react-dom/client';
import { loadComponent } from 'lib/Injector';

const ROOT_KEY = '__cmsModalRoot';

class CmsModalActionButton extends Component {
  handleClick(event) {
    // Stop React's FormBuilder from recording this as a form submission action.
    // isPropagationStopped() is checked in FormBuilder.handleAction() — if true,
    // submittingAction is never set and the form is not submitted.
    event.stopPropagation();
    event.preventDefault();

    const { attributes, title } = this.props;
    const componentName = (attributes || {})['data-modal-component'];
    const modalTitle = (attributes || {})['data-modal-title'] || title || '';
    const modalData = JSON.parse((attributes || {})['data-modal-data'] || '{}');
    const size = (attributes || {})['data-modal-size'] || 'md';

    if (!componentName) {
      // eslint-disable-next-line no-console
      console.warn('CmsModalActionButton: data-modal-component not set');
      return;
    }

    let portal = document.getElementById('cms-modal-portal');
    if (!portal) {
      portal = document.createElement('div');
      portal.id = 'cms-modal-portal';
      document.body.appendChild(portal);
    }

    if (portal[ROOT_KEY]) {
      portal[ROOT_KEY].unmount();
    }

    const root = createRoot(portal);
    portal[ROOT_KEY] = root;

    const triggerEl = event.currentTarget;

    const handleClose = () => {
      root.unmount();
      portal[ROOT_KEY] = null;
    };

    const handleSelect = (selectedData) => {
      triggerEl.dispatchEvent(new CustomEvent('cms-modal:select', {
        detail: selectedData,
        bubbles: true,
      }));
      handleClose();
    };

    const CmsModal = loadComponent('CmsModal');
    const ContentComponent = loadComponent(componentName);

    root.render(
      <CmsModal title={modalTitle} size={size} onClose={handleClose}>
        <ContentComponent data={modalData} onClose={handleClose} onSelect={handleSelect} />
      </CmsModal>
    );
  }

  render() {
    const { title, extraClass, disabled } = this.props;

    return (
      <button
        type="button"
        className={`btn action cms-modal-action ${extraClass || ''}`}
        disabled={disabled}
        onClick={(e) => this.handleClick(e)}
      >
        <span className="btn__title">{title}</span>
      </button>
    );
  }
}

CmsModalActionButton.propTypes = {
  title: PropTypes.string,
  extraClass: PropTypes.string,
  disabled: PropTypes.bool,
  attributes: PropTypes.shape({
    'data-modal-component': PropTypes.string,
    'data-modal-title': PropTypes.string,
    'data-modal-data': PropTypes.string,
    'data-modal-size': PropTypes.string,
  }),
};

CmsModalActionButton.defaultProps = {
  title: '',
  extraClass: '',
  disabled: false,
  attributes: {},
};

export default CmsModalActionButton;
