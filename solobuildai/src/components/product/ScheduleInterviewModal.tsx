import React, { useState } from 'react';
import { Calendar, Video } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input, Select, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { useAppStore } from '../../store/appStore';
import type { Candidate, Interview, InterviewType } from '../../types';

interface ScheduleInterviewModalProps {
  open: boolean;
  onClose: () => void;
  candidate: Candidate | null;
}

const INTERVIEW_TYPE_OPTIONS = [
  { value: 'technical',   label: 'Technical Interview' },
  { value: 'hr',          label: 'HR Interview' },
  { value: 'managerial',  label: 'Managerial Round' },
  { value: 'final',       label: 'Final Round' },
  { value: 'panel',       label: 'Panel Interview' },
];

const TIME_OPTIONS = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
  '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
].map(t => ({ value: t, label: t }));

const INTERVIEWER_OPTIONS = [
  { value: 'Priya Menon (Tech Lead)',    label: 'Priya Menon — Tech Lead' },
  { value: 'Anil Sharma (Engineering)',  label: 'Anil Sharma — Engineering Manager' },
  { value: 'Sunita Kapoor (HR)',         label: 'Sunita Kapoor — HR Manager' },
  { value: 'Rajiv Bose (Director)',      label: 'Rajiv Bose — Director' },
  { value: 'Meera Iyer (Panel)',         label: 'Meera Iyer — Panel Lead' },
];

// Get tomorrow's date as default
function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({
  open, onClose, candidate,
}) => {
  const { dispatch } = useAppStore();
  const { showToast } = useToast();

  const [interviewType, setInterviewType] = useState<string>('technical');
  const [scheduledDate, setScheduledDate] = useState(tomorrow());
  const [scheduledTime, setScheduledTime] = useState('10:00 AM');
  const [interviewer, setInterviewer] = useState(INTERVIEWER_OPTIONS[0].value);
  const [meetingLink, setMeetingLink] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!candidate) return null;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!scheduledDate) e.date = 'Please select a date';
    if (!interviewer)   e.interviewer = 'Please select an interviewer';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const now = new Date().toISOString();
    const interview: Interview = {
      id: `iv_${Date.now()}`,
      candidateId: candidate.id,
      candidateName: candidate.name,
      hiringId: candidate.hiringId || '',
      hiringTitle: candidate.hiringTitle || '',
      interviewType: interviewType as InterviewType,
      status: 'upcoming',
      scheduledDate,
      scheduledTime,
      interviewer,
      meetingLink: meetingLink.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    // Save interview
    dispatch({ type: 'SCHEDULE_INTERVIEW', payload: interview });

    // Update candidate status
    dispatch({
      type: 'UPDATE_CANDIDATE',
      payload: { id: candidate.id, updates: { status: 'interview_scheduled' } },
    });

    // Log activity
    const dateLabel = new Date(scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    dispatch({
      type: 'ADD_ACTIVITY',
      payload: {
        id: `act_iv_${Date.now()}`,
        type: 'interview_scheduled',
        candidateName: candidate.name,
        hiringTitle: candidate.hiringTitle || '',
        description: `${INTERVIEW_TYPE_OPTIONS.find(o => o.value === interviewType)?.label} scheduled for ${dateLabel} at ${scheduledTime}`,
        timestamp: now,
        timeAgo: 'just now',
      },
    });

    showToast(`Interview scheduled for ${candidate.name} on ${dateLabel}`, 'success');
    onClose();

    // Reset form
    setInterviewType('technical');
    setScheduledDate(tomorrow());
    setScheduledTime('10:00 AM');
    setInterviewer(INTERVIEWER_OPTIONS[0].value);
    setMeetingLink('');
    setNotes('');
    setErrors({});
  };

  const typeLabel = INTERVIEW_TYPE_OPTIONS.find(o => o.value === interviewType)?.label || '';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Schedule Interview — ${candidate.name}`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button icon={<Calendar size={14} />} onClick={handleSave}>
            Confirm Schedule
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px 0' }}>
        {/* Candidate summary */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 14px', background: 'var(--bg-subtle)',
          border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)',
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'var(--brand-primary)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'var(--font-size-sm)', fontWeight: 700, flexShrink: 0,
          }}>
            {candidate.name[0].toUpperCase()}
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 'var(--font-size-base)', color: 'var(--text-primary)' }}>
              {candidate.name}
            </p>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
              {candidate.hiringTitle}{candidate.experience ? ` · ${candidate.experience}` : ''}
            </p>
          </div>
        </div>

        {/* Interview type */}
        <Select
          label="Interview type"
          options={INTERVIEW_TYPE_OPTIONS}
          value={interviewType}
          onChange={e => setInterviewType(e.target.value)}
        />

        {/* Date + Time row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Input
            label="Interview date"
            type="date"
            value={scheduledDate}
            onChange={e => { setScheduledDate(e.target.value); setErrors(er => ({ ...er, date: '' })); }}
            error={errors.date}
            leftIcon={<Calendar size={14} />}
          />
          <Select
            label="Time"
            options={TIME_OPTIONS}
            value={scheduledTime}
            onChange={e => setScheduledTime(e.target.value)}
          />
        </div>

        {/* Interviewer */}
        <Select
          label="Interviewer"
          options={INTERVIEWER_OPTIONS}
          value={interviewer}
          onChange={e => { setInterviewer(e.target.value); setErrors(er => ({ ...er, interviewer: '' })); }}
          error={errors.interviewer}
        />

        {/* Meeting link */}
        <Input
          label="Meeting link"
          placeholder="https://meet.google.com/… or Zoom URL"
          value={meetingLink}
          onChange={e => setMeetingLink(e.target.value)}
          leftIcon={<Video size={14} />}
          hint="Optional — will be shared with the candidate"
        />

        {/* Notes */}
        <Textarea
          label="Interview notes"
          placeholder={`e.g. Focus on ${typeLabel.toLowerCase()} topics, system design, problem-solving…`}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          hint="Optional — visible to the interviewer"
        />
      </div>
    </Modal>
  );
};
