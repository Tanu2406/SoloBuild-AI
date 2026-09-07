import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileSpreadsheet, Table2, Check, ChevronRight, X, Play } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input, Textarea, Select } from '../components/ui/Input';
import { RecruiterCard } from '../components/product/RecruiterCard';
import { Avatar } from '../components/ui/Avatar';
import { useToast } from '../components/ui/Toast';
import { mockAIRecruiters } from '../mock/data';
import type { AIRecruiter, CreateHiringForm } from '../types';

type Step = 'job' | 'candidates' | 'recruiter' | 'review';

const STEPS: { id: Step; label: string }[] = [
  { id: 'job', label: 'Define Job' },
  { id: 'candidates', label: 'Add Candidates' },
  { id: 'recruiter', label: 'AI Recruiter' },
  { id: 'review', label: 'Review & Launch' },
];

const employmentOptions = [
  { value: '', label: 'Select type' },
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
];

const mockCandidatePreview = [
  { name: 'Aarav Sharma', phone: '+91 98765 43210', email: 'aarav.sharma@email.com', position: 'Sales Executive', location: 'Pune', experience: '3 yrs' },
  { name: 'Priya Patil', phone: '+91 87654 32109', email: 'priya.patil@email.com', position: 'Sales Executive', location: 'Pune', experience: '2 yrs' },
  { name: 'Rahul Mehta', phone: '+91 76543 21098', email: 'rahul.mehta@email.com', position: 'Sales Executive', location: 'Pune', experience: '5 yrs' },
  { name: 'Sneha Joshi', phone: '+91 65432 10987', email: 'sneha.joshi@email.com', position: 'Sales Executive', location: 'Pune', experience: '4 yrs' },
  { name: 'Kiran Desai', phone: '+91 54321 09876', email: 'kiran.desai@email.com', position: 'Sales Executive', location: 'Pune', experience: '1 yr' },
];

