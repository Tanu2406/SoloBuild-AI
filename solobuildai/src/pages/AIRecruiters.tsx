import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Bot, Search, X } from 'lucide-react';
import { PageHeader } from '../components/ui/Layout';
import { Button } from '../components/ui/Button';
import { Input, Textarea, Select } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';
import { useAppStore, useRecruiters } from '../store/appStore';
import type { AIRecruiter } from '../types';

const AVATAR_COLORS = ['#2563eb', '#0891b2', '#7c3aed', '#059669', '#dc2626', '#d97706'];

type RecruiterForm = {
  name: string;
  conversationStyle: string;
  languages: string;
  voice: string;
  interviewInstructions: string;
};

const defaultForm: RecruiterForm = {
  name: '',
  conversationStyle: 'friendly_professional',
  languages: 'english_hindi',
  voice: 'Warm & Clear',
  interviewInstructions: '',
};

const styleOptions = [
  { value: 'friendly_professional', label: 'Friendly Professional' },
  { value: 'professional', label: 'Professional' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'formal', label: 'Formal' },
];

const langOptions = [
  { value: 'english', label: 'English' },
  { value: 'english_hindi', label: 'English + Hindi' },
  { value: 'english_hindi_marathi', label: 'English + Hindi + Marathi' },
];

const voiceOptions = [
  { value: 'Warm & Clear', label: 'Warm & Clear' },
  { value: 'Clear & Confident', label: 'Clear & Confident' },
  { value: 'Natural & Clear', label: 'Natural & Clear' },
  { value: 'Soft & Professional', label: 'Soft & Professional' },
];

const langMap: Record<string, string[]> = {
  english: ['English'],
  english_hindi: ['English', 'Hindi'],
  english_hindi_marathi: ['English', 'Hindi', 'Marathi'],
};

const styleLabel: Record<string, string> = {
  friendly_professional: 'Friendly Professional',
  professional: 'Professional',
  conversational: 'Conversational',
  formal: 'Formal',
};

