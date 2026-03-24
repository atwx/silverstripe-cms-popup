import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const STATUS_PENDING = 'pending';
const STATUS_RUNNING = 'running';
const STATUS_SUCCESS = 'success';
const STATUS_WARNING = 'warning';
const STATUS_ERROR = 'error';

const statusIcons = {
  [STATUS_PENDING]: '\u23F3',
  [STATUS_SUCCESS]: '\u2705',
  [STATUS_WARNING]: '\u26A0\uFE0F',
  [STATUS_ERROR]: '\u274C',
};

const Spinner = () => (
  <span
    style={{
      display: 'inline-block',
      width: '16px',
      height: '16px',
      border: '2px solid #dee2e6',
      borderTop: '2px solid #0d6efd',
      borderRadius: '50%',
      animation: 'cms-modal-spin 0.8s linear infinite',
      verticalAlign: 'middle',
    }}
  />
);

const batchStyles = `
@keyframes cms-modal-spin { to { transform: rotate(360deg); } }
@keyframes cms-modal-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
`;

const CmsModalBatch = ({ data, onClose }) => {
  const {
    formEndpoint,
    actionEndpoint,
    queueEndpoint,
    submitLabel = 'Start',
    baseQueue = [],
  } = data || {};

  const formRef = useRef(null);
  const [formHtml, setFormHtml] = useState('');
  const [loadingForm, setLoadingForm] = useState(true);
  const [formError, setFormError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState([]);

  useEffect(() => {
    if (!formEndpoint) {
      setFormError('No form endpoint configured');
      setLoadingForm(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(formEndpoint, {
          headers: { 'X-Requested-With': 'XMLHttpRequest' },
        });
        if (!res.ok) {
          setFormError(`HTTP ${res.status}`);
        } else {
          setFormHtml(await res.text());
        }
      } catch (e) {
        setFormError(e.message || 'Network error');
      } finally {
        setLoadingForm(false);
      }
    })();
  }, [formEndpoint]);

  // Read form values from the server-rendered fields
  const getFormValues = () => {
    if (!formRef.current) return {};
    const values = {};
    const inputs = formRef.current.querySelectorAll('input, select, textarea');

    inputs.forEach((input) => {
      const { name, type } = input;
      if (!name) return;

      // SilverStripe CheckboxSetField: name="fieldName[key]"
      const match = name.match(/^([^[]+)\[([^\]]*)\]$/);
      if (match) {
        const [, groupName, key] = match;
        if (!values[groupName]) values[groupName] = [];
        if (type === 'checkbox' && input.checked) {
          values[groupName].push(key || input.value);
        }
        return;
      }

      if (type === 'checkbox') {
        values[name] = input.checked;
      } else if (type === 'radio') {
        if (input.checked) values[name] = input.value;
      } else {
        values[name] = input.value;
      }
    });

    return values;
  };

  const handleStart = async () => {
    const formValues = getFormValues();

    // Build queue
    let queue = [...baseQueue];

    // If recursive is checked, fetch children from queueEndpoint
    if (formValues.recursive && queueEndpoint) {
      try {
        const res = await fetch(queueEndpoint, {
          headers: { 'X-Requested-With': 'XMLHttpRequest' },
        });
        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const json = await res.json();
            (json.items || [])
              .filter((item) => item.enabled !== false)
              .forEach((item) => queue.push(item));
          }
        }
      } catch (e) {
        // continue with base queue only
      }
    }

    if (queue.length === 0) return;

    setProcessing(true);
    setDone(false);

    const initialProgress = queue.map((item) => ({
      ...item,
      status: STATUS_PENDING,
      details: [],
      message: '',
    }));
    setProgress(initialProgress);

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];

      setProgress((prev) =>
        prev.map((p, idx) => (idx === i ? { ...p, status: STATUS_RUNNING } : p))
      );

      try {
        const res = await fetch(actionEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: JSON.stringify({ ...item, ...formValues }),
        });

        const contentType = res.headers.get('content-type') || '';
        let result;

        if (contentType.includes('application/json')) {
          result = await res.json();
        } else {
          const html = await res.text();
          const errorMsg = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 300);
          result = { status: 'Error', message: `Server error (${res.status}): ${errorMsg}`, details: [] };
        }

        if (!res.ok && !result.message) {
          result.message = `HTTP ${res.status}`;
        }

        const hasError = !res.ok || (result.details || []).some((d) => d.level === 'error');
        const hasWarning = (result.details || []).some((d) => d.level === 'warning');
        let itemStatus = STATUS_SUCCESS;
        if (hasError) itemStatus = STATUS_ERROR;
        else if (hasWarning) itemStatus = STATUS_WARNING;

        setProgress((prev) =>
          prev.map((p, idx) =>
            idx === i ? { ...p, status: itemStatus, details: result.details || [], message: result.message || '' } : p
          )
        );
      } catch (e) {
        setProgress((prev) =>
          prev.map((p, idx) =>
            idx === i ? { ...p, status: STATUS_ERROR, message: e.message || 'Network error' } : p
          )
        );
      }
    }

    setProcessing(false);
    setDone(true);
  };

  const completedCount = progress.filter((p) => p.status !== STATUS_PENDING && p.status !== STATUS_RUNNING).length;
  const totalCount = progress.length;
  const successCount = progress.filter((p) => p.status === STATUS_SUCCESS).length;
  const errorCount = progress.filter((p) => p.status === STATUS_ERROR).length;
  const warningCount = progress.filter((p) => p.status === STATUS_WARNING).length;

  return (
    <div>
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: batchStyles }} />

      {/* Form phase */}
      {!processing && !done && (
        <div style={{ padding: '20px' }}>
          {loadingForm && (
            <div style={{ textAlign: 'center' }}>
              <span className="text-muted">Loading...</span>
            </div>
          )}

          {formError && (
            <div className="alert alert-danger">{formError}</div>
          )}

          {!loadingForm && !formError && (
            <>
              <div
                ref={formRef}
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: formHtml }}
              />

              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #dee2e6', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleStart}
                >
                  {submitLabel}
                </button>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Progress / Result phase */}
      {(processing || done) && (
        <div style={{ padding: '20px' }}>
          {/* Progress bar */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.9em' }}>
              <span>{processing ? 'Processing...' : 'Done'}</span>
              <span>{completedCount} / {totalCount}</span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: '#e9ecef', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%',
                height: '100%',
                backgroundColor: errorCount > 0 ? '#dc3545' : '#28a745',
                transition: 'width 0.3s ease',
                animation: processing ? 'cms-modal-pulse 1.5s ease-in-out infinite' : 'none',
              }} />
            </div>
          </div>

          {/* Summary */}
          {done && (
            <div style={{ marginBottom: '16px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px', fontSize: '0.9em' }}>
              <strong>Summary:</strong>{' '}
              {successCount > 0 && <span style={{ color: '#28a745' }}>{successCount} successful</span>}
              {warningCount > 0 && <span style={{ color: '#856404' }}>{successCount > 0 ? ', ' : ''}{warningCount} warnings</span>}
              {errorCount > 0 && <span style={{ color: '#dc3545' }}>{(successCount + warningCount) > 0 ? ', ' : ''}{errorCount} errors</span>}
            </div>
          )}

          {/* Item list */}
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {progress.map((item) => (
              <li key={item.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{item.status === STATUS_RUNNING ? <Spinner /> : (statusIcons[item.status] || '')}</span>
                  <strong>{item.title}</strong>
                  <span style={{ color: '#6c757d', fontSize: '0.85em' }}>#{item.id}</span>
                </div>
                {item.message && (
                  <div style={{ marginLeft: '28px', color: '#6c757d', fontSize: '0.85em' }}>{item.message}</div>
                )}
                {item.details && item.details.length > 0 && (
                  <ul style={{ listStyle: 'none', padding: 0, margin: '4px 0 0 28px', fontSize: '0.85em' }}>
                    {item.details.map((d) => (
                      <li key={d.label} style={{
                        color: d.level === 'error' ? '#dc3545' : d.level === 'warning' ? '#856404' : '#28a745',
                      }}>
                        {d.label}: {d.status}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>

          {/* Close button */}
          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #dee2e6', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={processing}>
              {done ? 'Close' : 'Cancel'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

CmsModalBatch.propTypes = {
  data: PropTypes.shape({
    formEndpoint: PropTypes.string,
    actionEndpoint: PropTypes.string,
    queueEndpoint: PropTypes.string,
    submitLabel: PropTypes.string,
    baseQueue: PropTypes.array,
  }),
  onClose: PropTypes.func,
};

CmsModalBatch.defaultProps = {
  data: {},
  onClose: () => {},
};

export default CmsModalBatch;
