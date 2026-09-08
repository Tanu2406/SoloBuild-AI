import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, FileSpreadsheet, Table2,
  Check, ChevronRight, X, AlertCircle, Loader2,
  Upload, HardDrive, Sparkles, Play, Eye
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

const employmentOptions = [
  { value: 'full_time',  label: 'Full-time' },
  { value: 'part_time',  label: 'Part-time' },
  { value: 'contract',   label: 'Contract' },
  { value: 'internship', label: 'Internship' },
];

const AVATAR_COLORS = ['#2563eb', '#0891b2', '#7c3aed', '#059669', '#dc2626', '#d97706'];

const MOCK_DRIVE_RESUMES = [
  'Aarav_Sharma_Resume.pdf', 'Priya_Patil_CV.pdf', 'Rahul_Mehta_Resume.docx',
  'Neha_Singh_CV.pdf', 'Vikram_Joshi_Resume.pdf', 'Sunita_Reddy_CV.docx',
  'Arjun_Kapoor_Resume.pdf', 'Deepika_Nair_CV.pdf', 'Manish_Kumar_Resume.pdf',
  'Kavya_Menon_CV.pdf', 'Rohan_Desai_Resume.docx', 'Anita_Bose_CV.pdf',
];

// Section IDs for the sticky nav
const SECTIONS = [
  { id: 'job',        label: 'Job Details' },
  { id: 'jd',         label: 'Job Description' },
  { id: 'resumes',    label: 'Resumes' },
  { id: 'candidates', label: 'Candidate Source' },
  { id: 'recruiter',  label: 'AI Recruiter' },
  { id: 'launch',     label: 'Launch' },
];

