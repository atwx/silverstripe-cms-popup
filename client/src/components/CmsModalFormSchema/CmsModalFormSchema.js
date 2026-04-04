import React, { useState } from 'react';
import PropTypes from 'prop-types';
// FormBuilderLoader is exposed as window.FormBuilderLoader by the admin bundle.
// The webpack-external maps this import path to that global at build time.
// eslint-disable-next-line import/no-unresolved
import FormBuilderLoader from 'containers/FormBuilderLoader/FormBuilderLoader';

/**
 * CmsModalFormSchema – renders a SilverStripe FormSchema inside the modal.
 *
 * Uses FormBuilderLoader from @silverstripe/admin, which supports all field
 * types including HTMLEditorField (TinyMCE). The modal closes automatically
 * after a successful save.
 *
 * Expected data props:
 *   schemaUrl  {string}  URL of the LeftAndMain action that returns the form schema.
 *   identifier {string}  Optional unique key for the Redux form state.
 *                        Defaults to schemaUrl. Must be stable per record.
 */
const CmsModalFormSchema = ({ data, onClose, onSaved }) => {
  const { schemaUrl, identifier } = data || {};
  const [saved, setSaved] = useState(false);

  if (!schemaUrl) {
    return (
      <div style={{ padding: '20px' }}>
        <div className="alert alert-danger">No schemaUrl configured.</div>
      </div>
    );
  }

  const handleSubmitSuccess = () => {
    if (onSaved) onSaved();
    setSaved(true);
    setTimeout(() => {
      if (onClose) onClose();
    }, 600);
  };

  if (saved) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <span className="font-icon-check-mark" style={{ marginRight: 6 }} />
        Gespeichert.
      </div>
    );
  }

  return (
    <div className="cms-popup__form-schema">
      <FormBuilderLoader
        identifier={identifier || schemaUrl}
        schemaUrl={schemaUrl}
        onSubmitSuccess={handleSubmitSuccess}
      />
    </div>
  );
};

CmsModalFormSchema.propTypes = {
  data: PropTypes.shape({
    schemaUrl: PropTypes.string,
    identifier: PropTypes.string,
  }),
  onClose: PropTypes.func,
  onSaved: PropTypes.func,
};

CmsModalFormSchema.defaultProps = {
  data: {},
  onClose: null,
  onSaved: null,
};

export default CmsModalFormSchema;
