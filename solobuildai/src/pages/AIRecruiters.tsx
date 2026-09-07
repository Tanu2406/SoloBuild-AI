import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Bot } from 'lucide-react';
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
        <div className="recruiters-grid">
          {recruiters.map(recruiter => (
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

const style = document.createElement('style');
style.textContent = `
.recruiters-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 16px; }
.recruiter-detail-card { background: var(--bg-white); border: 1px solid var(--border-default); border-radius: var(--radius-lg); padding: 24px; display: flex; flex-direction: column; gap: 20px; transition: box-shadow var(--transition-fast); }
.recruiter-detail-card:hover { box-shadow: var(--shadow-sm); }
.rdc__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.rdc__identity { display: flex; align-items: center; gap: 14px; flex: 1; }
.rdc__info { display: flex; flex-direction: column; gap: 4px; }
.rdc__name { font-size: var(--font-size-xl); font-weight: 700; color: var(--text-primary); }
.rdc__desc { font-size: var(--font-size-sm); color: var(--text-secondary); line-height: 1.4; }
.rdc__actions { display: flex; gap: 4px; }
.rdc__attrs { display: flex; gap: 24px; flex-wrap: wrap; padding: 16px; background: var(--bg-subtle); border-radius: var(--radius-md); }
.rdc__attr { display: flex; flex-direction: column; gap: 3px; }
.rdc__attr-label { font-size: var(--font-size-xs); font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.04em; }
.rdc__attr-value { font-size: var(--font-size-sm); font-weight: 500; color: var(--text-primary); }
.rdc__instructions { display: flex; flex-direction: column; gap: 6px; padding-top: 4px; border-top: 1px solid var(--border-default); }
.rdc__instructions-label { font-size: var(--font-size-xs); font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.04em; }
.rdc__instructions-text { font-size: var(--font-size-sm); color: var(--text-secondary); line-height: 1.6; }
.recruiter-form { display: flex; flex-direction: column; gap: 18px; }
@media (max-width: 640px) { .recruiters-grid { grid-template-columns: 1fr; } }
`;
if (typeof document !== 'undefined' && !document.getElementById('recruiters-page-styles')) {
  style.id = 'recruiters-page-styles';
  document.head.appendChild(style);
}