const CreateHiring: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { dispatch } = useAppStore();
  const recruiters = useRecruiters();
  const scrollRef = useRef<HTMLDivElement>(null);

  // ——— Active section tracker ———
  const [activeSection, setActiveSection] = useState('job');

  // ——— Job details ———
  const [form, setForm] = useState<CreateHiringForm>({
    title: '', location: '', employmentType: 'full_time', description: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<CreateHiringForm>>({});

  // ——— JD ———
  const [jdMode, setJdMode] = useState<'paste' | 'upload' | null>(null);
  const [jdText, setJdText] = useState('');
  const [jdFileName, setJdFileName] = useState('');
  const [jdUploading, setJdUploading] = useState(false);
  const jdFileRef = useRef<HTMLInputElement>(null);

  // ——— Resumes ———
  const [resumeMode, setResumeMode] = useState<'upload' | 'drive' | null>(null);
  const [resumeFiles, setResumeFiles] = useState<string[]>([]);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [driveConnecting, setDriveConnecting] = useState(false);
  const resumeFileRef = useRef<HTMLInputElement>(null);

  // ——— Explicit candidates (optional) ———
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

  // ——— Recruiter ———
  const [selectedRecruiter, setSelectedRecruiter] = useState<AIRecruiter | null>(null);
  const [instructions, setInstructions] = useState('');
  const [showCreateRecruiterModal, setShowCreateRecruiterModal] = useState(false);
  const [newRecruiterForm, setNewRecruiterForm] = useState({
    name: '', conversationStyle: 'friendly_professional',
    languages: 'english_hindi', voice: 'Warm & Clear', interviewInstructions: '',
  });
  const [recruiterErrors, setRecruiterErrors] = useState<Record<string, string>>({});

  const validCandidates = parsedCandidates.filter(c => c._valid);
  const totalResumes = resumeFiles.length;

  // ——— Intersection observer for active section ———
  useEffect(() => {
    const sectionEls = SECTIONS.map(s => document.getElementById(`ch-section-${s.id}`)).filter(Boolean);
    if (sectionEls.length === 0) return;
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) {
          // pick the topmost visible
          const topmost = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
          const id = topmost.target.id.replace('ch-section-', '');
          setActiveSection(id);
        }
      },
      { root: scrollRef.current, rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    );
    sectionEls.forEach(el => observer.observe(el!));
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(`ch-section-${id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ——— JD upload ———
  const handleJdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.match(/\.(pdf|docx|doc)$/i)) {
      showToast('Please upload a PDF or DOCX file', 'error');
      return;
    }
    setJdUploading(true);
    setTimeout(() => {
      setJdFileName(file.name);
      setJdText(`[Uploaded from ${file.name}]`);
      setJdUploading(false);
      showToast(`JD uploaded: ${file.name}`, 'success');
    }, 900);
    if (jdFileRef.current) jdFileRef.current.value = '';
  };

  // ——— Resume upload ———
  const handleResumeFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setResumeUploading(true);
    setTimeout(() => {
      setResumeFiles(prev => [...prev, ...files.map(f => f.name)]);
      setResumeMode('upload');
      setResumeUploading(false);
      showToast(`${files.length} resume${files.length > 1 ? 's' : ''} added`, 'success');
    }, 800);
    if (resumeFileRef.current) resumeFileRef.current.value = '';
  };

  const handleConnectDrive = () => {
    setDriveConnecting(true);
    setTimeout(() => {
      const count = 8 + Math.floor(Math.random() * 5);
      const selected = MOCK_DRIVE_RESUMES.slice(0, count);
      setResumeFiles(selected);
      setResumeMode('drive');
      setDriveConnecting(false);
      showToast(`${selected.length} resumes imported from Google Drive`, 'success');
    }, 1400);
  };

  // ——— Explicit candidate file ———
  async function processFile(file: File) {
    setParsing(true);
    setParseError('');
    setParsedCandidates([]);
    try {
      const results = await parseFile(file);
      if (results.length === 0) { setParseError('No candidate rows found. Check column headers.'); return; }
      setParsedCandidates(results);
      setImportSource('excel');
      showToast(`${results.filter(r => r._valid).length} candidates loaded`, 'success');
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
      showToast(`${results.filter(r => r._valid).length} candidates imported from Sheets`, 'success');
    } catch (err: any) {
      setSheetsUrlError(err.message || 'Failed to connect');
    } finally {
      setFetchingSheets(false);
    }
  };

  // ——— Create recruiter ———
  const handleSaveRecruiter = () => {
    const e: Record<string, string> = {};
    if (!newRecruiterForm.name.trim()) e.name = 'Name is required';
    if (!newRecruiterForm.interviewInstructions.trim()) e.interviewInstructions = 'Instructions are required';
    setRecruiterErrors(e);
    if (Object.keys(e).length > 0) return;

    const langMap: Record<string, string[]> = {
      english: ['English'], english_hindi: ['English', 'Hindi'],
      english_hindi_marathi: ['English', 'Hindi', 'Marathi'],
    };
    const styleMap: Record<string, string> = {
      friendly_professional: 'Friendly Professional', professional: 'Professional',
      conversational: 'Conversational', formal: 'Formal',
    };
    const newRec: AIRecruiter = {
      id: `ar_${Date.now()}`,
      name: newRecruiterForm.name.trim(),
      description: `${styleMap[newRecruiterForm.conversationStyle]} tone.`,
      languages: langMap[newRecruiterForm.languages] || ['English'],
      voice: newRecruiterForm.voice,
      conversationStyle: styleMap[newRecruiterForm.conversationStyle],
      interviewInstructions: newRecruiterForm.interviewInstructions.trim(),
      avatarInitial: newRecruiterForm.name[0].toUpperCase(),
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    };
    dispatch({ type: 'CREATE_RECRUITER', payload: newRec });
    setSelectedRecruiter(newRec);
    setInstructions(newRec.interviewInstructions || '');
    setShowCreateRecruiterModal(false);
    showToast(`AI Recruiter "${newRec.name}" created`, 'success');
  };

  const handleSelectRecruiter = (r: AIRecruiter) => {
    setSelectedRecruiter(r);
    setInstructions(
      form.title
        ? `Screen candidates for the ${form.title} position in ${form.location}. Ask about their experience, current role, availability to join, and expected salary. Be ${r.conversationStyle.toLowerCase()}.`
        : r.interviewInstructions || ''
    );
  };

  // ——— Validation before launch ———
  const validate = () => {
    const e: Partial<CreateHiringForm> = {};
    if (!form.title.trim()) e.title = 'Job title is required';
    if (!form.location.trim()) e.location = 'Location is required';
    setFormErrors(e);
    if (Object.keys(e).length > 0) {
      scrollToSection('job');
      showToast('Please fill in job title and location', 'error');
      return false;
    }
    if (!jdText.trim() && !jdFileName) {
      showToast('Please provide a Job Description in Step 2', 'error');
      scrollToSection('jd');
      return false;
    }
    if (totalResumes === 0) {
      showToast('Please add resumes in Step 3', 'error');
      scrollToSection('resumes');
      return false;
    }
    if (!selectedRecruiter) {
      showToast('Please select an AI Recruiter in Step 5', 'error');
      scrollToSection('recruiter');
      return false;
    }
    return true;
  };

  // ——— Launch ———
  const launch = (mode: 'screen_only' | 'screen_and_call') => {
    if (!validate()) return;
    const hiringId = `h_${Date.now()}`;
    const now = new Date().toISOString();
    dispatch({
      type: 'CREATE_HIRING',
      payload: {
        id: hiringId, title: form.title, location: form.location,
        employmentType: form.employmentType as EmploymentType,
        description: form.description, jdText,
        jdFileName: jdFileName || undefined, resumeCount: totalResumes,
        status: 'screening', aiRecruiterId: selectedRecruiter!.id,
        interviewInstructions: instructions || selectedRecruiter!.interviewInstructions,
        candidateIds: [], candidateCount: 0,
        contacted: 0, connected: 0, interested: 0, shortlisted: 0,
        createdAt: now, updatedAt: now,
      },
    });
    dispatch({
      type: 'ADD_ACTIVITY',
      payload: {
        id: `act_create_${Date.now()}`, type: 'hiring_created',
        hiringTitle: form.title,
        description: `${form.title} hiring created — AI resume screening starting`,
        timestamp: now, timeAgo: 'just now',
      },
    });
    navigate(`/hiring/${hiringId}/screening?resumes=${totalResumes}&mode=${mode}`);
  };

  // ——— Section completion flags (for nav dots) ———
  const sectionDone = {
    job:        !!(form.title.trim() && form.location.trim()),
    jd:         !!(jdText.trim() || jdFileName),
    resumes:    totalResumes > 0,
    candidates: true,   // always optional
    recruiter:  !!selectedRecruiter,
    launch:     false,
  };

  return (
    <div className="ch-page">
      {/* ══ LEFT: sticky sidebar nav ══ */}
      <aside className="ch-sidenav">
        <button className="ch-sidenav__back" onClick={() => navigate('/hiring')}>
          <ArrowLeft size={15} /> Back to Hiring
        </button>

        <div className="ch-sidenav__title">Create Hiring</div>

        <nav className="ch-sidenav__nav">
          {SECTIONS.map((s, i) => (
            <button
              key={s.id}
              className={`ch-sidenav__item ${activeSection === s.id ? 'ch-sidenav__item--active' : ''}`}
              onClick={() => scrollToSection(s.id)}
            >
              <div className={`ch-sidenav__dot ${sectionDone[s.id as keyof typeof sectionDone] ? 'ch-sidenav__dot--done' : activeSection === s.id ? 'ch-sidenav__dot--active' : ''}`}>
                {sectionDone[s.id as keyof typeof sectionDone] ? <Check size={10} strokeWidth={3} /> : i + 1}
              </div>
              <span>{s.label}</span>
              {s.id === 'candidates' && (
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: 'auto' }}>Optional</span>
              )}
            </button>
          ))}
        </nav>

        {/* Mini summary */}
        <div className="ch-sidenav__summary">
          {form.title && <p className="ch-sidenav__summary-item"><strong>Role:</strong> {form.title}</p>}
          {form.location && <p className="ch-sidenav__summary-item"><strong>Location:</strong> {form.location}</p>}
          {totalResumes > 0 && <p className="ch-sidenav__summary-item"><strong>Resumes:</strong> {totalResumes}</p>}
          {selectedRecruiter && <p className="ch-sidenav__summary-item"><strong>AI:</strong> {selectedRecruiter.name}</p>}
        </div>
      </aside>

      {/* ══ RIGHT: scrollable form body ══ */}
      <div className="ch-body" ref={scrollRef}>
        <div className="ch-form">

          {/* ─────────────── SECTION 1 — JOB DETAILS ─────────────── */}
          <section id="ch-section-job" className="ch-section">
            <div className="ch-section__header">
              <div className="ch-section__num">1</div>
              <div>
                <h2 className="ch-section__title">Job Details</h2>
                <p className="ch-section__sub">Basic information about the role you're hiring for.</p>
              </div>
            </div>
            <div className="ch-section__body">
              <Input
                label="Job title *"
                placeholder="e.g. Sales Executive, Frontend Developer, HR Manager"
                value={form.title}
                onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setFormErrors(er => ({ ...er, title: '' })); }}
                error={formErrors.title}
              />
              <div className="ch-row">
                <Input
                  label="Location *"
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
          </section>

          <div className="ch-divider" />

          {/* ─────────────── SECTION 2 — JOB DESCRIPTION ─────────────── */}
          <section id="ch-section-jd" className="ch-section">
            <div className="ch-section__header">
              <div className="ch-section__num">2</div>
              <div>
                <h2 className="ch-section__title">Job Description</h2>
                <p className="ch-section__sub">The AI evaluates every resume against this JD to determine compatibility.</p>
              </div>
            </div>
            <div className="ch-section__body">
              {/* Mode selector */}
              <div className="ch-toggle-row">
                <button
                  className={`ch-toggle-btn ${jdMode === 'paste' ? 'ch-toggle-btn--active' : ''}`}
                  onClick={() => { setJdMode('paste'); setJdFileName(''); }}
                >
                  <FileText size={15} />
                  Paste JD text
                </button>
                <button
                  className={`ch-toggle-btn ${jdMode === 'upload' ? 'ch-toggle-btn--active' : ''}`}
                  onClick={() => { setJdMode('upload'); setJdText(''); }}
                >
                  <Upload size={15} />
                  Upload PDF / DOCX
                </button>
              </div>

              {/* Paste */}
              {jdMode === 'paste' && (
                <div className="animate-fade-in">
                  <Textarea
                    label="Paste your Job Description"
                    placeholder={`We are looking for a Senior Sales Executive with 4+ years of B2B experience...\n\nResponsibilities:\n- Manage enterprise accounts\n- Hit quarterly targets\n- Build client relationships\n\nRequirements:\n- 3+ years B2B sales\n- Strong CRM skills\n- Excellent communication`}
                    value={jdText}
                    onChange={e => setJdText(e.target.value)}
                    rows={12}
                    hint="The AI will match each resume against this description."
                  />
                  {jdText.trim() && (
                    <div className="ch-status-pill ch-status-pill--success">
                      <Check size={13} /> JD ready — {jdText.trim().split(/\s+/).length} words
                    </div>
                  )}
                </div>
              )}

              {/* Upload */}
              {jdMode === 'upload' && (
                <div className="animate-fade-in">
                  <input ref={jdFileRef} type="file" accept=".pdf,.docx,.doc" style={{ display: 'none' }} onChange={handleJdFileChange} />
                  {!jdFileName ? (
                    <div className="ch-drop-zone" onClick={() => !jdUploading && jdFileRef.current?.click()}>
                      <div className="ch-drop-zone__icon">
                        {jdUploading ? <Loader2 size={26} className="spin" /> : <FileText size={26} />}
                      </div>
                      <p className="ch-drop-zone__title">{jdUploading ? 'Uploading…' : 'Click to upload JD document'}</p>
                      <p className="ch-drop-zone__sub">PDF, DOCX or DOC · Max 10 MB</p>
                    </div>
                  ) : (
                    <div className="ch-file-chip">
                      <FileText size={15} style={{ color: 'var(--brand-primary)' }} />
                      <span className="ch-file-chip__name">{jdFileName}</span>
                      <div className="ch-status-pill ch-status-pill--success" style={{ margin: 0 }}>
                        <Check size={12} /> Uploaded
                      </div>
                      <button className="ch-file-chip__remove" onClick={() => { setJdFileName(''); setJdText(''); }}>
                        <X size={13} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* No selection yet */}
              {!jdMode && (
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', paddingTop: '4px' }}>
                  Select an option above to provide the job description.
                </p>
              )}
            </div>
          </section>

          <div className="ch-divider" />

          {/* ─────────────── SECTION 3 — RESUMES ─────────────── */}
          <section id="ch-section-resumes" className="ch-section">
            <div className="ch-section__header">
              <div className="ch-section__num">3</div>
              <div>
                <h2 className="ch-section__title">Resume Source</h2>
                <p className="ch-section__sub">Provide candidate resumes for AI screening. Upload small batches directly or connect Google Drive for larger collections.</p>
              </div>
            </div>
            <div className="ch-section__body">
              {/* Source toggle */}
              <div className="ch-toggle-row">
                <button
                  className={`ch-toggle-btn ${resumeMode === 'upload' ? 'ch-toggle-btn--active' : ''}`}
                  onClick={() => resumeFileRef.current?.click()}
                >
                  <Upload size={15} />
                  Upload resumes <span style={{ fontSize: '10px', opacity: 0.7 }}>(≤ 20 files)</span>
                </button>
                <button
                  className={`ch-toggle-btn ${resumeMode === 'drive' ? 'ch-toggle-btn--active' : ''}`}
                  onClick={handleConnectDrive}
                  disabled={driveConnecting}
                >
                  {driveConnecting ? <Loader2 size={15} className="spin" /> : <HardDrive size={15} />}
                  {driveConnecting ? 'Connecting…' : 'Import from Google Drive'}
                </button>
              </div>

              <input ref={resumeFileRef} type="file" accept=".pdf,.docx,.doc" multiple style={{ display: 'none' }} onChange={handleResumeFilesChange} />

              {resumeUploading && (
                <div className="ch-status-pill" style={{ background: 'var(--brand-primary-light)', color: 'var(--brand-primary)', border: '1px solid var(--brand-primary-border)' }}>
                  <Loader2 size={13} className="spin" /> Uploading files…
                </div>
              )}

              {resumeFiles.length > 0 && (
                <div className="ch-resume-list animate-fade-in">
                  <div className="ch-resume-list__header">
                    <div className="ch-status-pill ch-status-pill--success" style={{ margin: 0 }}>
                      <Check size={12} /> {resumeFiles.length} resume{resumeFiles.length !== 1 ? 's' : ''} ready
                      <span style={{ fontSize: '10px', fontWeight: 400, marginLeft: '4px', opacity: 0.7 }}>
                        · {resumeMode === 'drive' ? 'Google Drive' : 'Uploaded'}
                      </span>
                    </div>
                    <button
                      className="ch-file-chip__remove"
                      style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', background: 'var(--bg-white)', cursor: 'pointer', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => { setResumeFiles([]); setResumeMode(null); }}
                    >
                      <X size={12} /> Clear
                    </button>
                  </div>
                  <div className="ch-resume-grid">
                    {resumeFiles.slice(0, 10).map((name, i) => (
                      <div key={i} className="ch-resume-item">
                        <FileText size={13} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
                        <span>{name}</span>
                      </div>
                    ))}
                    {resumeFiles.length > 10 && (
                      <div className="ch-resume-item" style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                        +{resumeFiles.length - 10} more files
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '10px' }}>
                    The AI will evaluate each resume against the job description and generate a compatibility score.
                  </p>
                </div>
              )}
            </div>
          </section>

          <div className="ch-divider" />

          {/* ─────────────── SECTION 4 — EXPLICIT CANDIDATE SOURCE (OPTIONAL) ─────────────── */}
          <section id="ch-section-candidates" className="ch-section">
            <div className="ch-section__header">
              <div className="ch-section__num" style={{ background: 'var(--bg-muted)', color: 'var(--text-tertiary)', border: 'none' }}>4</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 className="ch-section__title">Explicit Candidate Source</h2>
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--bg-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border-default)' }}>Optional</span>
                </div>
                <p className="ch-section__sub">
                  Already know which candidates to call? Upload their contact details directly.
                  This is a separate path from resume screening — these candidates skip evaluation and go straight to calling.
                </p>
              </div>
            </div>
            <div className="ch-section__body">
              {/* Use-case note */}
              <div className="ch-note">
                <div className="ch-note__row">
                  <Sparkles size={13} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
                  <div>
                    <strong>AI Screening path</strong> — JD + Resumes → AI evaluates → Compatible candidates → Calling
                  </div>
                </div>
                <div className="ch-note__row" style={{ marginTop: '6px' }}>
                  <FileSpreadsheet size={13} style={{ color: '#7c3aed', flexShrink: 0 }} />
                  <div>
                    <strong>Explicit calling path (this section)</strong> — Excel / CSV / Sheets with names &amp; phones → Call these specific people directly
                  </div>
                </div>
              </div>

              {parsedCandidates.length === 0 ? (
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {/* Upload file */}
                  <div
                    className={`ch-drop-zone ch-drop-zone--inline ${isDragging ? 'ch-drop-zone--drag' : ''} ${parsing ? 'ch-drop-zone--loading' : ''}`}
                    style={{ flex: 1, minWidth: '200px' }}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => !parsing && candidateFileRef.current?.click()}
                  >
                    <input ref={candidateFileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={handleCandidateFileChange} />
                    <div className="ch-drop-zone__icon">
                      {parsing ? <Loader2 size={22} className="spin" /> : <FileSpreadsheet size={22} />}
                    </div>
                    <p className="ch-drop-zone__title">{parsing ? 'Parsing…' : 'Upload Excel / CSV'}</p>
                    <p className="ch-drop-zone__sub">.xlsx · .xls · .csv · Name, Phone, Email columns</p>
                  </div>

                  {/* Google Sheets */}
                  <button
                    className="ch-drop-zone ch-drop-zone--inline ch-drop-zone--sheets"
                    style={{ flex: 1, minWidth: '200px' }}
                    onClick={() => setShowSheetsModal(true)}
                  >
                    <div className="ch-drop-zone__icon" style={{ color: '#0f9d58' }}>
                      <Table2 size={22} />
                    </div>
                    <p className="ch-drop-zone__title">Connect Google Sheets</p>
                    <p className="ch-drop-zone__sub">Import candidate list from a shared spreadsheet</p>
                  </button>
                </div>
              ) : (
                <div className="animate-fade-in">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div className="ch-status-pill ch-status-pill--success">
                      <Check size={12} /> {validCandidates.length} valid candidates from {importSource === 'sheets' ? 'Google Sheets' : 'file'}
                    </div>
                    <button
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 'var(--font-size-xs)', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => { setParsedCandidates([]); setImportSource(null); setParseError(''); }}
                    >
                      <X size={13} /> Clear
                    </button>
                  </div>
                  <div className="ch-candidates-table">
                    <table>
                      <thead><tr><th></th><th>Name</th><th>Phone</th><th>Email</th><th>Experience</th></tr></thead>
                      <tbody>
                        {parsedCandidates.slice(0, 6).map((c, i) => (
                          <tr key={i}>
                            <td>{c._valid ? <Check size={12} style={{ color: 'var(--status-success-text)' }} /> : <AlertCircle size={12} style={{ color: 'var(--status-error-text)' }} />}</td>
                            <td>{c.name || '—'}</td><td>{c.phone || '—'}</td>
                            <td>{c.email || '—'}</td><td>{c.experience || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedCandidates.length > 6 && (
                      <p style={{ padding: '6px 12px', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>+{parsedCandidates.length - 6} more rows</p>
                    )}
                  </div>
                </div>
              )}
              {parseError && (
                <div className="ch-error"><AlertCircle size={14} /> {parseError}</div>
              )}
            </div>
          </section>

          <div className="ch-divider" />

          {/* ─────────────── SECTION 5 — AI RECRUITER ─────────────── */}
          <section id="ch-section-recruiter" className="ch-section">
            <div className="ch-section__header">
              <div className="ch-section__num">5</div>
              <div>
                <h2 className="ch-section__title">Select AI Recruiter</h2>
                <p className="ch-section__sub">Choose the AI Recruiter that will conduct calls after screening.</p>
              </div>
            </div>
            <div className="ch-section__body">
              {recruiters.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '12px', fontSize: 'var(--font-size-sm)' }}>No AI Recruiters yet. Create one to continue.</p>
                  <Button icon={<ChevronRight size={14} />} onClick={() => setShowCreateRecruiterModal(true)}>
                    Create AI Recruiter
                  </Button>
                </div>
              ) : (
                <>
                  <div className="ch-recruiter-grid">
                    {recruiters.map(r => (
                      <RecruiterCard
                        key={r.id}
                        recruiter={r}
                        selected={selectedRecruiter?.id === r.id}
                        onClick={() => handleSelectRecruiter(r)}
                      />
                    ))}
                    <button className="recruiter-card recruiter-card--add" onClick={() => setShowCreateRecruiterModal(true)}>
                      <span className="recruiter-card--add__icon">+</span>
                      <span>New AI Recruiter</span>
                    </button>
                  </div>

                  {selectedRecruiter && (
                    <div className="ch-instructions animate-fade-in">
                      <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Interview instructions for {selectedRecruiter.name}
                      </label>
                      <textarea
                        value={instructions}
                        onChange={e => setInstructions(e.target.value)}
                        rows={4}
                        placeholder="Describe what the AI Recruiter should ask and screen for…"
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)', fontFamily: 'var(--font-family)', resize: 'vertical', background: 'var(--bg-white)', color: 'var(--text-primary)', outline: 'none', lineHeight: 1.6 }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          <div className="ch-divider" />

          {/* ─────────────── SECTION 6 — LAUNCH ─────────────── */}
          <section id="ch-section-launch" className="ch-section">
            <div className="ch-section__header">
              <div className="ch-section__num" style={{ background: 'var(--brand-primary)', color: 'white', border: 'none' }}>6</div>
              <div>
                <h2 className="ch-section__title">Preview &amp; Launch</h2>
                <p className="ch-section__sub">Review your setup and choose how to proceed.</p>
              </div>
            </div>
            <div className="ch-section__body">
              {/* Summary strip */}
              <div className="ch-summary-strip">
                {[
                  { label: 'Role',       value: form.title || '—' },
                  { label: 'Location',   value: form.location || '—' },
                  { label: 'JD',         value: jdFileName ? jdFileName : jdText ? `${jdText.trim().split(/\s+/).length} words` : '—' },
                  { label: 'Resumes',    value: totalResumes > 0 ? `${totalResumes} files` : '—' },
                  { label: 'AI',         value: selectedRecruiter?.name || '—' },
                ].map(item => (
                  <div key={item.label} className="ch-summary-item">
                    <span className="ch-summary-item__label">{item.label}</span>
                    <span className="ch-summary-item__value">{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Recruiter preview */}
              {selectedRecruiter && (
                <div className="ch-recruiter-preview animate-fade-in">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Avatar name={selectedRecruiter.name} size="lg" color={selectedRecruiter.avatarColor} />
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 'var(--font-size-md)', color: 'var(--text-primary)' }}>{selectedRecruiter.name}</p>
                      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>{selectedRecruiter.description}</p>
                      <div style={{ display: 'flex', gap: '5px', marginTop: '5px', flexWrap: 'wrap' }}>
                        {selectedRecruiter.languages.map(l => (
                          <span key={l} style={{ fontSize: '11px', padding: '2px 7px', borderRadius: 'var(--radius-full)', background: 'var(--brand-primary-light)', color: 'var(--brand-primary)', fontWeight: 600 }}>{l}</span>
                        ))}
                        <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: 'var(--radius-full)', background: 'var(--bg-subtle)', color: 'var(--text-secondary)', fontWeight: 500 }}>{selectedRecruiter.conversationStyle}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Launch buttons */}
              <div className="ch-launch-row">
                <div className="ch-launch-card">
                  <div className="ch-launch-card__header">
                    <Eye size={18} style={{ color: 'var(--brand-primary)' }} />
                    <div>
                      <h3>Screen Only</h3>
                      <p>AI evaluates all {totalResumes > 0 ? totalResumes : '…'} resumes against the JD. You review results before any calls are made.</p>
                    </div>
                  </div>
                  <Button variant="outline" size="lg" fullWidth icon={<Sparkles size={15} />} onClick={() => launch('screen_only')}>
                    Screen Only
                  </Button>
                </div>

                <div className="ch-launch-card ch-launch-card--primary">
                  <div className="ch-launch-card__header">
                    <Play size={18} style={{ color: 'var(--status-success-text)' }} />
                    <div>
                      <h3>Screen &amp; Start Calling</h3>
                      <p>AI screens, then immediately calls compatible candidates — no manual step required.</p>
                    </div>
                  </div>
                  <Button variant="primary" size="lg" fullWidth icon={<Play size={15} />} onClick={() => launch('screen_and_call')}>
                    Screen &amp; Start Calling
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* bottom spacer */}
          <div style={{ height: '60px' }} />
        </div>
      </div>

      {/* ══ MODALS ══ */}
      <Modal
        open={showSheetsModal}
        onClose={() => { setShowSheetsModal(false); setSheetsUrl(''); setSheetsUrlError(''); }}
        title="Connect Google Sheets"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowSheetsModal(false)}>Cancel</Button>
            <Button onClick={handleSheetsConnect} loading={fetchingSheets}>{fetchingSheets ? 'Importing…' : 'Import'}</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '4px 0' }}>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
            Paste the URL of a Google Sheet. Required columns: <strong>Name</strong>, <strong>Phone</strong>. Optional: Email, Experience, Location.
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
          <Input label="Name" placeholder="e.g. Ava, Aria, Riya" value={newRecruiterForm.name} onChange={e => setNewRecruiterForm(f => ({ ...f, name: e.target.value }))} error={recruiterErrors.name} />
          <Select label="Conversation style" options={[{ value: 'friendly_professional', label: 'Friendly Professional' }, { value: 'professional', label: 'Professional' }, { value: 'conversational', label: 'Conversational' }, { value: 'formal', label: 'Formal' }]} value={newRecruiterForm.conversationStyle} onChange={e => setNewRecruiterForm(f => ({ ...f, conversationStyle: e.target.value }))} />
          <Select label="Languages" options={[{ value: 'english', label: 'English' }, { value: 'english_hindi', label: 'English + Hindi' }, { value: 'english_hindi_marathi', label: 'English + Hindi + Marathi' }]} value={newRecruiterForm.languages} onChange={e => setNewRecruiterForm(f => ({ ...f, languages: e.target.value }))} />
          <Select label="Voice" options={[{ value: 'Warm & Clear', label: 'Warm & Clear' }, { value: 'Clear & Confident', label: 'Clear & Confident' }, { value: 'Natural & Clear', label: 'Natural & Clear' }, { value: 'Soft & Professional', label: 'Soft & Professional' }]} value={newRecruiterForm.voice} onChange={e => setNewRecruiterForm(f => ({ ...f, voice: e.target.value }))} />
          <Textarea label="Interview instructions" placeholder="Tell this AI Recruiter what to ask and screen for…" value={newRecruiterForm.interviewInstructions} onChange={e => setNewRecruiterForm(f => ({ ...f, interviewInstructions: e.target.value }))} rows={4} error={recruiterErrors.interviewInstructions} hint="e.g. Screen for experience, availability, and expected salary." />
        </div>
      </Modal>

      {injectStyles()}
    </div>
  );
};

function injectStyles() {
  if (typeof document !== 'undefined' && !document.getElementById('ch-v2-styles')) {
    const s = document.createElement('style');
    s.id = 'ch-v2-styles';
    s.textContent = `
/* ── Page shell ── */
.ch-page {
  display: flex;
  min-height: 100vh;
  background: var(--bg-app);
}

/* ── Left sticky sidebar ── */
.ch-sidenav {
  width: 220px;
  flex-shrink: 0;
  background: var(--bg-white);
  border-right: 1px solid var(--border-default);
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 20px 14px 32px;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.ch-sidenav__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  padding: 0;
  margin-bottom: 16px;
  font-family: var(--font-family);
  font-weight: 500;
  transition: color var(--transition-fast);
}

.ch-sidenav__back:hover { color: var(--text-primary); }

.ch-sidenav__title {
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  padding: 0 2px;
  margin-bottom: 8px;
}

.ch-sidenav__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ch-sidenav__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-md);
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-secondary);
  text-align: left;
  width: 100%;
  font-family: var(--font-family);
  transition: background var(--transition-fast), color var(--transition-fast);
}