const CreateHiring: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>('job');
  const [isDragging, setIsDragging] = useState(false);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [selectedRecruiter, setSelectedRecruiter] = useState<AIRecruiter | null>(null);
  const [launching, setLaunching] = useState(false);

  const [form, setForm] = useState<CreateHiringForm>({
    title: '',
    location: '',
    employmentType: 'full_time',
    description: '',
  });

  const [errors, setErrors] = useState<Partial<CreateHiringForm>>({});

  const currentIndex = STEPS.findIndex(s => s.id === currentStep);

  const validateJob = () => {
    const e: Partial<CreateHiringForm> = {};
    if (!form.title.trim()) e.title = 'Job title is required';
    if (!form.location.trim()) e.location = 'Location is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 'job' && !validateJob()) return;
    if (currentStep === 'candidates' && !fileUploaded) {
      showToast('Please upload candidates first', 'error');
      return;
    }
    if (currentStep === 'recruiter' && !selectedRecruiter) {
      showToast('Please select an AI Recruiter', 'error');
      return;
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id);
    }
  };

  const handleBack = () => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id);
    } else {
      navigate('/hiring');
    }
  };

  const handleLaunch = () => {
    setLaunching(true);
    setTimeout(() => {
      showToast(`${form.title} launched! AI Recruiter is calling candidates.`, 'success');
      navigate('/hiring/h1');
    }, 2000);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setFileUploaded(true);
  };

  const handleFileChange = () => {
    setFileUploaded(true);
  };

  return (
    <div className="create-hiring animate-fade-in">
      {/* Header */}
      <div className="create-hiring__header">
        <button className="create-hiring__back" onClick={handleBack}>
          <ArrowLeft size={16} />
          {currentIndex === 0 ? 'Back to Hiring' : 'Back'}
        </button>
        <div className="create-hiring__stepper">
          {STEPS.map((step, i) => (
            <React.Fragment key={step.id}>
              <div
                className={`stepper__step ${
                  i < currentIndex ? 'stepper__step--done' :
                  i === currentIndex ? 'stepper__step--active' :
                  'stepper__step--upcoming'
                }`}
              >
                <div className="stepper__circle">
                  {i < currentIndex ? <Check size={12} strokeWidth={3} /> : i + 1}
                </div>
                <span className="stepper__label">{step.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`stepper__line ${i < currentIndex ? 'stepper__line--done' : ''}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="create-hiring__body">
        <div className="create-hiring__panel">

          {/* Step 1: Define Job */}
          {currentStep === 'job' && (
            <div className="ch-step animate-fade-in">
              <div className="ch-step__heading">
                <h2>Define the job</h2>
                <p>Tell us what role you're hiring for.</p>
              </div>
              <div className="ch-step__form">
                <Input
                  label="Job title"
                  placeholder="e.g. Sales Executive, Frontend Developer"
                  value={form.title}
                  onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setErrors(er => ({ ...er, title: '' })); }}
                  error={errors.title}
                />
                <div className="ch-step__row">
                  <Input
                    label="Location"
                    placeholder="e.g. Pune, Bangalore, Mumbai"
                    value={form.location}
                    onChange={e => { setForm(f => ({ ...f, location: e.target.value })); setErrors(er => ({ ...er, location: '' })); }}
                    error={errors.location}
                  />
                  <Select
                    label="Employment type"
                    options={employmentOptions}
                    value={form.employmentType}
                    onChange={e => setForm(f => ({ ...f, employmentType: e.target.value as any }))}
                  />
                </div>
                <Textarea
                  label="Job description"
                  placeholder="Brief description of the role, responsibilities, and what you're looking for..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={5}
                  hint="Optional. This helps your AI Recruiter have more relevant conversations."
                />
              </div>
            </div>
          )}

          {/* Step 2: Add Candidates */}
          {currentStep === 'candidates' && (
            <div className="ch-step animate-fade-in">
              <div className="ch-step__heading">
                <h2>Add candidates</h2>
                <p>Upload your candidate list to get started.</p>
              </div>

              {!fileUploaded ? (
                <div className="ch-candidates">
                  {/* Upload */}
                  <div
                    className={`file-upload ${isDragging ? 'file-upload--dragging' : ''}`}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                  >
                    <div className="file-upload__icon">
                      <FileSpreadsheet size={28} />
                    </div>
                    <p className="file-upload__title">Upload Excel / CSV</p>
                    <p className="file-upload__sub">Drag & drop your file here</p>
                    <label className="file-upload__btn">
                      <input type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={handleFileChange} />
                      Browse file
                    </label>
                    <p className="file-upload__formats">Supports .xlsx, .xls, .csv</p>
                  </div>

                  <div className="ch-divider">
                    <span>or</span>
                  </div>

                  {/* Google Sheets */}
                  <button className="gs-connect" onClick={() => setFileUploaded(true)}>
                    <div className="gs-connect__icon">
                      <Table2 size={22} color="#0f9d58" />
                    </div>
                    <div className="gs-connect__text">
                      <span className="gs-connect__title">Connect Google Sheets</span>
                      <span className="gs-connect__sub">Import directly from a spreadsheet</span>
                    </div>
                    <ChevronRight size={16} color="var(--text-tertiary)" />
                  </button>
                </div>
              ) : (
                <div className="candidate-preview animate-fade-in">
                  <div className="candidate-preview__header">
                    <div className="candidate-preview__info">
                      <div className="candidate-preview__count-badge">
                        <Check size={14} strokeWidth={2.5} />
                        250 candidates ready
                      </div>
                      <span className="candidate-preview__source">Imported from Excel</span>
                    </div>
                    <button className="candidate-preview__change" onClick={() => setFileUploaded(false)}>
                      <X size={14} /> Change file
                    </button>
                  </div>

                  <div className="candidate-preview__table-wrap">
                    <table className="candidate-preview__table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Phone</th>
                          <th>Email</th>
                          <th>Position</th>
                          <th>Location</th>
                          <th>Experience</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockCandidatePreview.map((c, i) => (
                          <tr key={i}>
                            <td className="font-medium">{c.name}</td>
                            <td>{c.phone}</td>
                            <td>{c.email}</td>
                            <td>{c.position}</td>
                            <td>{c.location}</td>
                            <td>{c.experience}</td>
                          </tr>
                        ))}
                        <tr className="preview-more">
                          <td colSpan={6}>+ 245 more candidates</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: AI Recruiter */}
          {currentStep === 'recruiter' && (
            <div className="ch-step animate-fade-in">
              <div className="ch-step__heading">
                <h2>Choose your AI Recruiter</h2>
                <p>Your AI Recruiter will conduct the initial screening conversations with candidates.</p>
              </div>

              <div className="ch-recruiters">
                {mockAIRecruiters.map(recruiter => (
                  <RecruiterCard
                    key={recruiter.id}
                    recruiter={recruiter}
                    selected={selectedRecruiter?.id === recruiter.id}
                    onClick={() => setSelectedRecruiter(recruiter)}
                  />
                ))}
              </div>

              {selectedRecruiter && (
                <div className="ch-recruiter-config animate-fade-in">
                  <h3 className="ch-recruiter-config__title">Interview instructions</h3>
                  <p className="ch-recruiter-config__sub">
                    Tell {selectedRecruiter.name} what to ask and what to screen for.
                  </p>
                  <Textarea
                    placeholder={`Screen candidates for the ${form.title || 'role'} position. Ask about their experience, availability and expected salary.`}
                    defaultValue={
                      form.title
                        ? `Screen candidates for the ${form.title} position in ${form.location}. Ask about their experience, current role, availability to join, and expected salary. Be friendly and professional.`
                        : selectedRecruiter.interviewInstructions
                    }
                    rows={4}
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 4: Review & Launch */}
          {currentStep === 'review' && (
            <div className="ch-step animate-fade-in">
              <div className="ch-step__heading">
                <h2>Review your hiring</h2>
                <p>Everything looks good? Let's start calling.</p>
              </div>

              <div className="review-cards">
                <div className="review-card">
                  <div className="review-card__label">JOB</div>
                  <div className="review-card__value">{form.title || 'Sales Executive'}</div>
                  <div className="review-card__sub">{form.location || 'Pune'} · {form.employmentType === 'full_time' ? 'Full-time' : form.employmentType}</div>
                </div>
                <div className="review-card">
                  <div className="review-card__label">CANDIDATES</div>
                  <div className="review-card__value">250 candidates</div>
                  <div className="review-card__sub">Imported from Excel</div>
                </div>
                <div className="review-card">
                  <div className="review-card__label">AI RECRUITER</div>
                  <div className="review-card__value-row">
                    {selectedRecruiter && <Avatar name={selectedRecruiter.name} size="sm" color={selectedRecruiter.avatarColor} />}
                    <span className="review-card__value">{selectedRecruiter?.name || 'Ava'}</span>
                  </div>
                  <div className="review-card__sub">{selectedRecruiter?.languages.join(' + ') || 'English + Hindi'} · {selectedRecruiter?.conversationStyle || 'Professional'}</div>
                </div>
                <div className="review-card">
                  <div className="review-card__label">CALLING</div>
                  <div className="review-card__value">250 candidates</div>
                  <div className="review-card__sub">Working hours: 10 AM – 6 PM</div>
                </div>
              </div>

              <div className="review-ready">
                <div className="review-ready__icon">
                  <Check size={18} strokeWidth={2.5} />
                </div>
                <span className="review-ready__text">Everything looks ready.</span>
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="ch-step__actions">
            <Button variant="secondary" onClick={handleBack}>
              {currentIndex === 0 ? 'Cancel' : 'Back'}
            </Button>
            {currentStep !== 'review' ? (
              <Button onClick={handleNext} iconRight={<ChevronRight size={15} />}>
                Continue
              </Button>
            ) : (
              <Button
                onClick={handleLaunch}
                loading={launching}
                icon={<Play size={15} />}
                size="lg"
              >
                Start calling
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateHiring;

const style = document.createElement('style');
style.textContent = `
.create-hiring {
  min-height: 100vh;
  background: var(--bg-app);
}

.create-hiring__header {
  background: var(--bg-white);
  border-bottom: 1px solid var(--border-default);
  padding: 16px 40px;
  display: flex;
  align-items: center;
  gap: 40px;
  position: sticky;
  top: 0;
  z-index: 50;
}

.create-hiring__back {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition: color var(--transition-fast);
}
.create-hiring__back:hover { color: var(--text-primary); }

.create-hiring__stepper {
  display: flex;
  align-items: center;
  gap: 0;
  flex: 1;
  justify-content: center;
}

.stepper__step {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stepper__circle {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: 600;
  flex-shrink: 0;
  transition: all var(--transition-base);
}

.stepper__step--done .stepper__circle {
  background: var(--brand-primary);
  color: white;
}
.stepper__step--active .stepper__circle {
  background: var(--brand-primary);
  color: white;
  box-shadow: 0 0 0 3px rgba(37,99,235,0.2);
}
.stepper__step--upcoming .stepper__circle {
  background: var(--bg-subtle);
  color: var(--text-tertiary);
  border: 1px solid var(--border-default);
}

.stepper__label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  white-space: nowrap;
}
.stepper__step--active .stepper__label { color: var(--brand-primary); }
.stepper__step--done .stepper__label { color: var(--text-secondary); }
.stepper__step--upcoming .stepper__label { color: var(--text-tertiary); }

.stepper__line {
  height: 1px;
  width: 40px;
  background: var(--border-default);
  margin: 0 12px;
  flex-shrink: 0;
  transition: background var(--transition-base);
}
.stepper__line--done { background: var(--brand-primary); }

.create-hiring__body {
  display: flex;
  justify-content: center;
  padding: 48px 24px;
}

.create-hiring__panel {
  width: 100%;
  max-width: 640px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.ch-step {
  background: var(--bg-white);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
  padding: 36px;
  display: flex;
  flex-direction: column;
  gap: 28px;
  margin-bottom: 16px;
}

.ch-step__heading h2 {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.3px;
  margin-bottom: 6px;
}
.ch-step__heading p {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
}

.ch-step__form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ch-step__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.ch-step__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 4px;
}

/* File upload */
.ch-candidates {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.file-upload {
  border: 2px dashed var(--border-strong);
  border-radius: var(--radius-lg);
  padding: 40px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: center;
  background: var(--bg-app);
}
.file-upload:hover, .file-upload--dragging {
  border-color: var(--brand-primary);
  background: var(--brand-primary-light);
}

.file-upload__icon {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-lg);
  background: var(--bg-white);
  border: 1px solid var(--border-default);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--brand-primary);
  margin-bottom: 4px;
}

.file-upload__title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.file-upload__sub {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.file-upload__btn {
  margin-top: 4px;
  display: inline-flex;
  align-items: center;
  padding: 8px 18px;
  border-radius: var(--radius-md);
  border: 1px solid var(--brand-primary);
  color: var(--brand-primary);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  background: var(--bg-white);
  transition: background var(--transition-fast);
}
.file-upload__btn:hover { background: var(--brand-primary-light); }

.file-upload__formats {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin-top: 2px;
}

.ch-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
}
.ch-divider::before, .ch-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-default);
}

.gs-connect {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  border: 1.5px solid var(--border-default);
  border-radius: var(--radius-lg);
  cursor: pointer;
  background: var(--bg-white);
  transition: all var(--transition-fast);
  text-align: left;
}
.gs-connect:hover {
  border-color: #0f9d58;
  background: #f0fdf4;
}

.gs-connect__icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.gs-connect__text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.gs-connect__title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
}
.gs-connect__sub {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* Candidate preview */
.candidate-preview {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.candidate-preview__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.candidate-preview__info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.candidate-preview__count-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  background: var(--status-success-bg);
  color: var(--status-success-text);
  border: 1px solid var(--status-success-border);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.candidate-preview__source {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.candidate-preview__change {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  transition: color var(--transition-fast);
}
.candidate-preview__change:hover { color: var(--text-primary); }

.candidate-preview__table-wrap {
  overflow-x: auto;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
}

.candidate-preview__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.candidate-preview__table th {
  padding: 10px 14px;
  text-align: left;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: var(--bg-subtle);
  border-bottom: 1px solid var(--border-default);
  white-space: nowrap;
}

.candidate-preview__table td {
  padding: 10px 14px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-default);
  white-space: nowrap;
}
.candidate-preview__table td.font-medium { font-weight: 500; }
.candidate-preview__table tr:last-child td { border-bottom: none; }
.candidate-preview__table tr:hover:not(.preview-more) td { background: var(--bg-hover); }

.preview-more td {
  color: var(--text-tertiary);
  font-style: italic;
  text-align: center;
  padding: 8px;
}

/* Recruiters */
.ch-recruiters {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ch-recruiter-config {
  background: var(--bg-app);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ch-recruiter-config__title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
}

.ch-recruiter-config__sub {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* Review */
.review-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.review-card {
  padding: 20px;
  background: var(--bg-app);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.review-card__label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
}

.review-card__value {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--text-primary);
}

.review-card__value-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.review-card__sub {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.review-ready {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  background: var(--status-success-bg);
  border: 1px solid var(--status-success-border);
  border-radius: var(--radius-lg);
}

.review-ready__icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--status-success-text);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.review-ready__text {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--status-success-text);
}

@media (max-width: 640px) {
  .create-hiring__header { padding: 14px 16px; gap: 16px; }
  .stepper__label { display: none; }
  .stepper__line { width: 20px; margin: 0 6px; }
  .create-hiring__body { padding: 24px 16px; }
  .ch-step { padding: 24px; }
  .ch-step__row { grid-template-columns: 1fr; }
  .review-cards { grid-template-columns: 1fr; }
}
`;
if (typeof document !== 'undefined' && !document.getElementById('create-hiring-styles')) {
  style.id = 'create-hiring-styles';
  document.head.appendChild(style);
}
