import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Check,
  ArrowRight,
  ArrowLeft,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react';
import { apiClient, formatApiErrorMessage } from '../../lib/apiClient';
import { useProject } from '../../context/ProjectContext';

export const CreateProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshProjects, setActiveProjectId } = useProject();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form State across steps
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    client: '',
    location: '',
    contract_type: '',
    budget: '',
    start_date: '',
    end_date: '',
    description: '',
  });

  const validateStep = (currentStep: number): boolean => {
    const errs: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.name.trim()) {
        errs.name = 'Project Name is required.';
      } else if (formData.name.trim().length < 3) {
        errs.name = 'Project Name must be at least 3 characters.';
      }

      if (!formData.code.trim()) {
        errs.code = 'Project / WBS Code is required.';
      } else if (formData.code.trim().length < 2) {
        errs.code = 'WBS Code must be at least 2 characters.';
      }

      if (!formData.client.trim()) {
        errs.client = 'Client / Authority name is required.';
      }

      if (!formData.location.trim()) {
        errs.location = 'Location / Corridor is required.';
      }
    }

    if (currentStep === 2) {
      if (!formData.contract_type.trim()) {
        errs.contract_type = 'Contract type is required.';
      }
      if (!formData.budget.trim()) {
        errs.budget = 'Contract budget value is required.';
      }
      if (!formData.start_date) {
        errs.start_date = 'Planned start date is required.';
      }
      if (!formData.end_date) {
        errs.end_date = 'Contractual end date is required.';
      } else if (formData.start_date && formData.end_date <= formData.start_date) {
        errs.end_date = 'Contractual end date must be after planned start date.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < 5) setStep(step + 1);
    }
  };

  const handleBack = () => {
    setErrors({});
    if (step > 1) setStep(step - 1);
  };

  const handleFinish = async () => {
    if (!validateStep(1)) {
      setStep(1);
      return;
    }
    if (!validateStep(2)) {
      setStep(2);
      return;
    }

    setLoading(true);
    try {
      const created = await apiClient.createProject({
        name: formData.name.trim(),
        code: formData.code.trim(),
        client: formData.client.trim(),
        location: formData.location.trim(),
        contract_type: formData.contract_type.trim(),
        budget: formData.budget.trim(),
        status: 'active',
        progress: 0,
        start_date: formData.start_date,
        end_date: formData.end_date,
      });
      await refreshProjects();
      setActiveProjectId(created.id);
      navigate(`/projects/${created.id}/overview`);
    } catch (err) {
      console.error('Failed to create project', err);
      setErrors({ form: formatApiErrorMessage(err) });
      setLoading(false);
    }
  };

  const stepsHeader = [
    { num: 1, title: 'Project Info' },
    { num: 2, title: 'Contract Details' },
    { num: 3, title: 'Import Schedule' },
    { num: 4, title: 'Assign Team' },
    { num: 5, title: 'Review & Launch' },
  ];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <Link to="/projects" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '12px' }}>
          <ArrowLeft size={14} /> Back to Projects
        </Link>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Create New Project Workspace
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          Set up master baseline parameters, schedule activities, and team governance.
        </p>
      </div>

      {/* Step Progress Tracker */}
      <div
        className="bionis-card"
        style={{
          padding: '16px 24px',
          marginBottom: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {stepsHeader.map((s, idx) => {
          const isDone = step > s.num;
          const isCurrent = step === s.num;
          return (
            <React.Fragment key={s.num}>
              {idx > 0 && (
                <div
                  style={{
                    flex: 1,
                    height: '2px',
                    margin: '0 8px',
                    backgroundColor: isDone ? 'var(--confidence-high)' : 'var(--border-subtle)',
                  }}
                />
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: isDone
                      ? 'var(--confidence-high)'
                      : isCurrent
                      ? 'var(--accent-blue)'
                      : 'var(--bg-surface)',
                    color: isDone || isCurrent ? '#0f172a' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  {isDone ? <Check size={14} /> : s.num}
                </div>
                <span
                  className={`stepper-step-title ${!isCurrent ? 'inactive' : ''}`}
                  style={{
                    fontSize: '13px',
                    fontWeight: isCurrent ? 700 : 500,
                    color: isCurrent ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}
                >
                  {s.title}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content Card */}
      <div className="bionis-card bionis-card-glow-blue" style={{ padding: '36px' }}>
        {/* Step 1: Project Info */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>Step 1: Project Information</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
              Define primary project identifiers and client attributes.
            </p>

            <div className="form-group">
              <label className="form-label">Project Name *</label>
              <input
                type="text"
                className="form-input"
                style={errors.name ? { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)' } : {}}
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
              />
              {errors.name && (
                <div style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} /> {errors.name}
                </div>
              )}
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label">Project / WBS Package Code *</label>
                <input
                  type="text"
                  className="form-input"
                  style={errors.code ? { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)' } : {}}
                  value={formData.code}
                  onChange={(e) => {
                    setFormData({ ...formData, code: e.target.value });
                    if (errors.code) setErrors((prev) => ({ ...prev, code: '' }));
                  }}
                />
                {errors.code && (
                  <div style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} /> {errors.code}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Client / Authority *</label>
                <input
                  type="text"
                  className="form-input"
                  style={errors.client ? { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)' } : {}}
                  value={formData.client}
                  onChange={(e) => {
                    setFormData({ ...formData, client: e.target.value });
                    if (errors.client) setErrors((prev) => ({ ...prev, client: '' }));
                  }}
                />
                {errors.client && (
                  <div style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} /> {errors.client}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Location / Corridor *</label>
              <input
                type="text"
                className="form-input"
                style={errors.location ? { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)' } : {}}
                value={formData.location}
                onChange={(e) => {
                  setFormData({ ...formData, location: e.target.value });
                  if (errors.location) setErrors((prev) => ({ ...prev, location: '' }));
                }}
              />
              {errors.location && (
                <div style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} /> {errors.location}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Contract Details */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>Step 2: Contract Details</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
              Provide contractual timeline and budgetary benchmarks.
            </p>

            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label">Contract Type *</label>
                <input
                  type="text"
                  className="form-input"
                  style={errors.contract_type ? { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)' } : {}}
                  value={formData.contract_type}
                  onChange={(e) => {
                    setFormData({ ...formData, contract_type: e.target.value });
                    if (errors.contract_type) setErrors((prev) => ({ ...prev, contract_type: '' }));
                  }}
                />
                {errors.contract_type && (
                  <div style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} /> {errors.contract_type}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Contract Value / Budget *</label>
                <input
                  type="text"
                  className="form-input"
                  style={errors.budget ? { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)' } : {}}
                  value={formData.budget}
                  onChange={(e) => {
                    setFormData({ ...formData, budget: e.target.value });
                    if (errors.budget) setErrors((prev) => ({ ...prev, budget: '' }));
                  }}
                />
                {errors.budget && (
                  <div style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} /> {errors.budget}
                  </div>
                )}
              </div>
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label">Planned Start Date *</label>
                <input
                  type="date"
                  className="form-input"
                  style={errors.start_date ? { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)' } : {}}
                  value={formData.start_date}
                  onChange={(e) => {
                    setFormData({ ...formData, start_date: e.target.value });
                    if (errors.start_date) setErrors((prev) => ({ ...prev, start_date: '' }));
                  }}
                />
                {errors.start_date && (
                  <div style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} /> {errors.start_date}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Contractual End Date *</label>
                <input
                  type="date"
                  className="form-input"
                  style={errors.end_date ? { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)' } : {}}
                  value={formData.end_date}
                  onChange={(e) => {
                    setFormData({ ...formData, end_date: e.target.value });
                    if (errors.end_date) setErrors((prev) => ({ ...prev, end_date: '' }));
                  }}
                />
                {errors.end_date && (
                  <div style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} /> {errors.end_date}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Scope Description</label>
              <textarea
                rows={3}
                className="form-textarea"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>Step 3: Master Schedule Baseline</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
              Create the workspace first, then import the approved CSV or Excel baseline from its Schedule page.
            </p>
            <div style={{ border: '1px dashed var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <FileSpreadsheet size={32} style={{ color: 'var(--accent-blue)', margin: '0 auto 10px' }} />
              No baseline schedule has been imported yet.
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>Step 4: Governance & Team Assignment</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
              Team members can be invited after the project is created from the project's Team page.
            </p>
          </div>
        )}

        {/* Step 5: Review & Complete */}
        {step === 5 && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>Step 5: Review & Launch Workspace</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
              Confirm your project configuration to initialize the workspace.
            </p>

            <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Project Name:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>{formData.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>WBS Code:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)', fontSize: '13px' }}>{formData.code}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Client:</span>
                <span style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{formData.client}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Budget:</span>
                <span style={{ color: 'var(--confidence-high)', fontWeight: 600, fontSize: '13px' }}>{formData.budget}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Baseline Schedule:</span>
                <span style={{ color: 'var(--text-primary)', fontSize: '13px' }}>Not imported</span>
              </div>
            </div>
          </div>
        )}

        {errors.form && (
          <div role="alert" style={{ color: 'var(--error, #ef4444)', marginTop: '16px' }}>
            {errors.form}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
          {step > 1 ? (
            <button type="button" className="btn btn-secondary" onClick={handleBack}>
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button type="button" className="btn btn-primary" onClick={handleNext}>
              Next Step <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              disabled={loading}
              onClick={handleFinish}
            >
              {loading ? 'Initializing Workspace...' : 'Launch Project Workspace'} <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
