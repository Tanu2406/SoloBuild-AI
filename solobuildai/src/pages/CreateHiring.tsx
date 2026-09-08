import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, FileSpreadsheet, Table2, Check, ChevronRight,
  X, AlertCircle, Loader2, Upload, HardDrive,
  Sparkles, Play, Eye
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
import type { AIRecruiter, ParsedCandidate, CreateHiringForm, EmploymentType } from '../types';

type Step = 'job' | 'jd' | 'resumes' | 'candidates' | 'recruiter' | 'preview';

const STEPS: { id: Step; label: string }[] = [
  { id: 'job',        label: 'Job Details' },
  { id: 'jd',         label: 'Job Description' },
  { id: 'resumes',    label: 'Resumes' },
  { id: 'candidates', label: 'Candidate Source' },
  { id: 'recruiter',  label: 'AI Recruiter' },
  { id: 'preview',    label: 'Preview & Launch' },
];

const employmentOptions = [
  { value: 'full_time',  label: 'Full-time' },
  { value: 'part_time',  label: 'Part-time' },
  { value: 'contract',   label: 'Contract' },
  { value: 'internship', label: 'Internship' },
];

const AVATAR_COLORS = ['#2563eb', '#0891b2', '#7c3aed', '#059669', '#dc2626', '#d97706'];

// Mock resume names for Google Drive simulation
const MOCK_DRIVE_RESUMES = [
  'Aarav_Sharma_Resume.pdf', 'Priya_Patil_CV.pdf', 'Rahul_Mehta_Resume.docx',
  'Neha_Singh_CV.pdf', 'Vikram_Joshi_Resume.pdf', 'Sunita_Reddy_CV.docx',
  'Arjun_Kapoor_Resume.pdf', 'Deepika_Nair_CV.pdf', 'Manish_Kumar_Resume.pdf',
  'Kavya_Menon_CV.pdf', 'Rohan_Desai_Resume.docx', 'Anita_Bose_CV.pdf',
];

