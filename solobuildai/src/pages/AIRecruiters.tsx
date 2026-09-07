import React, { useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { PageHeader } from '../components/ui/Layout';
import { Button } from '../components/ui/Button';
import { Input, Textarea, Select } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { mockAIRecruiters } from '../mock/data';
import type { AIRecruiter } from '../types';

const AIRecruiters: React.FC = () => {
  const { showToast } = useToast();
  const [recruiters] = React.useState<AIRecruiter[]>(mockAIRecruiters);
  const [editingRecruiter, setEditingRecruiter] = useState<AIRecruiter | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleEdit = (recruiter: AIRecruiter) => {
    setEditingRecruiter(recruiter);
    setShowModal(true);
  };

  const handleSave = () => {
    showToast('AI Recruiter updated', 'success');
    setShowModal(false);
  };

  return (
    <div className="page-content animate-fade-in">
      <PageHeader
        title="AI Recruiters"
        subtitle="Your AI Recruiters conduct the initial screening conversations with candidates."
        actions={
          <Button icon={<Plus size={16} />} onClick={() => { setEditingRecruiter(null); setShowModal(true); }}>
            Create AI Recruiter
          </Button>
        }
      />

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
              <Button variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => handleEdit(recruiter)}>
                Edit
              </Button>
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

      {/* Edit/Create Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingRecruiter ? `Edit ${editingRecruiter.name}` : 'Create AI Recruiter'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </>
        }
      >
        <div className="recruiter-form">
          <Input
            label="Name"
            defaultValue={editingRecruiter?.name}
            placeholder="e.g. Ava, Aria, Riya"
          />
          <Select
            label="Conversation style"
            options={[
              { value: 'friendly_professional', label: 'Friendly Professional' },
              { value: 'professional', label: 'Professional' },
              { value: 'conversational', label: 'Conversational' },
              { value: 'formal', label: 'Formal' },
            ]}
            defaultValue={editingRecruiter?.conversationStyle}
          />
          <Select
            label="Primary language"
            options={[
              { value: 'english', label: 'English' },
              { value: 'english_hindi', label: 'English + Hindi' },
              { value: 'english_hindi_marathi', label: 'English + Hindi + Marathi' },
            ]}
          />
          <Textarea
            label="Interview instructions"
            placeholder="Describe what this AI Recruiter should ask and how it should conduct conversations..."
            defaultValue={editingRecruiter?.interviewInstructions}
            rows={5}
            hint="Tell the AI Recruiter what to screen for, what questions to ask, and how to handle responses."
          />
        </div>
      </Modal>
    </div>
  );
};

export default AIRecruiters;

const style = document.createElement('style');
style.textContent = `
.recruiters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 16px;
}

.recruiter-detail-card {
  background: var(--bg-white);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  transition: box-shadow var(--transition-fast);
}
.recruiter-detail-card:hover {
  box-shadow: var(--shadow-sm);
}

.rdc__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.rdc__identity {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
}

.rdc__info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rdc__name {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text-primary);
}

.rdc__desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: 1.4;
}

.rdc__attrs {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  padding: 16px;
  background: var(--bg-subtle);
  border-radius: var(--radius-md);
}

.rdc__attr {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.rdc__attr-label {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.rdc__attr-value {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-primary);
}

.rdc__instructions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 4px;
  border-top: 1px solid var(--border-default);
}

.rdc__instructions-label {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.rdc__instructions-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: 1.6;
}

.recruiter-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

@media (max-width: 640px) {
  .recruiters-grid { grid-template-columns: 1fr; }
}
`;
if (typeof document !== 'undefined' && !document.getElementById('recruiters-page-styles')) {
  style.id = 'recruiters-page-styles';
  document.head.appendChild(style);
}