.ch-sidenav__item:hover { background: var(--bg-hover); color: var(--text-primary); }
.ch-sidenav__item--active { background: var(--brand-primary-light); color: var(--brand-primary); font-weight: 600; }

.ch-sidenav__dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid var(--border-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
  color: var(--text-muted);
  background: var(--bg-white);
  transition: all var(--transition-fast);
}

.ch-sidenav__dot--active { border-color: var(--brand-primary); color: var(--brand-primary); background: var(--brand-primary-light); }
.ch-sidenav__dot--done { border-color: var(--status-success-text); color: var(--status-success-text); background: var(--status-success-bg); }

.ch-sidenav__summary {
  margin-top: 20px;
  padding: 12px;
  background: var(--bg-subtle);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.ch-sidenav__summary-item {
  font-size: 11px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ch-sidenav__summary-item strong {
  color: var(--text-primary);
}

/* ── Right scrollable body ── */
.ch-body {
  flex: 1;
  overflow-y: auto;
  min-width: 0;
}

.ch-form {
  max-width: 720px;
  margin: 0 auto;
  padding: 32px 40px 0;
}

/* ── Section ── */
.ch-section {
  scroll-margin-top: 24px;
}

.ch-section__header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 20px;
}

.ch-section__num {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--brand-primary-border);
  background: var(--brand-primary-light);
  color: var(--brand-primary);
  font-size: var(--font-size-sm);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.ch-section__title {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.2px;
  margin-bottom: 3px;
}

.ch-section__sub {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: 1.5;
}

.ch-section__body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-left: 46px;
}

