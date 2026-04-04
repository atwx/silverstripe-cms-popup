import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { loadComponent } from 'lib/Injector';

// Key used to store the React root reference on the portal element
const ROOT_KEY = '__cmsModalRoot';

function openModal(triggerEl) {
  const componentName = triggerEl.dataset.modalComponent;
  const title = triggerEl.dataset.modalTitle || '';
  const size = triggerEl.dataset.modalSize || 'md';
  let modalData = {};
  if (triggerEl.dataset.modalData) {
    try {
      modalData = JSON.parse(triggerEl.dataset.modalData);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('CmsModalAction: invalid JSON in data-modal-data', err);
    }
  }

  if (!componentName) {
    // eslint-disable-next-line no-console
    console.warn('CmsModalAction: no data-modal-component set');
    return;
  }

  // Create portal container (once per page)
  let portal = document.getElementById('cms-modal-portal');
  if (!portal) {
    portal = document.createElement('div');
    portal.id = 'cms-modal-portal';
    document.body.appendChild(portal);
  }

  // Unmount any previously mounted modal before rendering a new one
  if (portal[ROOT_KEY]) {
    portal[ROOT_KEY].unmount();
  }

  const root = createRoot(portal);
  portal[ROOT_KEY] = root;

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

  const handleSaved = () => {
    const grid = triggerEl.closest('.grid-field');
    if (!grid || !window.jQuery) return;
    const $ = window.jQuery;
    const $grid = $(grid);
    const data = $grid.closest('form')
      .find(':input:not(.cms-content-filters :input, .relation-search)')
      .serializeArray();
    $.ajax({
      headers: { 'X-Pjax': 'CurrentField' },
      type: 'POST',
      url: $grid.data('url'),
      dataType: 'html',
      data,
      success(html) {
        $grid.empty().append($(html).children());
        $grid.trigger('reload', $grid);
      },
    });
  };

  const CmsModal = loadComponent('CmsModal');
  const ContentComponent = loadComponent(componentName);

  root.render(
    <Provider store={window.ss.store}>
      <CmsModal title={title} size={size} onClose={handleClose}>
        <ContentComponent data={modalData} onClose={handleClose} onSelect={handleSelect} onSaved={handleSaved} />
      </CmsModal>
    </Provider>
  );
}

// Use capture phase so our handler fires before SilverStripe's jQuery/entwine
// form-submit handlers and before React's synthetic event system. This prevents
// the CMS from treating the button click as a form submission (which would POST
// to the edit-form URL and produce a 404).
document.addEventListener('click', (e) => {
  const trigger = e.target.closest('.cms-modal-action');
  if (!trigger) return;
  e.preventDefault();
  e.stopPropagation();
  openModal(trigger);
}, true);