const AIRecruiters: React.FC = () => {
  const { showToast } = useToast();
  const { dispatch } = useAppStore();
  const recruiters = useRecruiters();

  const [editingRecruiter, setEditingRecruiter] = useState<AIRecruiter | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<RecruiterForm>(defaultForm);
  const [errors, setErrors] = useState<Partial<RecruiterForm>>({});

  // Search & filter state
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState('all');
  const [styleFilter, setStyleFilter] = useState('all');

  const openCreate = () => {
    setEditingRecruiter(null);
    setForm(defaultForm);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (r: AIRecruiter) => {
    setEditingRecruiter(r);
    // Map back from recruiter to form values
    const langKey = Object.entries(langMap).find(([, v]) => v.join(',') === r.languages.join(','))?.[0] || 'english_hindi';
    const styleKey = Object.entries(styleLabel).find(([, v]) => v === r.conversationStyle)?.[0] || 'professional';
    setForm({
      name: r.name,
      conversationStyle: styleKey,
      languages: langKey,
      voice: r.voice,
      interviewInstructions: r.interviewInstructions || '',
    });
    setErrors({});
    setShowModal(true);
  };

  const handleSave = () => {
    const e: Partial<RecruiterForm> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.interviewInstructions.trim()) e.interviewInstructions = 'Interview instructions are required';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    if (editingRecruiter) {
      dispatch({
        type: 'UPDATE_RECRUITER',
        payload: {
          id: editingRecruiter.id,
          updates: {
            name: form.name.trim(),
            conversationStyle: styleLabel[form.conversationStyle] || form.conversationStyle,
            languages: langMap[form.languages] || ['English'],
            voice: form.voice,
            interviewInstructions: form.interviewInstructions.trim(),
            description: `${styleLabel[form.conversationStyle]} tone.`,
            avatarInitial: form.name[0].toUpperCase(),
          },
        },
      });
      showToast(`${form.name} updated`, 'success');
    } else {
      const newRecruiter: AIRecruiter = {
        id: `ar_${Date.now()}`,
        name: form.name.trim(),
        description: `${styleLabel[form.conversationStyle]} tone.`,
        languages: langMap[form.languages] || ['English'],
        voice: form.voice,
        conversationStyle: styleLabel[form.conversationStyle] || form.conversationStyle,
        interviewInstructions: form.interviewInstructions.trim(),
        avatarInitial: form.name[0].toUpperCase(),
        avatarColor: AVATAR_COLORS[recruiters.length % AVATAR_COLORS.length],
      };
      dispatch({ type: 'CREATE_RECRUITER', payload: newRecruiter });
      showToast(`AI Recruiter "${form.name}" created`, 'success');
    }
    setShowModal(false);
  };

  const handleDelete = (r: AIRecruiter) => {
    if (confirm(`Delete AI Recruiter "${r.name}"? This cannot be undone.`)) {
      dispatch({ type: 'DELETE_RECRUITER', payload: r.id });
      showToast(`${r.name} deleted`, 'info');
    }
  };

  // Filter recruiters based on search + dropdowns
  const filteredRecruiters = recruiters.filter(r => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      r.name.toLowerCase().includes(q) ||
      r.conversationStyle.toLowerCase().includes(q) ||
      r.languages.some(l => l.toLowerCase().includes(q)) ||
      r.voice.toLowerCase().includes(q);

    const matchesLang =
      langFilter === 'all' ||
      r.languages.some(l => l.toLowerCase().includes(langFilter.toLowerCase()));

    const matchesStyle =
      styleFilter === 'all' ||
      r.conversationStyle.toLowerCase().includes(styleFilter.toLowerCase());

    return matchesSearch && matchesLang && matchesStyle;
  });

  // Unique languages across all recruiters for the filter dropdown
  const allLanguages = Array.from(new Set(recruiters.flatMap(r => r.languages)));
  const allStyles = Array.from(new Set(recruiters.map(r => r.conversationStyle)));

  const hasActiveFilters = search || langFilter !== 'all' || styleFilter !== 'all';

  return (
    <div className="page-content animate-fade-in">
      <PageHeader
        title="AI Recruiters"
        subtitle="Your AI Recruiters conduct the initial screening conversations with candidates."
        actions={
          <Button icon={<Plus size={16} />} onClick={openCreate}>
            Create AI Recruiter
          </Button>
        }
      />

      {recruiters.length === 0 ? (
        <EmptyState
          icon={<Bot size={24} />}
          title="No AI Recruiters yet"
          description="Create your first AI Recruiter to start screening candidates automatically."
          action={{ label: 'Create AI Recruiter', onClick: openCreate }}
        />
      ) : (
        <>
          {/* Search + filter bar — only shown when there are recruiters */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
              flexWrap: 'wrap',
            }}
          >
            {/* Search input */}
            <div style={{ flex: '1', minWidth: '200px', maxWidth: '320px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--bg-white)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  padding: '6px 10px',
                  transition: 'border-color var(--transition-fast)',
                }}
              >
                <Search size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search recruiters…"
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--text-primary)',
                    background: 'transparent',
                    fontFamily: 'var(--font-family)',
                  }}
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', padding: 0 }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Language filter */}
            <select
              value={langFilter}
              onChange={e => setLangFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${langFilter !== 'all' ? 'var(--brand-primary)' : 'var(--border-default)'}`,
                fontSize: 'var(--font-size-xs)',
                color: langFilter !== 'all' ? 'var(--brand-primary)' : 'var(--text-primary)',
                background: langFilter !== 'all' ? 'var(--brand-primary-light)' : 'var(--bg-white)',
                cursor: 'pointer',
              }}
              aria-label="Filter by language"
            >
              <option value="all">All Languages</option>
              {allLanguages.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>

            {/* Style filter */}
            <select
              value={styleFilter}
              onChange={e => setStyleFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${styleFilter !== 'all' ? 'var(--brand-primary)' : 'var(--border-default)'}`,
                fontSize: 'var(--font-size-xs)',
                color: styleFilter !== 'all' ? 'var(--brand-primary)' : 'var(--text-primary)',
                background: styleFilter !== 'all' ? 'var(--brand-primary-light)' : 'var(--bg-white)',
                cursor: 'pointer',
              }}
              aria-label="Filter by conversation style"
            >
              <option value="all">All Styles</option>
              {allStyles.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={() => { setSearch(''); setLangFilter('all'); setStyleFilter('all'); }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 500,
                  border: '1px solid var(--border-default)',
                  background: 'var(--bg-white)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                <X size={11} /> Clear
              </button>
            )}
          </div>

          {filteredRecruiters.length === 0 ? (
            <EmptyState
              icon={<Bot size={24} />}
              title="No recruiters match your filters"
              description="Try adjusting your search or clearing the filters."
              action={{ label: 'Clear filters', onClick: () => { setSearch(''); setLangFilter('all'); setStyleFilter('all'); } }}
            />
          ) : (
            <div className="recruiters-grid">
              {filteredRecruiters.map(recruiter => (
                <div key={recruiter.id} className="recruiter-detail-card">
                  <div className="rdc__header">
                    <div className="rdc__identity">
                      <Avatar name={recruiter.name} size="lg" color={recruiter.avatarColor} />
                      <div className="rdc__info">
                        <h3 className="rdc__name">{recruiter.name}</h3>
                        <p className="rdc__desc">{recruiter.description}</p>
                      </div>
                    </div>
                    <div className="rdc__actions">
                      <Button variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => openEdit(recruiter)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => handleDelete(recruiter)} />
                    </div>
                  </div>

                  <div className="rdc__attrs">
                    <div className="rdc__attr">
                      <span className="rdc__attr-label">Languages</span>
                      <span className="rdc__attr-value">{recruiter.languages.join(', ')}</span>
                    </div>
                    <div className="rdc__attr">
                      <span className="rdc__attr-label">Style</span>
                      <span className="rdc__attr-value">{recruiter.conversationStyle}</span>
                    </div>
                    <div className="rdc__attr">
                      <span className="rdc__attr-label">Voice</span>
                      <span className="rdc__attr-value">{recruiter.voice}</span>
                    </div>
                  </div>

                  {recruiter.interviewInstructions && (
                    <div className="rdc__instructions">
                      <span className="rdc__instructions-label">Interview instructions</span>
                      <p className="rdc__instructions-text">{recruiter.interviewInstructions}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingRecruiter ? `Edit ${editingRecruiter.name}` : 'Create AI Recruiter'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingRecruiter ? 'Save changes' : 'Create'}</Button>
          </>
        }
      >
        <div className="recruiter-form">
          <Input
            label="Name"
            placeholder="e.g. Ava, Aria, Riya"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            error={errors.name}
          />
          <Select label="Conversation style" options={styleOptions} value={form.conversationStyle}
            onChange={e => setForm(f => ({ ...f, conversationStyle: e.target.value }))} />
          <Select label="Languages" options={langOptions} value={form.languages}
            onChange={e => setForm(f => ({ ...f, languages: e.target.value }))} />
          <Select label="Voice" options={voiceOptions} value={form.voice}
            onChange={e => setForm(f => ({ ...f, voice: e.target.value }))} />
          <Textarea
            label="Interview instructions"
            placeholder="Tell this AI Recruiter what to ask, what to screen for, and how to conduct the conversation..."
            value={form.interviewInstructions}
            onChange={e => setForm(f => ({ ...f, interviewInstructions: e.target.value }))}
            rows={4}
            error={errors.interviewInstructions}
            hint="e.g. Screen for experience, ask about availability and expected salary."
          />
        </div>
      </Modal>
    </div>
  );
};

export default AIRecruiters;