.ch-divider {
  height: 1px;
  background: var(--border-default);
  margin: 28px 0;
}

.ch-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

/* ── Toggle buttons (Paste/Upload mode selectors) ── */
.ch-toggle-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.ch-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 16px;
  border: 1.5px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-white);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  font-family: var(--font-family);
  transition: all var(--transition-fast);
}

.ch-toggle-btn:hover:not(:disabled) {
  border-color: var(--brand-primary-border);
  color: var(--brand-primary);
  background: var(--brand-primary-light);
}

.ch-toggle-btn--active {
  border-color: var(--brand-primary);
  background: var(--brand-primary-light);
  color: var(--brand-primary);
  font-weight: 600;
}

.ch-toggle-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

/* ── Status pills ── */
.ch-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-default);
  background: var(--bg-subtle);
  color: var(--text-secondary);
  width: fit-content;
}

.ch-status-pill--success {
  background: var(--status-success-bg);
  border-color: var(--status-success-border);
  color: var(--status-success-text);
}

/* ── File chip ── */
.ch-file-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--brand-primary-light);
  border: 1px solid var(--brand-primary-border);
  border-radius: var(--radius-md);
}

.ch-file-chip__name {
  flex: 1;
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--brand-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ch-file-chip__remove {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  padding: 2px;
  border-radius: 4px;
  transition: color var(--transition-fast);
}

.ch-file-chip__remove:hover { color: var(--status-error-text); }

/* ── Drop zone ── */
.ch-drop-zone {
  border: 2px dashed var(--border-default);
  border-radius: var(--radius-md);
  padding: 28px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  background: var(--bg-white);
  transition: border-color var(--transition-fast), background var(--transition-fast);
  font-family: var(--font-family);
  text-align: center;
}

.ch-drop-zone:hover, .ch-drop-zone--drag {
  border-color: var(--brand-primary);
  background: var(--brand-primary-light);
}

.ch-drop-zone--sheets:hover { border-color: #0f9d58; background: #ecfdf5; }

.ch-drop-zone--inline {
  padding: 20px 16px;
}

.ch-drop-zone__icon {
  color: var(--text-tertiary);
  margin-bottom: 2px;
}

.ch-drop-zone--drag .ch-drop-zone__icon { color: var(--brand-primary); }

.ch-drop-zone__title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.ch-drop-zone__sub {
  font-size: 11px;
  color: var(--text-muted);
}

/* ── Resume list ── */
.ch-resume-list {
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--bg-white);
}

.ch-resume-list__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-default);
  background: var(--bg-subtle);
}

