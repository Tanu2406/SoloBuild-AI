import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileSpreadsheet, Table2, Check, ChevronRight,
  X, Play, AlertCircle, Loader2, Trash2, Plus
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input, Textarea, Select } from '../components/ui/Input';
import { RecruiterCard } from '../components/product/RecruiterCard';
import { Avatar } from '../components/ui/Avatar';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useAppStore, useRecruiters } from '../store/appStore';
import { parseFile } from '../services/importService';
import { fetchSheetPreview, isValidSheetsUrl } from '../services/googleSheetsService';
import { callSimulationService } from '../services/callSimulationService';
import type { AIRecruiter, Candidate, ParsedCandidate, CreateHiringForm, EmploymentType } from '../types';

type Step = 'job' | 'candidates' | 'recruiter' | 'review';

const STEPS: { id: Step; label: string }[] = [
  { id: 'job', label: 'Define Job' },
  { id: 'candidates', label: 'Add Candidates' },
  { id: 'recruiter', label: 'AI Recruiter' },
  { id: 'review', label: 'Review & Launch' },
];

const employmentOptions = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
];

const AVATAR_COLORS = ['#2563eb', '#0891b2', '#7c3aed', '#059669', '#dc2626', '#d97706'];

const CreateHiring: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { state, dispatch } = useAppStore();
  const recruiters = useRecruiters();

  const [currentStep, setCurrentStep] = useState<Step>('job');
  const [form, setForm] = useState<CreateHiringForm>({
    title: '', location: '', employmentType: 'full_time', description: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<CreateHiringForm>>({});

  // Candidates step
  const [parsedCandidates, setParsedCandidates] = useState<ParsedCandidate[]>([]);
  const [importSource, setImportSource] = useState<'excel' | 'sheets' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Google Sheets modal
  const [showSheetsModal, setShowSheetsModal] = useState(false);
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [sheetsUrlError, setSheetsUrlError] = useState('');
  const [fetchingSheets, setFetchingSheets] = useState(false);

  // Recruiter step
  const [selectedRecruiter, setSelectedRecruiter] = useState<AIRecruiter | null>(null);
  const [instructions, setInstructions] = useState('');
  const [showCreateRecruiterModal, setShowCreateRecruiterModal] = useState(false);
  const [newRecruiterForm, setNewRecruiterForm] = useState({ name: '', conversationStyle: 'friendly_professional', languages: 'english_hindi', voice: 'Warm & Clear', interviewInstructions: '' });
  const [recruiterErrors, setRecruiterErrors] = useState<Record<string, string>>({});

  const [launching, setLaunching] = useState(false);

  const currentIndex = STEPS.findIndex(s => s.id === currentStep);
  const validCandidates = parsedCandidates.filter(c => c._valid);

  // ——— Navigation ———
  const handleBack = () => {
    const prev = currentIndex - 1;
    if (prev >= 0) setCurrentStep(STEPS[prev].id);
    else navigate('/hiring');
  };

  const handleNext = () => {
    if (currentStep === 'job') {
      const e: Partial<CreateHiringForm> = {};
      if (!form.title.trim()) e.title = 'Job title is required';
      if (!form.location.trim()) e.location = 'Location is required';
      setFormErrors(e);
      if (Object.keys(e).length > 0) return;
    }
    if (currentStep === 'candidates') {
      if (validCandidates.length === 0) {
        showToast('Please import at least one valid candidate', 'error');
        return;
      }
    }
    if (currentStep === 'recruiter') {
      if (!selectedRecruiter) {
        showToast('Please select an AI Recruiter', 'error');
        return;
      }
    }
    const next = currentIndex + 1;
    if (next < STEPS.length) setCurrentStep(STEPS[next].id);
  };

  // ——— File import ———
  async function processFile(file: File) {
    setParsing(true);
    setParseError('');
    setParsedCandidates([]);
    try {
      const results = await parseFile(file);
      if (results.length === 0) {
        setParseError('No candidate rows found in the file. Check your column headers.');
        return;
      }
      setParsedCandidates(results);
      setImportSource('excel');
      const valid = results.filter(r => r._valid).length;
      showToast(`${valid} candidates parsed from ${file.name}`, 'success');
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse file');
      showToast(err.message || 'Failed to parse file', 'error');
    } finally {
      setParsing(false);
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleRemoveCandidate = (index: number) => {
    setParsedCandidates(prev => prev.filter((_, i) => i !== index));
  };

  // ——— Google Sheets ———
  const handleSheetsConnect = async () => {
    setSheetsUrlError('');
    if (!sheetsUrl.trim()) { setSheetsUrlError('Please enter a URL'); return; }
    if (!isValidSheetsUrl(sheetsUrl)) { setSheetsUrlError('Please enter a valid Google Sheets URL'); return; }
    setFetchingSheets(true);
    try {
      const results = await fetchSheetPreview(sheetsUrl);
      setParsedCandidates(results);
      setImportSource('sheets');
      setShowSheetsModal(false);
      showToast(`${results.filter(r => r._valid).length} candidates imported from Google Sheets`, 'success');
    } catch (err: any) {
      setSheetsUrlError(err.message || 'Failed to connect');
    } finally {
      setFetchingSheets(false);
    }
  };

  // ——— Create Recruiter ———
  const handleSaveRecruiter = () => {
    const e: Record<string, string> = {};
    if (!newRecruiterForm.name.trim()) e.name = 'Name is required';
    if (!newRecruiterForm.interviewInstructions.trim()) e.interviewInstructions = 'Interview instructions are required';
    setRecruiterErrors(e);
    if (Object.keys(e).length > 0) return;

    const langMap: Record<string, string[]> = {
      english: ['English'],
      english_hindi: ['English', 'Hindi'],
      english_hindi_marathi: ['English', 'Hindi', 'Marathi'],
    };
    const styleMap: Record<string, string> = {
      friendly_professional: 'Friendly Professional',
      professional: 'Professional',
      conversational: 'Conversational',
      formal: 'Formal',
    };

    const newRecruiter: AIRecruiter = {
      id: `ar_${Date.now()}`,
      name: newRecruiterForm.name.trim(),
      description: `${styleMap[newRecruiterForm.conversationStyle] || newRecruiterForm.conversationStyle} tone.`,
      languages: langMap[newRecruiterForm.languages] || ['English'],
      voice: newRecruiterForm.voice,
      conversationStyle: styleMap[newRecruiterForm.conversationStyle] || newRecruiterForm.conversationStyle,
      interviewInstructions: newRecruiterForm.interviewInstructions.trim(),
      avatarInitial: newRecruiterForm.name[0].toUpperCase(),
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    };
    dispatch({ type: 'CREATE_RECRUITER', payload: newRecruiter });
    setSelectedRecruiter(newRecruiter);
    setInstructions(newRecruiter.interviewInstructions || '');
    setShowCreateRecruiterModal(false);
    showToast(`AI Recruiter "${newRecruiter.name}" created`, 'success');
  };

  // ——— Launch ———
  const handleLaunch = () => {
    if (!selectedRecruiter) return;
    setLaunching(true);

    const hiringId = `h_${Date.now()}`;
    const now = new Date().toISOString();

    // Convert ParsedCandidates → Candidates
    const candidates: Candidate[] = validCandidates.map((pc, i) => ({
      id: `c_${hiringId}_${i}`,
      name: pc.name,
      phone: pc.phone,
      email: pc.email,
      position: pc.position || form.title,
      location: pc.location || form.location,
      experience: pc.experience,
      hiringId,
      hiringTitle: form.title,
      status: 'added',
      lastActivity: '—',
    }));

    // Create the hiring
    dispatch({
      type: 'CREATE_HIRING',
      payload: {
        id: hiringId,
        title: form.title,
        location: form.location,
        employmentType: form.employmentType as EmploymentType,
        description: form.description,
        status: 'ready',
        aiRecruiterId: selectedRecruiter.id,
        interviewInstructions: instructions || selectedRecruiter.interviewInstructions,
        candidateIds: candidates.map(c => c.id),
        candidateCount: candidates.length,
        contacted: 0,
        connected: 0,
        interested: 0,
        shortlisted: 0,
        createdAt: now,
        updatedAt: now,
      },
    });

    // Add candidates to store
    dispatch({ type: 'ADD_CANDIDATES', payload: { hiringId, candidates } });

    // Add activity
    dispatch({
      type: 'ADD_ACTIVITY',
      payload: {
        id: `act_create_${Date.now()}`,
        type: 'hiring_created',
        hiringTitle: form.title,
        description: `${form.title} hiring created with ${candidates.length} candidates`,
        timestamp: now,
        timeAgo: 'just now',
      },
    });

    // Start the simulation — needs a tiny delay for state to settle
    setTimeout(() => {
      const freshState = {
        ...state,
        hirings: [...state.hirings, {
          id: hiringId, title: form.title, location: form.location,
          employmentType: form.employmentType as EmploymentType,
          status: 'calling' as const,
          aiRecruiterId: selectedRecruiter.id,
          candidateIds: candidates.map(c => c.id),
          candidateCount: candidates.length,
          contacted: 0, connected: 0, interested: 0, shortlisted: 0,
          createdAt: now, updatedAt: now,
        }],
        candidates: [...state.candidates, ...candidates],
      };

      dispatch({
        type: 'ADD_ACTIVITY',
        payload: {
          id: `act_launch_${Date.now()}`,
          type: 'hiring_launched',
          hiringTitle: form.title,
          description: `${form.title} launched — ${selectedRecruiter.name} started calling`,
          timestamp: new Date().toISOString(),
          timeAgo: 'just now',
        },
      });

      callSimulationService.start(hiringId, freshState, dispatch, 400);
      showToast(`${form.title} launched! ${selectedRecruiter.name} is calling candidates.`, 'success');
      navigate(`/hiring/${hiringId}`);
    }, 300);
  };

  // ——— Recruiter selection + auto-fill instructions ———
  const handleSelectRecruiter = (r: AIRecruiter) => {
    setSelectedRecruiter(r);
    setInstructions(
      form.title
        ? `Screen candidates for the ${form.title} position in ${form.location}. Ask about their experience, current role, availability to join, and expected salary. Be ${r.conversationStyle.toLowerCase()}.`
        : r.interviewInstructions || ''
    );
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
              <div className={`stepper__step ${i < currentIndex ? 'stepper__step--done' : i === currentIndex ? 'stepper__step--active' : 'stepper__step--upcoming'}`}>
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

      <div className="create-hiring__body">
        <div className="create-hiring__panel">

          {/* ——— STEP 1: JOB ——— */}
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
                  onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setFormErrors(er => ({ ...er, title: '' })); }}
                  error={formErrors.title}
                />
                <div className="ch-step__row">
                  <Input
                    label="Location"
                    placeholder="e.g. Pune, Bangalore, Mumbai"
                    value={form.location}
                    onChange={e => { setForm(f => ({ ...f, location: e.target.value })); setFormErrors(er => ({ ...er, location: '' })); }}
                    error={formErrors.location}
                  />
                  <Select
                    label="Employment type"
                    options={employmentOptions}
                    value={form.employmentType}
                    onChange={e => setForm(f => ({ ...f, employmentType: e.target.value as EmploymentType }))}
                  />
                </div>
                <Textarea
                  label="Job description"
                  placeholder="Brief description of the role, responsibilities, and what you're looking for..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={5}
                  hint="Optional — helps your AI Recruiter have more relevant conversations."
                />
              </div>
            </div>
          )}

          {/* ——— STEP 2: CANDIDATES ——— */}
          {currentStep === 'candidates' && (
            <div className="ch-step animate-fade-in">
              <div className="ch-step__heading">
                <h2>Add candidates</h2>
                <p>Upload your candidate list to get started.</p>
              </div>

              {parsedCandidates.length === 0 ? (
                <div className="ch-candidates">
                  {/* Upload area */}
                  <div
                    className={`file-upload ${isDragging ? 'file-upload--dragging' : ''} ${parsing ? 'file-upload--parsing' : ''}`}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => !parsing && fileRef.current?.click()}
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                    <div className="file-upload__icon">
                      {parsing ? <Loader2 size={28} className="spin" /> : <FileSpreadsheet size={28} />}
                    </div>
                    <p className="file-upload__title">
                      {parsing ? 'Parsing file...' : 'Upload Excel / CSV'}
                    </p>
                    <p className="file-upload__sub">
                      {parsing ? 'Reading candidate data' : 'Drag & drop or click to browse'}
                    </p>
                    {!parsing && (
                      <span className="file-upload__formats">Supports .xlsx, .xls, .csv</span>
                    )}
                  </div>

                  {parseError && (
                    <div className="import-error">
                      <AlertCircle size={15} />
                      {parseError}
                    </div>
                  )}

                  <div className="ch-divider"><span>or</span></div>

                  {/* Google Sheets */}
                  <button className="gs-connect" onClick={() => setShowSheetsModal(true)}>
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
                /* Candidate preview */
                <div className="candidate-preview animate-fade-in">
                  <div className="candidate-preview__header">
                    <div className="candidate-preview__info">
                      <div className="candidate-preview__count-badge">
                        <Check size={14} strokeWidth={2.5} />
                        {validCandidates.length} candidates ready
                      </div>
                      {parsedCandidates.length - validCandidates.length > 0 && (
                        <span className="candidate-preview__warnings">
                          {parsedCandidates.length - validCandidates.length} rows skipped (missing required fields)
                        </span>
                      )}
                      <span className="candidate-preview__source">
                        {importSource === 'sheets' ? 'From Google Sheets' : 'Imported from file'}
                      </span>
                    </div>
                    <button className="candidate-preview__change" onClick={() => { setParsedCandidates([]); setImportSource(null); }}>
                      <X size={14} /> Change
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
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedCandidates.slice(0, 8).map((c, i) => (
                          <tr key={i} className={!c._valid ? 'preview-invalid' : ''}>
                            <td className="font-medium">
                              {!c._valid && <span className="invalid-dot" title={c._errors.join(', ')} />}
                              {c.name || <span className="missing-val">missing</span>}
                            </td>
                            <td>{c.phone || <span className="missing-val">missing</span>}</td>
                            <td>{c.email || '—'}</td>
                            <td>{c.position || '—'}</td>
                            <td>{c.location || '—'}</td>
                            <td>{c.experience || '—'}</td>
                            <td>
                              <button className="preview-remove" onClick={() => handleRemoveCandidate(i)} title="Remove">
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {parsedCandidates.length > 8 && (
                          <tr className="preview-more">
                            <td colSpan={7}>+ {parsedCandidates.length - 8} more candidates</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ——— STEP 3: RECRUITER ——— */}
          {currentStep === 'recruiter' && (
            <div className="ch-step animate-fade-in">
              <div className="ch-step__heading">
                <h2>Choose your AI Recruiter</h2>
                <p>Your AI Recruiter will conduct the initial screening conversations with candidates.</p>
              </div>

              <div className="ch-recruiters">
                {recruiters.map(r => (
                  <RecruiterCard
                    key={r.id}
                    recruiter={r}
                    selected={selectedRecruiter?.id === r.id}
                    onClick={() => handleSelectRecruiter(r)}
                  />
                ))}
                <button className="create-recruiter-btn" onClick={() => setShowCreateRecruiterModal(true)}>
                  <Plus size={16} />
                  Create new AI Recruiter
                </button>
              </div>

              {selectedRecruiter && (
                <div className="ch-recruiter-config animate-fade-in">
                  <h3 className="ch-recruiter-config__title">Interview instructions</h3>
                  <p className="ch-recruiter-config__sub">
                    Tell {selectedRecruiter.name} what to ask and screen for.
                  </p>
                  <Textarea
                    value={instructions}
                    onChange={e => setInstructions(e.target.value)}
                    rows={4}
                    placeholder={`Screen candidates for the ${form.title || 'role'} position...`}
                  />
                </div>
              )}
            </div>
          )}

          {/* ——— STEP 4: REVIEW ——— */}
          {currentStep === 'review' && (
            <div className="ch-step animate-fade-in">
              <div className="ch-step__heading">
                <h2>Review your hiring</h2>
                <p>Everything looks good? Let's start calling.</p>
              </div>

              <div className="review-cards">
                <div className="review-card">
                  <div className="review-card__label">JOB</div>
                  <div className="review-card__value">{form.title}</div>
                  <div className="review-card__sub">
                    {form.location} · {employmentOptions.find(o => o.value === form.employmentType)?.label}
                  </div>
                </div>
                <div className="review-card">
                  <div className="review-card__label">CANDIDATES</div>
                  <div className="review-card__value">{validCandidates.length}</div>
                  <div className="review-card__sub">
                    {importSource === 'sheets' ? 'From Google Sheets' : 'Imported from file'}
                  </div>
                </div>
                <div className="review-card">
                  <div className="review-card__label">AI RECRUITER</div>
                  <div className="review-card__value-row">
                    {selectedRecruiter && <Avatar name={selectedRecruiter.name} size="sm" color={selectedRecruiter.avatarColor} />}
                    <span className="review-card__value">{selectedRecruiter?.name}</span>
                  </div>
                  <div className="review-card__sub">
                    {selectedRecruiter?.languages.join(' + ')} · {selectedRecruiter?.conversationStyle}
                  </div>
                </div>
                <div className="review-card">
                  <div className="review-card__label">CALLING</div>
                  <div className="review-card__value">{validCandidates.length} candidates</div>
                  <div className="review-card__sub">Working hours: 10 AM – 6 PM</div>
                </div>
              </div>

              <div className="review-ready">
                <div className="review-ready__icon"><Check size={18} strokeWidth={2.5} /></div>
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
              <Button onClick={handleLaunch} loading={launching} icon={<Play size={15} />} size="lg">
                Start calling
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Google Sheets Modal */}
      <Modal
        open={showSheetsModal}
        onClose={() => setShowSheetsModal(false)}
        title="Connect Google Sheets"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowSheetsModal(false)}>Cancel</Button>
            <Button onClick={handleSheetsConnect} loading={fetchingSheets}>
              {fetchingSheets ? 'Connecting...' : 'Connect'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Paste the URL of your Google Sheet below. The sheet must be publicly accessible or shared with view access.
          </p>
          <Input
            label="Google Sheet URL"
            placeholder="https://docs.google.com/spreadsheets/d/..."
            value={sheetsUrl}
            onChange={e => { setSheetsUrl(e.target.value); setSheetsUrlError(''); }}
            error={sheetsUrlError}
          />
          <div className="sheets-sample">
            <span className="sheets-sample__label">For the demo, try any Google Sheets URL.</span>
          </div>
        </div>
      </Modal>

      {/* Create Recruiter Modal */}
      <Modal
        open={showCreateRecruiterModal}
        onClose={() => setShowCreateRecruiterModal(false)}
        title="Create AI Recruiter"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateRecruiterModal(false)}>Cancel</Button>
            <Button onClick={handleSaveRecruiter}>Create Recruiter</Button>
          </>
        }
      >
        <div className="recruiter-form">
          <Input
            label="Name"
            placeholder="e.g. Ava, Aria, Riya"
            value={newRecruiterForm.name}
            onChange={e => setNewRecruiterForm(f => ({ ...f, name: e.target.value }))}
            error={recruiterErrors.name}
          />
          <Select
            label="Conversation style"
            options={[
              { value: 'friendly_professional', label: 'Friendly Professional' },
              { value: 'professional', label: 'Professional' },
              { value: 'conversational', label: 'Conversational' },
              { value: 'formal', label: 'Formal' },
            ]}
            value={newRecruiterForm.conversationStyle}
            onChange={e => setNewRecruiterForm(f => ({ ...f, conversationStyle: e.target.value }))}
          />
          <Select
            label="Languages"
            options={[
              { value: 'english', label: 'English' },
              { value: 'english_hindi', label: 'English + Hindi' },
              { value: 'english_hindi_marathi', label: 'English + Hindi + Marathi' },
            ]}
            value={newRecruiterForm.languages}
            onChange={e => setNewRecruiterForm(f => ({ ...f, languages: e.target.value }))}
          />
          <Select
            label="Voice"
            options={[
              { value: 'Warm & Clear', label: 'Warm & Clear' },
              { value: 'Clear & Confident', label: 'Clear & Confident' },
              { value: 'Natural & Clear', label: 'Natural & Clear' },
              { value: 'Soft & Professional', label: 'Soft & Professional' },
            ]}
            value={newRecruiterForm.voice}
            onChange={e => setNewRecruiterForm(f => ({ ...f, voice: e.target.value }))}
          />
          <Textarea
            label="Interview instructions"
            placeholder="Tell this AI Recruiter what to ask, what to screen for, and how to conduct the conversation..."
            value={newRecruiterForm.interviewInstructions}
            onChange={e => setNewRecruiterForm(f => ({ ...f, interviewInstructions: e.target.value }))}
            rows={4}
            error={recruiterErrors.interviewInstructions}
            hint="e.g. Ask about experience, availability and expected salary. Be friendly."
          />
        </div>
      </Modal>
    </div>
  );
};

export default CreateHiring;

const style = document.createElement('style');
style.textContent = `
.create-hiring { min-height: 100vh; background: var(--bg-app); }
.create-hiring__header { background: var(--bg-white); border-bottom: 1px solid var(--border-default); padding: 16px 40px; display: flex; align-items: center; gap: 40px; position: sticky; top: 0; z-index: 50; }
.create-hiring__back { display: flex; align-items: center; gap: 6px; font-size: var(--font-size-sm); font-weight: 500; color: var(--text-secondary); background: none; border: none; cursor: pointer; white-space: nowrap; transition: color var(--transition-fast); }
.create-hiring__back:hover { color: var(--text-primary); }
.create-hiring__stepper { display: flex; align-items: center; flex: 1; justify-content: center; }
.stepper__step { display: flex; align-items: center; gap: 8px; }
.stepper__circle { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: var(--font-size-xs); font-weight: 600; flex-shrink: 0; transition: all var(--transition-base); }
.stepper__step--done .stepper__circle { background: var(--brand-primary); color: white; }
.stepper__step--active .stepper__circle { background: var(--brand-primary); color: white; box-shadow: 0 0 0 3px rgba(37,99,235,0.2); }
.stepper__step--upcoming .stepper__circle { background: var(--bg-subtle); color: var(--text-tertiary); border: 1px solid var(--border-default); }
.stepper__label { font-size: var(--font-size-sm); font-weight: 500; white-space: nowrap; }
.stepper__step--active .stepper__label { color: var(--brand-primary); }
.stepper__step--done .stepper__label { color: var(--text-secondary); }
.stepper__step--upcoming .stepper__label { color: var(--text-tertiary); }
.stepper__line { height: 1px; width: 40px; background: var(--border-default); margin: 0 12px; flex-shrink: 0; transition: background var(--transition-base); }
.stepper__line--done { background: var(--brand-primary); }
.create-hiring__body { display: flex; justify-content: center; padding: 48px 24px; }
.create-hiring__panel { width: 100%; max-width: 640px; display: flex; flex-direction: column; }
.ch-step { background: var(--bg-white); border: 1px solid var(--border-default); border-radius: var(--radius-xl); padding: 36px; display: flex; flex-direction: column; gap: 28px; margin-bottom: 16px; }
.ch-step__heading h2 { font-size: var(--font-size-3xl); font-weight: 700; color: var(--text-primary); letter-spacing: -0.3px; margin-bottom: 6px; }
.ch-step__heading p { font-size: var(--font-size-base); color: var(--text-secondary); }
.ch-step__form { display: flex; flex-direction: column; gap: 20px; }
.ch-step__row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.ch-step__actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 4px; }
/* File upload */
.ch-candidates { display: flex; flex-direction: column; gap: 16px; }
.file-upload { border: 2px dashed var(--border-strong); border-radius: var(--radius-lg); padding: 40px 24px; display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; transition: all var(--transition-fast); text-align: center; background: var(--bg-app); }
.file-upload:hover, .file-upload--dragging { border-color: var(--brand-primary); background: var(--brand-primary-light); }
.file-upload--parsing { cursor: default; opacity: 0.8; }
.file-upload__icon { width: 52px; height: 52px; border-radius: var(--radius-lg); background: var(--bg-white); border: 1px solid var(--border-default); display: flex; align-items: center; justify-content: center; color: var(--brand-primary); margin-bottom: 4px; }
.file-upload__title { font-size: var(--font-size-lg); font-weight: 600; color: var(--text-primary); }
.file-upload__sub { font-size: var(--font-size-sm); color: var(--text-secondary); }
.file-upload__formats { font-size: var(--font-size-xs); color: var(--text-tertiary); margin-top: 2px; }
.import-error { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: var(--status-error-bg); border: 1px solid var(--status-error-border); border-radius: var(--radius-md); font-size: var(--font-size-sm); color: var(--status-error-text); }
.ch-divider { display: flex; align-items: center; gap: 12px; color: var(--text-tertiary); font-size: var(--font-size-sm); }
.ch-divider::before, .ch-divider::after { content: ''; flex: 1; height: 1px; background: var(--border-default); }
.gs-connect { display: flex; align-items: center; gap: 14px; padding: 16px 20px; border: 1.5px solid var(--border-default); border-radius: var(--radius-lg); cursor: pointer; background: var(--bg-white); transition: all var(--transition-fast); text-align: left; }
.gs-connect:hover { border-color: #0f9d58; background: #f0fdf4; }
.gs-connect__icon { width: 40px; height: 40px; border-radius: var(--radius-md); background: #f0fdf4; border: 1px solid #bbf7d0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.gs-connect__text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.gs-connect__title { font-size: var(--font-size-base); font-weight: 600; color: var(--text-primary); }
.gs-connect__sub { font-size: var(--font-size-sm); color: var(--text-secondary); }
/* Candidate preview */
.candidate-preview { display: flex; flex-direction: column; gap: 16px; }
.candidate-preview__header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
.candidate-preview__info { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.candidate-preview__count-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: var(--radius-full); background: var(--status-success-bg); color: var(--status-success-text); border: 1px solid var(--status-success-border); font-size: var(--font-size-sm); font-weight: 600; }
.candidate-preview__warnings { font-size: var(--font-size-xs); color: var(--status-warning-text); }
.candidate-preview__source { font-size: var(--font-size-sm); color: var(--text-secondary); }
.candidate-preview__change { display: flex; align-items: center; gap: 5px; font-size: var(--font-size-sm); color: var(--text-secondary); background: none; border: none; cursor: pointer; transition: color var(--transition-fast); }
.candidate-preview__change:hover { color: var(--text-primary); }
.candidate-preview__table-wrap { overflow-x: auto; border: 1px solid var(--border-default); border-radius: var(--radius-md); }
.candidate-preview__table { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
.candidate-preview__table th { padding: 10px 14px; text-align: left; font-size: var(--font-size-xs); font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.04em; background: var(--bg-subtle); border-bottom: 1px solid var(--border-default); white-space: nowrap; }
.candidate-preview__table td { padding: 10px 14px; color: var(--text-primary); border-bottom: 1px solid var(--border-default); white-space: nowrap; }
.candidate-preview__table td.font-medium { font-weight: 500; }
.candidate-preview__table tr:last-child td { border-bottom: none; }
.candidate-preview__table tr:hover:not(.preview-more):not(.preview-invalid) td { background: var(--bg-hover); }
.preview-invalid td { background: var(--status-error-bg); color: var(--status-error-text); }
.invalid-dot { display: inline-block; width: 6px; height: 6px; background: var(--status-error-text); border-radius: 50%; margin-right: 6px; vertical-align: middle; }
.missing-val { color: var(--text-tertiary); font-style: italic; }
.preview-more td { color: var(--text-tertiary); font-style: italic; text-align: center; padding: 8px; }
.preview-remove { background: none; border: none; cursor: pointer; color: var(--text-tertiary); padding: 4px; border-radius: var(--radius-sm); display: flex; align-items: center; transition: color var(--transition-fast); }
.preview-remove:hover { color: var(--status-error-text); }
/* Recruiters */
.ch-recruiters { display: flex; flex-direction: column; gap: 10px; }
.create-recruiter-btn { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; border: 1.5px dashed var(--border-strong); border-radius: var(--radius-lg); color: var(--text-secondary); font-size: var(--font-size-sm); font-weight: 500; background: none; cursor: pointer; transition: all var(--transition-fast); }
.create-recruiter-btn:hover { border-color: var(--brand-primary); color: var(--brand-primary); background: var(--brand-primary-light); }
.ch-recruiter-config { background: var(--bg-app); border: 1px solid var(--border-default); border-radius: var(--radius-lg); padding: 20px; display: flex; flex-direction: column; gap: 10px; }
.ch-recruiter-config__title { font-size: var(--font-size-base); font-weight: 600; color: var(--text-primary); }
.ch-recruiter-config__sub { font-size: var(--font-size-sm); color: var(--text-secondary); }
/* Review */
.review-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.review-card { padding: 20px; background: var(--bg-app); border: 1px solid var(--border-default); border-radius: var(--radius-lg); display: flex; flex-direction: column; gap: 6px; }
.review-card__label { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; color: var(--text-tertiary); }
.review-card__value { font-size: var(--font-size-lg); font-weight: 700; color: var(--text-primary); }
.review-card__value-row { display: flex; align-items: center; gap: 8px; }
.review-card__sub { font-size: var(--font-size-sm); color: var(--text-secondary); }
.review-ready { display: flex; align-items: center; gap: 10px; padding: 16px 20px; background: var(--status-success-bg); border: 1px solid var(--status-success-border); border-radius: var(--radius-lg); }
.review-ready__icon { width: 28px; height: 28px; border-radius: 50%; background: var(--status-success-text); color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.review-ready__text { font-size: var(--font-size-base); font-weight: 600; color: var(--status-success-text); }
.sheets-sample__label { font-size: var(--font-size-xs); color: var(--text-tertiary); }
.recruiter-form { display: flex; flex-direction: column; gap: 18px; }
.spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
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