const CreateHiring: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { dispatch } = useAppStore();
  const recruiters = useRecruiters();

  const [currentStep, setCurrentStep] = useState<Step>('job');
  const [form, setForm] = useState<CreateHiringForm>({
    title: '', location: '', employmentType: 'full_time', description: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<CreateHiringForm>>({});

  // ——— JD step ———
  const [jdMode, setJdMode] = useState<'paste' | 'upload' | null>(null);
  const [jdText, setJdText] = useState('');
  const [jdFileName, setJdFileName] = useState('');
  const [jdUploading, setJdUploading] = useState(false);
  const jdFileRef = useRef<HTMLInputElement>(null);

  // ——— Resume step ———
  const [resumeMode, setResumeMode] = useState<'upload' | 'drive' | null>(null);
  const [resumeFiles, setResumeFiles] = useState<string[]>([]);  // file names only (mock)
  const [resumeUploading, setResumeUploading] = useState(false);
  const [driveConnecting, setDriveConnecting] = useState(false);
  const [, setDriveConnected] = useState(false);
  const resumeFileRef = useRef<HTMLInputElement>(null);

  // ——— Candidate source step (optional explicit list) ———
  const [parsedCandidates, setParsedCandidates] = useState<ParsedCandidate[]>([]);
  const [importSource, setImportSource] = useState<'excel' | 'sheets' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const candidateFileRef = useRef<HTMLInputElement>(null);
  const [showSheetsModal, setShowSheetsModal] = useState(false);
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [sheetsUrlError, setSheetsUrlError] = useState('');
  const [fetchingSheets, setFetchingSheets] = useState(false);

  // ——— Recruiter step ———
  const [selectedRecruiter, setSelectedRecruiter] = useState<AIRecruiter | null>(null);
  const [instructions, setInstructions] = useState('');
  const [showCreateRecruiterModal, setShowCreateRecruiterModal] = useState(false);
  const [newRecruiterForm, setNewRecruiterForm] = useState({
    name: '', conversationStyle: 'friendly_professional',
    languages: 'english_hindi', voice: 'Warm & Clear', interviewInstructions: '',
  });
  const [recruiterErrors, setRecruiterErrors] = useState<Record<string, string>>({});

  const currentIndex = STEPS.findIndex(s => s.id === currentStep);
  const validCandidates = parsedCandidates.filter(c => c._valid);
  const totalResumes = resumeFiles.length;

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
    if (currentStep === 'jd') {
      if (!jdText.trim() && !jdFileName) {
        showToast('Please provide a Job Description — paste it or upload a file', 'error');
        return;
      }
    }
    if (currentStep === 'resumes') {
      if (totalResumes === 0) {
        showToast('Please add at least one resume source', 'error');
        return;
      }
    }
    // candidates step is optional — always allow next
    if (currentStep === 'recruiter') {
      if (!selectedRecruiter) {
        showToast('Please select an AI Recruiter', 'error');
        return;
      }
    }
    const next = currentIndex + 1;
    if (next < STEPS.length) setCurrentStep(STEPS[next].id);
  };

  // ——— JD upload ———
  const handleJdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'];
    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|docx|doc)$/i)) {
      showToast('Please upload a PDF or DOCX file', 'error');
      return;
    }
    setJdUploading(true);
    setTimeout(() => {
      setJdFileName(file.name);
      setJdText(`[Uploaded from ${file.name}] — AI will extract and process the job description during screening.`);
      setJdUploading(false);
      showToast(`JD uploaded: ${file.name}`, 'success');
    }, 900);
    if (jdFileRef.current) jdFileRef.current.value = '';
  };

  // ——— Resume upload (small batch <20) ———
  const handleResumeFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setResumeUploading(true);
    setTimeout(() => {
      const names = files.map(f => f.name);
      setResumeFiles(prev => [...prev, ...names]);
      setResumeMode('upload');
      setResumeUploading(false);
      showToast(`${files.length} resume${files.length > 1 ? 's' : ''} added`, 'success');
    }, 800);
    if (resumeFileRef.current) resumeFileRef.current.value = '';
  };

  const handleConnectDrive = () => {
    setDriveConnecting(true);
    setTimeout(() => {
      // Simulate Drive connection — pick resumes based on job title
      const count = 8 + Math.floor(Math.random() * 5);
      const selected = MOCK_DRIVE_RESUMES.slice(0, count);
      setResumeFiles(selected);
      setResumeMode('drive');
      setDriveConnected(true);
      setDriveConnecting(false);
      showToast(`${selected.length} resumes imported from Google Drive`, 'success');
    }, 1400);
  };

  // ——— Explicit candidate import (Excel / CSV) ———
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
      showToast(`${results.filter(r => r._valid).length} candidates loaded from ${file.name}`, 'success');
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse file');
    } finally {
      setParsing(false);
    }
  }

  const handleCandidateFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
    if (candidateFileRef.current) candidateFileRef.current.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processFile(file);
  };

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
    if (!newRecruiterForm.interviewInstructions.trim()) e.interviewInstructions = 'Instructions are required';
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

  const handleSelectRecruiter = (r: AIRecruiter) => {
    setSelectedRecruiter(r);
    setInstructions(
      form.title
        ? `Screen candidates for the ${form.title} position in ${form.location}. Ask about their experience, current role, availability to join, and expected salary. Be ${r.conversationStyle.toLowerCase()}.`
        : r.interviewInstructions || ''
    );
  };

  // ——— Launch: Screen Only ———
  const handleScreenOnly = () => {
    if (!selectedRecruiter) return;
    const hiringId = `h_${Date.now()}`;
    const now = new Date().toISOString();

    dispatch({
      type: 'CREATE_HIRING',
      payload: {
        id: hiringId,
        title: form.title,
        location: form.location,
        employmentType: form.employmentType as EmploymentType,
        description: form.description,
        jdText,
        jdFileName: jdFileName || undefined,
        resumeCount: totalResumes,
        status: 'screening',
        aiRecruiterId: selectedRecruiter.id,
        interviewInstructions: instructions || selectedRecruiter.interviewInstructions,
        candidateIds: [],
        candidateCount: 0,
        contacted: 0, connected: 0, interested: 0, shortlisted: 0,
        createdAt: now, updatedAt: now,
      },
    });

    dispatch({
      type: 'ADD_ACTIVITY',
      payload: {
        id: `act_create_${Date.now()}`,
        type: 'hiring_created',
        hiringTitle: form.title,
        description: `${form.title} hiring created — AI resume screening starting`,
        timestamp: now, timeAgo: 'just now',
      },
    });

    // Navigate to screening progress
    navigate(`/hiring/${hiringId}/screening?resumes=${totalResumes}&mode=screen_only`);
  };

  // ——— Launch: Screen & Start Calling ———
  const handleScreenAndCall = () => {
    if (!selectedRecruiter) return;
    const hiringId = `h_${Date.now()}`;
    const now = new Date().toISOString();

    dispatch({
      type: 'CREATE_HIRING',
      payload: {
        id: hiringId,
        title: form.title,
        location: form.location,
        employmentType: form.employmentType as EmploymentType,
        description: form.description,
        jdText,
        jdFileName: jdFileName || undefined,
        resumeCount: totalResumes,
        status: 'screening',
        aiRecruiterId: selectedRecruiter.id,
        interviewInstructions: instructions || selectedRecruiter.interviewInstructions,
        candidateIds: [],
        candidateCount: 0,
        contacted: 0, connected: 0, interested: 0, shortlisted: 0,
        createdAt: now, updatedAt: now,
      },
    });

    dispatch({
      type: 'ADD_ACTIVITY',
      payload: {
        id: `act_create_${Date.now()}`,
        type: 'hiring_created',
        hiringTitle: form.title,
        description: `${form.title} hiring created — AI screening + calling pipeline started`,
        timestamp: now, timeAgo: 'just now',
      },
    });

    navigate(`/hiring/${hiringId}/screening?resumes=${totalResumes}&mode=screen_and_call`);
  };

  return (
    <div className="create-hiring animate-fade-in">
      {/* Header / Stepper */}
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

          {/* ══════════════ STEP 1 — JOB DETAILS ══════════════ */}
          {currentStep === 'job' && (
            <div className="ch-step animate-fade-in">
              <div className="ch-step__heading">
                <h2>Define the job</h2>
                <p>Basic details about the role you're hiring for.</p>
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
                <Input
                  label="Role summary"
                  placeholder="One-line summary of the role (optional)"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  hint="Optional — helps your AI Recruiter have more relevant conversations."
                />
              </div>
            </div>
          )}

          {/* ══════════════ STEP 2 — JOB DESCRIPTION ══════════════ */}
          {currentStep === 'jd' && (
            <div className="ch-step animate-fade-in">
              <div className="ch-step__heading">
                <h2>Job Description</h2>
                <p>Provide the JD so AI can evaluate resumes against it. Choose one of the two options below.</p>
              </div>

              <div className="ch-jd-options">
                {/* Option A — Paste JD */}
                <div
                  className={`ch-jd-option ${jdMode === 'paste' ? 'ch-jd-option--active' : ''}`}
                  onClick={() => { setJdMode('paste'); setJdFileName(''); }}
                >
                  <div className="ch-jd-option__icon">
                    <FileText size={22} />
                  </div>
                  <div className="ch-jd-option__text">
                    <span className="ch-jd-option__title">Paste Job Description</span>
                    <span className="ch-jd-option__sub">Copy-paste the JD directly into a text area</span>
                  </div>
                  {jdMode === 'paste' && <Check size={16} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />}
                </div>

                {/* Option B — Upload JD */}
                <div
                  className={`ch-jd-option ${jdMode === 'upload' ? 'ch-jd-option--active' : ''}`}
                  onClick={() => { setJdMode('upload'); setJdText(''); }}
                >
                  <div className="ch-jd-option__icon">
                    <Upload size={22} />
                  </div>
                  <div className="ch-jd-option__text">
                    <span className="ch-jd-option__title">Upload JD Document</span>
                    <span className="ch-jd-option__sub">Upload a PDF or DOCX file containing the job description</span>
                  </div>
                  {jdMode === 'upload' && <Check size={16} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />}
                </div>
              </div>

              {/* Paste area */}
              {jdMode === 'paste' && (
                <div className="ch-step__form animate-fade-in" style={{ marginTop: '20px' }}>
                  <Textarea
                    label="Job Description"
                    placeholder={`Paste the full job description here...\n\nExample:\nWe are looking for a Senior Sales Executive with 4+ years of B2B experience. The ideal candidate should have strong CRM skills, enterprise account management experience, and a proven track record of hitting targets...`}
                    value={jdText}
                    onChange={e => setJdText(e.target.value)}
                    rows={10}
                    hint="The AI will use this to evaluate resume compatibility."
                  />
                  {jdText.trim() && (
                    <div className="ch-jd-status">
                      <Check size={14} style={{ color: 'var(--status-success-text)' }} />
                      <span style={{ color: 'var(--status-success-text)', fontWeight: 500 }}>
                        JD ready — {jdText.trim().split(/\s+/).length} words
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Upload area */}
              {jdMode === 'upload' && (
                <div className="animate-fade-in" style={{ marginTop: '20px' }}>
                  <input
                    ref={jdFileRef}
                    type="file"
                    accept=".pdf,.docx,.doc"
                    style={{ display: 'none' }}
                    onChange={handleJdFileChange}
                  />
                  {!jdFileName ? (
                    <div
                      className="file-upload"
                      onClick={() => !jdUploading && jdFileRef.current?.click()}
                      style={{ cursor: jdUploading ? 'default' : 'pointer' }}
                    >
                      <div className="file-upload__icon">
                        {jdUploading ? <Loader2 size={28} className="spin" /> : <FileText size={28} />}
                      </div>
                      <p className="file-upload__title">
                        {jdUploading ? 'Uploading…' : 'Upload JD Document'}
                      </p>
                      <p className="file-upload__sub">
                        {jdUploading ? 'Processing file' : 'Click to browse your files'}
                      </p>
                      {!jdUploading && (
                        <span className="file-upload__formats">Supports PDF, DOCX, DOC</span>
                      )}
                    </div>
                  ) : (
                    <div className="ch-file-pill">
                      <FileText size={16} style={{ color: 'var(--brand-primary)' }} />
                      <span className="ch-file-pill__name">{jdFileName}</span>
                      <button
                        className="ch-file-pill__remove"
                        onClick={() => { setJdFileName(''); setJdText(''); }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ══════════════ STEP 3 — RESUMES ══════════════ */}
          {currentStep === 'resumes' && (
            <div className="ch-step animate-fade-in">
              <div className="ch-step__heading">
                <h2>Resume Source</h2>
                <p>
                  Provide candidate resumes for AI screening.
                  For small batches, upload directly. For larger collections, connect Google Drive.
                </p>
              </div>

              {resumeFiles.length === 0 ? (
                <div className="ch-resume-sources">
                  {/* Upload resumes */}
                  <div className="ch-source-card">
                    <div className="ch-source-card__header">
                      <div className="ch-source-card__icon" style={{ background: 'var(--brand-primary-light)', color: 'var(--brand-primary)' }}>
                        <Upload size={20} />
                      </div>
                      <div>
                        <h3 className="ch-source-card__title">Upload Resumes</h3>
                        <p className="ch-source-card__sub">Best for up to ~20 resumes</p>
                      </div>
                    </div>
                    <p className="ch-source-card__desc">
                      Select PDF or DOCX resume files from your computer.
                      Each file will be processed individually.
                    </p>
                    <input
                      ref={resumeFileRef}
                      type="file"
                      accept=".pdf,.docx,.doc"
                      multiple
                      style={{ display: 'none' }}
                      onChange={handleResumeFilesChange}
                    />
                    <Button
                      variant="outline"
                      icon={<Upload size={14} />}
                      onClick={() => resumeFileRef.current?.click()}
                      loading={resumeUploading}
                    >
                      {resumeUploading ? 'Uploading…' : 'Choose Resume Files'}
                    </Button>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '8px' }}>
                      Supports PDF, DOCX · Multiple files allowed
                    </p>
                  </div>

                  <div className="ch-source-divider">or</div>

                  {/* Google Drive */}
                  <div className="ch-source-card">
                    <div className="ch-source-card__header">
                      <div className="ch-source-card__icon" style={{ background: '#ecfdf5', color: '#0f9d58' }}>
                        <HardDrive size={20} />
                      </div>
                      <div>
                        <h3 className="ch-source-card__title">Import from Google Drive</h3>
                        <p className="ch-source-card__sub">Best for larger resume collections</p>
                      </div>
                    </div>
                    <p className="ch-source-card__desc">
                      Connect a Google Drive folder containing resumes.
                      Ideal when your HR team stores resumes in a shared Drive.
                    </p>
                    <Button
                      variant="outline"
                      icon={driveConnecting ? <Loader2 size={14} className="spin" /> : <HardDrive size={14} />}
                      onClick={handleConnectDrive}
                      loading={driveConnecting}
                    >
                      {driveConnecting ? 'Connecting…' : 'Connect Google Drive'}
                    </Button>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '8px' }}>
                      You'll select a folder after connecting
                    </p>
                  </div>
                </div>
              ) : (
                // Resume list preview
                <div className="ch-resume-list animate-fade-in">
                  <div className="ch-resume-list__header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: 'var(--radius-md)',
                        background: 'var(--status-success-bg)', color: 'var(--status-success-text)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Check size={16} strokeWidth={2.5} />
                      </div>
                      <div>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 'var(--font-size-md)' }}>
                          {resumeFiles.length} resume{resumeFiles.length !== 1 ? 's' : ''} ready
                        </span>
                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '1px' }}>
                          {resumeMode === 'drive' ? 'Imported from Google Drive' : 'Uploaded from your computer'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<X size={13} />}
                      onClick={() => { setResumeFiles([]); setResumeMode(null); setDriveConnected(false); }}
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="ch-resume-list__files">
                    {resumeFiles.slice(0, 8).map((name, i) => (
                      <div key={i} className="ch-resume-file">
                        <FileText size={13} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
                        <span>{name}</span>
                      </div>
                    ))}
                    {resumeFiles.length > 8 && (
                      <div className="ch-resume-file" style={{ color: 'var(--text-secondary)' }}>
                        +{resumeFiles.length - 8} more files
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '12px' }}>
                    AI will evaluate each resume against the job description and generate a compatibility score.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ══════════════ STEP 4 — EXPLICIT CANDIDATE SOURCE (OPTIONAL) ══════════════ */}
          {currentStep === 'candidates' && (
            <div className="ch-step animate-fade-in">
              <div className="ch-step__heading">
                <h2>Explicit Candidate Source</h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Optional.</strong>{' '}
                  If you already know exactly which candidates to call, provide their contact details here.
                  This is separate from the resume screening — these candidates will be added directly to the calling list.
                </p>
              </div>

              {/* Use-case distinction card */}
              <div className="ch-usecase-banner">
                <div className="ch-usecase-item">
                  <Sparkles size={14} style={{ color: 'var(--brand-primary)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <span className="ch-usecase-item__label">AI Screening Path (previous steps)</span>
                    <span className="ch-usecase-item__desc">JD → Resumes → AI evaluates → Compatible candidates → Calling</span>
                  </div>
                </div>
                <div className="ch-usecase-divider" />
                <div className="ch-usecase-item">
                  <FileSpreadsheet size={14} style={{ color: '#7c3aed', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <span className="ch-usecase-item__label">Explicit Calling Path (this step)</span>
                    <span className="ch-usecase-item__desc">Excel/CSV/Sheets with names & phones → Call these specific people</span>
                  </div>
                </div>
              </div>

              {parsedCandidates.length === 0 ? (
                <div className="ch-candidates" style={{ marginTop: '20px' }}>
                  {/* Upload area */}
                  <div
                    className={`file-upload ${isDragging ? 'file-upload--dragging' : ''} ${parsing ? 'file-upload--parsing' : ''}`}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => !parsing && candidateFileRef.current?.click()}
                  >
                    <input
                      ref={candidateFileRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      style={{ display: 'none' }}
                      onChange={handleCandidateFileChange}
                    />
                    <div className="file-upload__icon">
                      {parsing ? <Loader2 size={28} className="spin" /> : <FileSpreadsheet size={28} />}
                    </div>
                    <p className="file-upload__title">
                      {parsing ? 'Parsing file…' : 'Upload Excel / CSV'}
                    </p>
                    <p className="file-upload__sub">
                      {parsing ? 'Reading candidate data' : 'Drag & drop or click to browse'}
                    </p>
                    {!parsing && (
                      <span className="file-upload__formats">Supports .xlsx, .xls, .csv · Columns: Name, Phone, Email</span>
                    )}
                  </div>

                  {parseError && (
                    <div className="import-error">
                      <AlertCircle size={15} />
                      {parseError}
                    </div>
                  )}

                  <div className="ch-divider"><span>or</span></div>

                  <button className="gs-connect" onClick={() => setShowSheetsModal(true)}>
                    <div className="gs-connect__icon">
                      <Table2 size={22} color="#0f9d58" />
                    </div>
                    <div className="gs-connect__text">
                      <span className="gs-connect__title">Connect Google Sheets</span>
                      <span className="gs-connect__sub">Import candidate list from a spreadsheet</span>
                    </div>
                    <ChevronRight size={16} color="var(--text-tertiary)" />
                  </button>

                  <div className="ch-skip-note">
                    <span>No explicit list?</span>
                    <button
                      style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--font-size-sm)', padding: 0 }}
                      onClick={handleNext}
                    >
                      Skip this step →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="candidate-preview animate-fade-in">
                  <div className="candidate-preview__header">
                    <div className="candidate-preview__info">
                      <div className="candidate-preview__count-badge">
                        <Check size={14} strokeWidth={2.5} />
                        <span>{validCandidates.length} valid</span>
                      </div>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                        from {importSource === 'sheets' ? 'Google Sheets' : 'file'}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<X size={13} />}
                      onClick={() => { setParsedCandidates([]); setImportSource(null); setParseError(''); }}
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="candidate-preview__table-wrap">
                    <table className="candidate-preview__table">
                      <thead>
                        <tr>
                          <th></th>
                          <th>Name</th>
                          <th>Phone</th>
                          <th>Email</th>
                          <th>Experience</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedCandidates.slice(0, 8).map((c, i) => (
                          <tr key={i} className={!c._valid ? 'row-invalid' : ''}>
                            <td>{c._valid ? <Check size={12} style={{ color: 'var(--status-success-text)' }} /> : <AlertCircle size={12} style={{ color: 'var(--status-error-text)' }} />}</td>
                            <td>{c.name || '—'}</td>
                            <td>{c.phone || '—'}</td>
                            <td>{c.email || '—'}</td>
                            <td>{c.experience || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedCandidates.length > 8 && (
                      <p style={{ padding: '8px 16px', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                        +{parsedCandidates.length - 8} more rows
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════ STEP 5 — AI RECRUITER ══════════════ */}
          {currentStep === 'recruiter' && (
            <div className="ch-step animate-fade-in">
              <div className="ch-step__heading">
                <h2>Select AI Recruiter</h2>
                <p>Choose the AI Recruiter that will conduct the calls after screening is complete.</p>
              </div>

              {recruiters.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>No AI Recruiters yet.</p>
                  <Button icon={<ChevronRight size={14} />} onClick={() => setShowCreateRecruiterModal(true)}>
                    Create AI Recruiter
                  </Button>
                </div>
              ) : (
                <div className="ch-step__recruiter-grid">
                  {recruiters.map(r => (
                    <RecruiterCard
                      key={r.id}
                      recruiter={r}
                      selected={selectedRecruiter?.id === r.id}
                      onClick={() => handleSelectRecruiter(r)}
                    />
                  ))}
                  <button
                    className="recruiter-card recruiter-card--add"
                    onClick={() => setShowCreateRecruiterModal(true)}
                  >
                    <span className="recruiter-card--add__icon">+</span>
                    <span>Create new AI Recruiter</span>
                  </button>
                </div>
              )}

              {selectedRecruiter && (
                <div className="ch-instructions animate-fade-in">
                  <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Interview instructions for {selectedRecruiter.name}
                  </label>
                  <textarea
                    value={instructions}
                    onChange={e => setInstructions(e.target.value)}
                    rows={4}
                    placeholder="Describe what the AI Recruiter should ask and screen for…"
                    style={{
                      width: '100%', padding: '10px 12px', border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family)', resize: 'vertical',
                      background: 'var(--bg-white)', color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* ══════════════ STEP 6 — PREVIEW & LAUNCH ══════════════ */}
          {currentStep === 'preview' && selectedRecruiter && (
            <div className="ch-step animate-fade-in">
              <div className="ch-step__heading">
                <h2>Preview & Launch</h2>
                <p>Review your hiring setup, then choose how to proceed.</p>
              </div>

              {/* Summary cards */}
              <div className="review-grid">
                <div className="review-card">
                  <span className="review-card__label">Job Role</span>
                  <span className="review-card__value">{form.title}</span>
                  <span className="review-card__sub">{form.location} · {form.employmentType.replace('_', '-')}</span>
                </div>
                <div className="review-card">
                  <span className="review-card__label">Job Description</span>
                  <span className="review-card__value">
                    {jdFileName ? jdFileName : `${jdText.trim().split(/\s+/).slice(0, 6).join(' ')}…`}
                  </span>
                  <span className="review-card__sub">
                    {jdFileName ? 'Uploaded document' : `${jdText.trim().split(/\s+/).length} words pasted`}
                  </span>
                </div>
                <div className="review-card">
                  <span className="review-card__label">Resumes</span>
                  <span className="review-card__value">{totalResumes}</span>
                  <span className="review-card__sub">
                    {resumeMode === 'drive' ? 'From Google Drive' : 'Uploaded files'} · ready for screening
                  </span>
                </div>
                {validCandidates.length > 0 && (
                  <div className="review-card">
                    <span className="review-card__label">Explicit Candidates</span>
                    <span className="review-card__value">{validCandidates.length}</span>
                    <span className="review-card__sub">
                      From {importSource === 'sheets' ? 'Google Sheets' : 'Excel/CSV'} · will be called directly
                    </span>
                  </div>
                )}
                <div className="review-card">
                  <span className="review-card__label">AI Recruiter</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <Avatar name={selectedRecruiter.name} size="sm" color={selectedRecruiter.avatarColor} />
                    <span className="review-card__value">{selectedRecruiter.name}</span>
                  </div>
                  <span className="review-card__sub">{selectedRecruiter.conversationStyle} · {selectedRecruiter.languages.join(', ')}</span>
                </div>
              </div>

              {/* AI Recruiter preview card */}
              <div className="ch-recruiter-preview">
                <div className="ch-recruiter-preview__header">
                  <Avatar name={selectedRecruiter.name} size="lg" color={selectedRecruiter.avatarColor} />
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: 'var(--font-size-md)', color: 'var(--text-primary)' }}>
                      {selectedRecruiter.name}
                    </h3>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                      {selectedRecruiter.description}
                    </p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {selectedRecruiter.languages.map(l => (
                        <span key={l} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--brand-primary-light)', color: 'var(--brand-primary)', fontWeight: 600 }}>{l}</span>
                      ))}
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--bg-subtle)', color: 'var(--text-secondary)', fontWeight: 600 }}>{selectedRecruiter.conversationStyle}</span>
                    </div>
                  </div>
                </div>
                {instructions && (
                  <div className="ch-recruiter-preview__instructions">
                    <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Interview instructions
                    </span>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', marginTop: '6px', lineHeight: 1.6 }}>
                      {instructions}
                    </p>
                  </div>
                )}
              </div>

              {/* Launch buttons */}
              <div className="ch-launch-actions">
                <div className="ch-launch-option ch-launch-option--screen">
                  <div className="ch-launch-option__header">
                    <Eye size={20} style={{ color: 'var(--brand-primary)' }} />
                    <div>
                      <h3>Screen Only</h3>
                      <p>AI evaluates all {totalResumes} resumes against the JD. You review results before any calls are made.</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    fullWidth
                    icon={<Sparkles size={15} />}
                    onClick={handleScreenOnly}
                  >
                    Screen Only
                  </Button>
                </div>

                <div className="ch-launch-option ch-launch-option--call">
                  <div className="ch-launch-option__header">
                    <Play size={20} style={{ color: 'var(--status-success-text)' }} />
                    <div>
                      <h3>Screen &amp; Start Calling</h3>
                      <p>AI screens resumes, then immediately starts calling compatible candidates — no manual step needed.</p>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    icon={<Play size={15} />}
                    onClick={handleScreenAndCall}
                  >
                    Screen &amp; Start Calling
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ——— Footer Nav ——— */}
          {currentStep !== 'preview' && (
            <div className="create-hiring__footer">
              <Button variant="secondary" onClick={handleBack}>
                {currentIndex === 0 ? 'Cancel' : 'Back'}
              </Button>
              <Button onClick={handleNext} iconRight={<ChevronRight size={16} />}>
                {currentStep === 'candidates' ? 'Continue' : 'Continue'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Google Sheets modal */}
      <Modal
        open={showSheetsModal}
        onClose={() => { setShowSheetsModal(false); setSheetsUrl(''); setSheetsUrlError(''); }}
        title="Connect Google Sheets"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowSheetsModal(false)}>Cancel</Button>
            <Button onClick={handleSheetsConnect} loading={fetchingSheets}>
              {fetchingSheets ? 'Importing…' : 'Import'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '4px 0' }}>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
            Paste the URL of a Google Sheet containing your candidate list.
            Required columns: <strong>Name</strong>, <strong>Phone</strong>. Optional: Email, Experience, Location.
          </p>
          <Input
            label="Google Sheets URL"
            placeholder="https://docs.google.com/spreadsheets/d/…"
            value={sheetsUrl}
            onChange={e => { setSheetsUrl(e.target.value); setSheetsUrlError(''); }}
            error={sheetsUrlError}
          />
        </div>
      </Modal>

      {/* Create Recruiter modal */}
      <Modal
        open={showCreateRecruiterModal}
        onClose={() => setShowCreateRecruiterModal(false)}
        title="Create AI Recruiter"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateRecruiterModal(false)}>Cancel</Button>
            <Button onClick={handleSaveRecruiter}>Create</Button>
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
            placeholder="Tell this AI Recruiter what to ask and screen for…"
            value={newRecruiterForm.interviewInstructions}
            onChange={e => setNewRecruiterForm(f => ({ ...f, interviewInstructions: e.target.value }))}
            rows={4}
            error={recruiterErrors.interviewInstructions}
            hint="e.g. Screen for experience, ask about availability and expected salary."
          />
        </div>
      </Modal>

      {/* Inline styles for new CreateHiring elements */}
      {injectCreateHiringStyles()}
    </div>
  );
};

function injectCreateHiringStyles() {
  if (typeof document !== 'undefined' && !document.getElementById('ch-extra-styles')) {
    const s = document.createElement('style');
    s.id = 'ch-extra-styles';
    s.textContent = `
.ch-jd-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ch-jd-option {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: 2px solid var(--border-default);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: border-color var(--transition-fast), background var(--transition-fast);
  background: var(--bg-white);
}
.ch-jd-option:hover { border-color: var(--brand-primary-border); background: var(--brand-primary-light); }
.ch-jd-option--active { border-color: var(--brand-primary); background: var(--brand-primary-light); }
.ch-jd-option__icon {
  width: 42px; height: 42px; border-radius: var(--radius-md);
  background: var(--bg-subtle); display: flex; align-items: center; justify-content: center;
  color: var(--brand-primary); flex-shrink: 0;
}
.ch-jd-option__text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.ch-jd-option__title { font-size: var(--font-size-base); font-weight: 600; color: var(--text-primary); }
.ch-jd-option__sub { font-size: var(--font-size-xs); color: var(--text-secondary); }
.ch-jd-status {
  display: flex; align-items: center; gap: 6px;
  font-size: var(--font-size-xs); padding: 6px 10px;
  background: var(--status-success-bg); border-radius: var(--radius-sm);
  border: 1px solid var(--status-success-border);
}
.ch-file-pill {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 12px; background: var(--brand-primary-light);
  border: 1px solid var(--brand-primary-border); border-radius: var(--radius-md);
  max-width: 100%;
}
.ch-file-pill__name { flex: 1; font-size: var(--font-size-sm); font-weight: 500; color: var(--brand-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ch-file-pill__remove { background: none; border: none; cursor: pointer; color: var(--text-tertiary); display: flex; padding: 0; }
.ch-resume-sources {
  display: flex; flex-direction: column; gap: 0;
}
.ch-source-card {
  padding: 20px 22px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-white);
  display: flex; flex-direction: column; gap: 10px;
}
.ch-source-card__header { display: flex; align-items: flex-start; gap: 12px; }
.ch-source-card__icon {
  width: 40px; height: 40px; border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.ch-source-card__title { font-size: var(--font-size-base); font-weight: 600; color: var(--text-primary); }
.ch-source-card__sub { font-size: var(--font-size-xs); color: var(--text-tertiary); }
.ch-source-card__desc { font-size: var(--font-size-sm); color: var(--text-secondary); line-height: 1.5; }
.ch-source-divider {
  text-align: center; padding: 10px 0;
  font-size: var(--font-size-xs); color: var(--text-muted); font-weight: 500;
  position: relative;
}
.ch-source-divider::before, .ch-source-divider::after {
  content: ''; position: absolute; top: 50%; width: calc(50% - 20px);
  height: 1px; background: var(--border-default);
}
.ch-source-divider::before { left: 0; }
.ch-source-divider::after { right: 0; }
.ch-resume-list {
  border: 1px solid var(--border-default); border-radius: var(--radius-md);
  background: var(--bg-white); overflow: hidden;
}
.ch-resume-list__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px; border-bottom: 1px solid var(--border-default);
}
.ch-resume-list__files {
  padding: 12px 16px; display: flex; flex-direction: column; gap: 6px;
}
.ch-resume-file {
  display: flex; align-items: center; gap: 8px;
  font-size: var(--font-size-sm); color: var(--text-primary);
  padding: 4px 0;
}
.ch-usecase-banner {
  background: var(--bg-subtle); border: 1px solid var(--border-default);
  border-radius: var(--radius-md); padding: 14px 16px;
  display: flex; gap: 16px; align-items: flex-start;
  margin-bottom: 4px;
}
.ch-usecase-divider { width: 1px; background: var(--border-default); flex-shrink: 0; align-self: stretch; }
.ch-usecase-item { display: flex; gap: 10px; align-items: flex-start; flex: 1; }
.ch-usecase-item__label { font-size: var(--font-size-xs); font-weight: 600; color: var(--text-primary); display: block; }
.ch-usecase-item__desc { font-size: var(--font-size-xs); color: var(--text-secondary); display: block; margin-top: 2px; }
.ch-skip-note {
  display: flex; align-items: center; gap: 8px;
  font-size: var(--font-size-sm); color: var(--text-secondary);
  padding: 12px 0 4px;
}
.ch-launch-actions {
  display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 20px;
}
.ch-launch-option {
  border: 2px solid var(--border-default);
  border-radius: var(--radius-lg); padding: 20px;
  display: flex; flex-direction: column; gap: 16px;
  background: var(--bg-white);
}
.ch-launch-option--call {
  border-color: var(--brand-primary-border);
  background: var(--brand-primary-light);
}
.ch-launch-option__header { display: flex; gap: 12px; align-items: flex-start; }
.ch-launch-option__header h3 { font-size: var(--font-size-base); font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
.ch-launch-option__header p { font-size: var(--font-size-xs); color: var(--text-secondary); line-height: 1.5; }
.ch-recruiter-preview {
  margin-top: 16px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md); overflow: hidden;
}
.ch-recruiter-preview__header {
  display: flex; gap: 14px; align-items: flex-start;
  padding: 18px 20px; background: var(--bg-white);
}
.ch-recruiter-preview__instructions {
  padding: 14px 20px;
  background: var(--bg-subtle);
  border-top: 1px solid var(--border-default);
}
@media (max-width: 640px) {
  .ch-launch-actions { grid-template-columns: 1fr; }
  .ch-usecase-banner { flex-direction: column; }
  .ch-usecase-divider { width: 100%; height: 1px; }
}
    `;
    document.head.appendChild(s);
  }
  return null;
}

export default CreateHiring;