.ch-resume-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
  padding: 10px 14px;
}

.ch-resume-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-primary);
  padding: 4px 6px;
  border-radius: var(--radius-xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Note block ── */
.ch-note {
  background: var(--bg-subtle);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: 1.5;
}

.ch-note__row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

/* ── Candidates table ── */
.ch-candidates-table {
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.ch-candidates-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.ch-candidates-table th {
  background: var(--bg-subtle);
  padding: 7px 12px;
  text-align: left;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-default);
}

.ch-candidates-table td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-primary);
}

.ch-candidates-table tr:last-child td { border-bottom: none; }

/* ── Error ── */
.ch-error {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-sm);
  color: var(--status-error-text);
  padding: 8px 12px;
  background: var(--status-error-bg);
  border: 1px solid var(--status-error-border);
  border-radius: var(--radius-sm);
}

/* ── Recruiter grid ── */
.ch-recruiter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

/* ── Instructions ── */
.ch-instructions {
  padding: 14px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
}

/* ── Recruiter preview ── */
.ch-recruiter-preview {
  padding: 16px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
}

/* ── Summary strip ── */
.ch-summary-strip {
  display: flex;
  gap: 0;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--bg-white);
}

.ch-summary-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 12px 14px;
  border-right: 1px solid var(--border-default);
  min-width: 0;
}

.ch-summary-item:last-child { border-right: none; }

.ch-summary-item__label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-bottom: 3px;
}

.ch-summary-item__value {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Launch cards ── */
.ch-launch-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.ch-launch-card {
  border: 1.5px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--bg-white);
}

.ch-launch-card--primary {
  border-color: var(--brand-primary-border);
  background: var(--brand-primary-light);
}

.ch-launch-card__header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.ch-launch-card__header h3 {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.ch-launch-card__header p {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  line-height: 1.5;
}

/* ── Responsive ── */
@media (max-width: 900px) {
  .ch-sidenav { display: none; }
  .ch-form { padding: 24px 20px 0; }
  .ch-launch-row { grid-template-columns: 1fr; }
  .ch-row { grid-template-columns: 1fr; }
  .ch-resume-grid { grid-template-columns: 1fr; }
}
    `;
    document.head.appendChild(s);
  }
  return null;
}

export default CreateHiring;
