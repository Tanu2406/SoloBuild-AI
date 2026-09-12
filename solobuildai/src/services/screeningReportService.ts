// ============================================================
// Screening Report Service
// Generates full CandidateScreeningReportData for any candidate.
// All data is derived from the candidate's existing store fields
// plus role-specific mock assessment data keyed by candidate id.
// When the backend is ready, replace getReport() with an API call:
//   GET /screening-reports/{candidateId}
// ============================================================

import type {
  Candidate,
  CandidateScreeningReportData,
  ResumeScreeningReport,
  CallAssessmentReport,
  CapabilityAnalysis,
  Competency,
  SkillGroup,
  CallDimension,
  EvidenceItem,
  AIHireLabel,
} from '../types';

// ─── Helpers ────────────────────────────────────────────────

function labelForScore(score: number): string {
  if (score >= 80) return 'Strong Match';
  if (score >= 60) return 'Moderate Match';
  return 'Not a Match';
}

function hireLabelText(label: AIHireLabel): string {
  if (label === 'strong_hire') return 'Strong Hire';
  if (label === 'hire') return 'Hire';
  if (label === 'consider') return 'Consider';
  return 'No Hire';
}

// ─── Role-specific assessment data ──────────────────────────
// Keyed by candidateId. Provides the rich per-candidate data
// that will eventually come from the AI pipeline backend.

interface CandidateAssessmentOverride {
  resumeSummary: string;
  resumeEvidence: EvidenceItem[];
  callStrengths: string[];
  callConcerns: string[];
  callRecommendedStep: string;
  callDimensions: CallDimension[];
  callEvidence: EvidenceItem[];
  competencies: Competency[];
  skillGroups: SkillGroup[];
  radarSummary: string;
  overallSummary: string;
  overallStrengths: string[];
  overallConcerns: string[];
  overallNextStep: string;
}

const assessmentOverrides: Record<string, CandidateAssessmentOverride> = {
  // ─── c3: Rahul Mehta — Sales Executive — Strong Hire ───
  c3: {
    resumeSummary:
      'Rahul brings 5 years of progressive B2B sales experience with a consistent track record in enterprise account management. His MBA from IIM Indore and Salesforce CRM proficiency are strong differentiators for this role. No critical gaps identified against the JD.',
    resumeEvidence: [
      { source: 'resume', label: '5 years B2B Sales', detail: 'Consistent enterprise sales background across mid-to-large accounts' },
      { source: 'resume', label: 'MBA, IIM Indore', detail: 'Strong academic pedigree relevant to strategic sales roles' },
      { source: 'resume', label: 'Salesforce CRM', detail: 'Directly meets the CRM requirement stated in the JD' },
      { source: 'resume', label: 'Enterprise Accounts', detail: 'Managed accounts >₹50L annually per resume' },
    ],
    callStrengths: [
      'Articulate and structured in explaining deal cycles',
      'Demonstrated clear understanding of enterprise procurement processes',
      'Showed genuine enthusiasm for the product and market',
      'Salary expectation (₹10L) is within the defined budget range',
      'Immediate availability — no notice period required',
    ],
    callConcerns: [
      'Limited exposure to SaaS-specific sales motions',
    ],
    callRecommendedStep: 'Candidate is a strong fit. Recommend proceeding directly to a managerial round to assess leadership potential.',
    callDimensions: [
      { name: 'Communication & Articulation', score: 9, maxScore: 10, notes: 'Spoke clearly, used structured storytelling throughout' },
      { name: 'Domain Knowledge — Sales', score: 9, maxScore: 10, notes: 'Deep knowledge of B2B sales cycles and objection handling' },
      { name: 'Motivation & Cultural Fit', score: 8, maxScore: 10, notes: 'Expressed clear reasons for wanting to move; aligned with company values' },
      { name: 'Negotiation & Closing', score: 9, maxScore: 10, notes: 'Provided strong examples of closing large deals' },
      { name: 'CRM & Tooling Proficiency', score: 9, maxScore: 10, notes: 'Demonstrated Salesforce usage in pipeline management' },
      { name: 'Availability & Logistics', score: 10, maxScore: 10, notes: 'Immediate joiner, salary aligned' },
    ],
    callEvidence: [
      { source: 'call', label: 'Demonstrated enterprise deal closure', detail: '"I closed a ₹45L deal at HDFC Life by mapping to their procurement cycle over 3 months."' },
      { source: 'call', label: 'Salary expectation confirmed', detail: 'Candidate confirmed ₹10L CTC — within budget range of ₹8–11L' },
      { source: 'call', label: 'Immediate availability confirmed', detail: 'Serving no notice period. Can join within 1 week.' },
    ],
    competencies: [
      { name: 'B2B Sales Execution', score: 92, importance: 'core', strength: 'strong' },
      { name: 'Enterprise Account Management', score: 88, importance: 'core', strength: 'strong' },
      { name: 'CRM & Pipeline Management', score: 90, importance: 'core', strength: 'strong' },
      { name: 'Negotiation & Closing', score: 87, importance: 'core', strength: 'strong' },
      { name: 'Communication & Presentation', score: 85, importance: 'core', strength: 'strong' },
      { name: 'SaaS Sales Knowledge', score: 52, importance: 'nice_to_have', strength: 'moderate' },
    ],
    skillGroups: [
      {
        category: 'Sales Competencies',
        skills: [
          { name: 'B2B Sales', score: 9, strength: 'strong', source: 'call' },
          { name: 'Negotiation', score: 9, strength: 'strong', source: 'call' },
          { name: 'Account Management', score: 8, strength: 'strong', source: 'resume' },
          { name: 'Pipeline Management', score: 8, strength: 'strong', source: 'resume' },
          { name: 'Cold Outreach', score: 7, strength: 'moderate', source: 'resume' },
        ],
      },
      {
        category: 'Communication',
        skills: [
          { name: 'Verbal Articulation', score: 9, strength: 'strong', source: 'call' },
          { name: 'Structured Storytelling', score: 8, strength: 'strong', source: 'call' },
          { name: 'Stakeholder Communication', score: 8, strength: 'strong', source: 'call' },
          { name: 'Written Communication', score: 7, strength: 'moderate', source: 'resume' },
        ],
      },
      {
        category: 'Tools & Technology',
        skills: [
          { name: 'Salesforce CRM', score: 9, strength: 'strong', source: 'resume' },
          { name: 'Excel / Reporting', score: 7, strength: 'moderate', source: 'resume' },
          { name: 'SaaS Tools', score: 5, strength: 'moderate', source: 'resume' },
        ],
      },
    ],
    radarSummary:
      'Rahul shows exceptional sales and communication skills with strong technical coverage of the role requirements. The only minor gap is SaaS-specific experience, which is a nice-to-have.',
    overallSummary:
      'Rahul Mehta is a highly qualified Sales Executive with a proven enterprise background and immediate availability. Resume and call assessment both strongly support moving him forward.',
    overallStrengths: [
      'Proven enterprise B2B sales track record (5 years)',
      'Immediate availability — no notice period',
      'Excellent communication and deal articulation',
      'Salary aligned with budget',
    ],
    overallConcerns: ['Limited SaaS-specific sales experience'],
    overallNextStep: 'Schedule a managerial round. Strong hire recommendation.',
  },

  // ─── c5: Vikram Joshi — Frontend Developer — Strong Hire ───
  c5: {
    resumeSummary:
      'Vikram is a senior-level frontend engineer with 6 years of experience in React, TypeScript, Node.js and GraphQL. His IIT Bombay background and team leadership experience make him a strong technical and leadership candidate. All core JD requirements are met.',
    resumeEvidence: [
      { source: 'resume', label: '6 years React / TypeScript', detail: 'Senior-level proficiency directly matching JD requirement' },
      { source: 'resume', label: 'B.Tech, IIT Bombay', detail: 'Strong academic foundation in computer science' },
      { source: 'resume', label: 'Node.js & GraphQL', detail: 'Full-stack exposure, meets all JD requirements including the "plus" criteria' },
      { source: 'resume', label: 'Team Leadership', detail: 'Led teams of 3–4, relevant for senior individual contributor role' },
    ],
    callStrengths: [
      'Demonstrated deep React architecture knowledge during the call',
      'Articulated TypeScript generics usage with concrete examples',
      'Showed ownership mindset — described shipping a critical feature alone',
      'Immediate joiner with no notice period',
      'Salary expectation (₹18L) is within senior budget range',
    ],
    callConcerns: [
      'Limited experience with backend infrastructure at scale',
      'Could expand on mentoring approach for junior developers',
    ],
    callRecommendedStep: 'Proceed to technical interview with Priya Menon. Focus on system design and large-scale architecture.',
    callDimensions: [
      { name: 'React & Component Architecture', score: 10, maxScore: 10, notes: 'Demonstrated advanced patterns — custom hooks, portals, render optimization' },
      { name: 'TypeScript Proficiency', score: 9, maxScore: 10, notes: 'Solid grasp of generics and strict typing; one minor gap in utility types' },
      { name: 'System Design (Frontend)', score: 8, maxScore: 10, notes: 'Good understanding of micro-frontend trade-offs' },
      { name: 'Backend & API Integration', score: 6, maxScore: 10, notes: 'Comfortable with REST and GraphQL but limited at infra scale', verifiedGap: 'Candidate was uncertain about distributed caching strategies when probed.' },
      { name: 'Communication & Clarity', score: 9, maxScore: 10, notes: 'Very clear, structured responses with good examples' },
      { name: 'Team & Leadership', score: 8, maxScore: 10, notes: 'Described leading 3 engineers on a product squad effectively' },
    ],
    callEvidence: [
      { source: 'call', label: 'Deep React knowledge demonstrated', detail: '"I built a custom event-sourcing hook that syncs optimistic UI state with the server — reduced latency perception by 40%."' },
      { source: 'call', label: 'Verified gap — backend scale', detail: '"I haven\'t worked with Redis clustering directly — we had a dedicated backend team for that."' },
      { source: 'call', label: 'Immediate availability', detail: 'Serving no notice period. Available from next Monday.' },
    ],
    competencies: [
      { name: 'React & UI Architecture', score: 97, importance: 'core', strength: 'strong' },
      { name: 'TypeScript & Type Safety', score: 90, importance: 'core', strength: 'strong' },
      { name: 'Node.js & API Design', score: 78, importance: 'core', strength: 'strong' },
      { name: 'GraphQL', score: 85, importance: 'core', strength: 'strong' },
      { name: 'Frontend System Design', score: 80, importance: 'core', strength: 'strong' },
      { name: 'Team Leadership', score: 72, importance: 'nice_to_have', strength: 'moderate' },
    ],
    skillGroups: [
      {
        category: 'Frontend Engineering',
        skills: [
          { name: 'React', score: 10, strength: 'strong', source: 'call' },
          { name: 'TypeScript', score: 9, strength: 'strong', source: 'call' },
          { name: 'CSS / Styling Systems', score: 8, strength: 'strong', source: 'resume' },
          { name: 'Redux / State Management', score: 8, strength: 'strong', source: 'resume' },
          { name: 'GraphQL', score: 9, strength: 'strong', source: 'call' },
        ],
      },
      {
        category: 'Backend & Infrastructure',
        skills: [
          { name: 'Node.js', score: 8, strength: 'strong', source: 'resume' },
          { name: 'REST API Design', score: 7, strength: 'moderate', source: 'resume' },
          { name: 'AWS (S3, EC2)', score: 6, strength: 'moderate', source: 'resume' },
          { name: 'Distributed Systems', score: 4, strength: 'weak', source: 'call' },
        ],
      },
      {
        category: 'Cognitive & Communication',
        skills: [
          { name: 'Articulation', score: 9, strength: 'strong', source: 'call' },
          { name: 'Structured Thinking', score: 9, strength: 'strong', source: 'call' },
          { name: 'Problem Solving', score: 8, strength: 'strong', source: 'call' },
          { name: 'Mentoring / Leadership', score: 7, strength: 'moderate', source: 'call' },
        ],
      },
    ],
    radarSummary:
      'Vikram shows outstanding frontend engineering capability and clear, structured communication. The only gap is backend infrastructure at scale, which is non-critical for this frontend role.',
    overallSummary:
      'Vikram Joshi is a high-caliber senior frontend engineer. Both resume and call assessment confirm exceptional technical depth. Recommended without reservation for the technical interview stage.',
    overallStrengths: [
      'Exceptional React and TypeScript proficiency',
      'Strong system design thinking (frontend)',
      'Clear, articulate communicator with structured responses',
      'Immediate availability',
    ],
    overallConcerns: [
      'Limited distributed backend infrastructure experience (non-critical for this role)',
    ],
    overallNextStep: 'Technical interview scheduled. Focus on advanced system design and architecture.',
  },

  // ─── c1: Aarav Sharma — Sales Executive — Hire ───
  c1: {
    resumeSummary:
      'Aarav has 3 years of sales experience with a focus on B2B and CRM usage. While not enterprise-heavy, his skill set covers the core requirements. One gap noted: no Salesforce-specific experience stated on the resume.',
    resumeEvidence: [
      { source: 'resume', label: '3 years B2B Sales', detail: 'Meets minimum experience threshold for the role' },
      { source: 'resume', label: 'CRM Usage', detail: 'Generic CRM experience; specific tool not specified' },
      { source: 'resume', label: 'Negotiation & Prospecting', detail: 'Key sales skills listed; demonstrated quality to be validated in call' },
    ],
    callStrengths: [
      'Good energy and communication on the call',
      'Clearly articulated current sales process and quota achievement',
      'Expressed strong interest in the role and company',
      'Availability within 30 days is reasonable',
    ],
    callConcerns: [
      'No Salesforce CRM experience — will require onboarding time',
      'Enterprise account experience is limited compared to top candidates',
    ],
    callRecommendedStep: 'Candidate is suitable for this role. Consider scheduling an HR round to assess cultural fit and finalize compensation.',
    callDimensions: [
      { name: 'Communication & Articulation', score: 8, maxScore: 10, notes: 'Engaged well; clear and confident on the call' },
      { name: 'Domain Knowledge — Sales', score: 7, maxScore: 10, notes: 'Good foundational knowledge; enterprise depth is moderate' },
      { name: 'Motivation & Cultural Fit', score: 8, maxScore: 10, notes: 'Showed genuine enthusiasm for the role and growth opportunity' },
      { name: 'Negotiation & Closing', score: 7, maxScore: 10, notes: 'Described closing mid-size deals; no large enterprise examples' },
      { name: 'CRM & Tooling Proficiency', score: 5, maxScore: 10, notes: 'Generic CRM usage; no Salesforce specifics', verifiedGap: 'Candidate confirmed no Salesforce experience — "We used a simpler CRM at my current company."' },
      { name: 'Availability & Logistics', score: 8, maxScore: 10, notes: '30 days notice; salary ₹5.5L current, open to negotiation' },
    ],
    callEvidence: [
      { source: 'call', label: 'Confirmed CRM tooling gap', detail: '"We used a simpler CRM — I haven\'t used Salesforce directly, but I\'m a quick learner."' },
      { source: 'call', label: 'Salary expectation noted', detail: 'Currently ₹5.5L. Open to the offered range of ₹7–8L.' },
      { source: 'call', label: '30-day availability confirmed', detail: 'One month notice period. Can expedite if needed.' },
    ],
    competencies: [
      { name: 'B2B Sales Execution', score: 74, importance: 'core', strength: 'moderate' },
      { name: 'Enterprise Account Management', score: 58, importance: 'core', strength: 'moderate' },
      { name: 'CRM & Pipeline Management', score: 52, importance: 'core', strength: 'moderate', notes: 'No Salesforce; generic CRM only' },
      { name: 'Negotiation & Closing', score: 70, importance: 'core', strength: 'moderate' },
      { name: 'Communication & Presentation', score: 80, importance: 'core', strength: 'strong' },
      { name: 'SaaS Sales Knowledge', score: 45, importance: 'nice_to_have', strength: 'weak' },
    ],
    skillGroups: [
      {
        category: 'Sales Competencies',
        skills: [
          { name: 'B2B Sales', score: 7, strength: 'moderate', source: 'call' },
          { name: 'Negotiation', score: 7, strength: 'moderate', source: 'call' },
          { name: 'Prospecting', score: 7, strength: 'moderate', source: 'resume' },
          { name: 'Account Management', score: 6, strength: 'moderate', source: 'resume' },
          { name: 'Enterprise Sales', score: 5, strength: 'moderate', source: 'resume' },
        ],
      },
      {
        category: 'Communication',
        skills: [
          { name: 'Verbal Articulation', score: 8, strength: 'strong', source: 'call' },
          { name: 'Stakeholder Communication', score: 7, strength: 'moderate', source: 'call' },
          { name: 'Written Communication', score: 6, strength: 'moderate', source: 'resume' },
        ],
      },
      {
        category: 'Tools & Technology',
        skills: [
          { name: 'CRM (Generic)', score: 6, strength: 'moderate', source: 'resume' },
          { name: 'Salesforce', score: 2, strength: 'weak', source: 'call' },
          { name: 'Excel / Reporting', score: 6, strength: 'moderate', source: 'resume' },
        ],
      },
    ],
    radarSummary:
      'Aarav demonstrates solid foundational sales skills and strong communication. The primary weakness is CRM tooling depth, specifically the absence of Salesforce experience which is directly required by this role.',
    overallSummary:
      'Aarav Sharma is a capable sales candidate with the right domain background. He is not the strongest candidate in this pool but is a solid hire for a junior-to-mid sales role.',
    overallStrengths: ['Good communication and presentation', 'Relevant B2B sales foundation', 'Strong motivation and cultural alignment'],
    overallConcerns: ['No Salesforce experience (core requirement)', 'Limited enterprise account depth'],
    overallNextStep: 'Recommended for HR round. Address CRM onboarding plan during interview.',
  },

  // ─── c4: Neha Singh — Frontend Developer — Hire ───
  c4: {
    resumeSummary:
      'Neha brings 4 years of React and TypeScript experience with a strong frontend foundation. Her BITS Pilani background and Redux proficiency are well-aligned. The only noted gap is limited Node.js experience, which is listed as a "plus" in the JD rather than a hard requirement.',
    resumeEvidence: [
      { source: 'resume', label: '4 years React / TypeScript', detail: 'Directly meets core JD requirement' },
      { source: 'resume', label: 'B.Tech, BITS Pilani', detail: 'Strong academic background in engineering' },
      { source: 'resume', label: 'Redux State Management', detail: 'Demonstrates experience with complex state architectures' },
      { source: 'resume', label: 'CSS Expertise', detail: 'Responsive design and CSS architecture listed as strengths' },
    ],
    callStrengths: [
      'Confident and clear explanation of React component patterns',
      'Good understanding of performance optimization (memoization, lazy loading)',
      'Open to hybrid work arrangement and willing to learn Node.js',
      'Demonstrated collaborative approach when discussing team projects',
    ],
    callConcerns: [
      'Limited Node.js and backend experience',
      'No GraphQL exposure — would need onboarding',
      '2-month notice period is longer than preferred',
    ],
    callRecommendedStep: 'Recommend proceeding to technical interview. Assess component architecture depth and willingness to expand backend skills.',
    callDimensions: [
      { name: 'React & Component Architecture', score: 8, maxScore: 10, notes: 'Good knowledge of patterns; solid hands-on experience' },
      { name: 'TypeScript Proficiency', score: 8, maxScore: 10, notes: 'Comfortable with typed interfaces and generics at intermediate level' },
      { name: 'CSS & Styling Systems', score: 9, maxScore: 10, notes: 'Excellent design-to-code translation skills; knows CSS-in-JS and BEM' },
      { name: 'Backend & API Integration', score: 4, maxScore: 10, notes: 'Limited backend exposure; REST API consumption only', verifiedGap: 'Candidate confirmed no backend development experience — "I\'ve always been purely frontend."' },
      { name: 'Communication & Clarity', score: 8, maxScore: 10, notes: 'Well-spoken, clear with technical concepts' },
      { name: 'Collaboration & Team Fit', score: 9, maxScore: 10, notes: 'Strong collaborative instincts; described working well in cross-functional squads' },
    ],
    callEvidence: [
      { source: 'call', label: 'React performance optimization demonstrated', detail: '"I used React.memo and useMemo strategically to reduce unnecessary renders in a data-heavy table — improved FPS by 30%."' },
      { source: 'call', label: 'Verified gap — backend / Node.js', detail: '"I\'ve consumed REST APIs but haven\'t built any Node.js services. I\'m interested in learning."' },
      { source: 'call', label: '2-month availability noted', detail: 'Currently serving a 2-month notice. Can potentially negotiate 6 weeks.' },
    ],
    competencies: [
      { name: 'React & UI Architecture', score: 82, importance: 'core', strength: 'strong' },
      { name: 'TypeScript & Type Safety', score: 80, importance: 'core', strength: 'strong' },
      { name: 'CSS & Design Systems', score: 88, importance: 'core', strength: 'strong' },
      { name: 'Node.js & API Design', score: 38, importance: 'core', strength: 'weak', notes: 'Not experienced; needs onboarding' },
      { name: 'GraphQL', score: 30, importance: 'nice_to_have', strength: 'weak' },
      { name: 'Collaboration & Communication', score: 85, importance: 'nice_to_have', strength: 'strong' },
    ],
    skillGroups: [
      {
        category: 'Frontend Engineering',
        skills: [
          { name: 'React', score: 8, strength: 'strong', source: 'call' },
          { name: 'TypeScript', score: 8, strength: 'strong', source: 'call' },
          { name: 'CSS / Styling', score: 9, strength: 'strong', source: 'call' },
          { name: 'Redux', score: 7, strength: 'moderate', source: 'resume' },
          { name: 'GraphQL', score: 3, strength: 'weak', source: 'resume' },
        ],
      },
      {
        category: 'Backend & Infrastructure',
        skills: [
          { name: 'Node.js', score: 3, strength: 'weak', source: 'call' },
          { name: 'REST API Consumption', score: 7, strength: 'moderate', source: 'resume' },
          { name: 'AWS', score: 3, strength: 'weak', source: 'resume' },
        ],
      },
      {
        category: 'Interpersonal',
        skills: [
          { name: 'Verbal Articulation', score: 8, strength: 'strong', source: 'call' },
          { name: 'Collaboration', score: 9, strength: 'strong', source: 'call' },
          { name: 'Structured Thinking', score: 7, strength: 'moderate', source: 'call' },
        ],
      },
    ],
    radarSummary:
      'Neha excels in frontend engineering and collaboration. The main weakness is backend/Node.js depth, which is optional for this role. Strong overall candidate with a clear learning trajectory.',
    overallSummary:
      'Neha Singh is a strong frontend candidate with excellent React/TypeScript skills and collaborative instincts. The Node.js gap is manageable given the role does not require heavy backend work.',
    overallStrengths: ['Strong React and CSS proficiency', 'Excellent collaboration and communication', 'Motivated to grow into full-stack'],
    overallConcerns: ['No Node.js or backend development experience', '2-month notice period'],
    overallNextStep: 'Schedule technical interview. Evaluate frontend architecture depth and growth mindset.',
  },

  // ─── c12: Anita Bose — HR Manager — Hire ───
  c12: {
    resumeSummary:
      'Anita brings 6 years of HR experience with a strong talent acquisition and HR operations background. Her Symbiosis MBA HR degree is well-suited. Two gaps noted: limited HRBP strategic work and no Workday HRMS experience, both of which the JD lists as preferred.',
    resumeEvidence: [
      { source: 'resume', label: '6 years HR Experience', detail: 'Meets the minimum experience requirement of 6+ years' },
      { source: 'resume', label: 'MBA HR, Symbiosis', detail: 'Directly relevant academic background' },
      { source: 'resume', label: 'Talent Acquisition', detail: 'Core requirement — confirmed as primary experience area' },
      { source: 'resume', label: 'HR Operations', detail: 'Good generalist coverage of HR processes' },
    ],
    callStrengths: [
      'Passionate about building people-first HR practices',
      'Good articulation of hiring challenges and solutions',
      'Demonstrated ownership of full-cycle recruiting',
      'Available within 45 days — reasonable timeline',
    ],
    callConcerns: [
      'HRBP strategic work limited to operational HR',
      'No Workday HRMS experience — will need tool onboarding',
    ],
    callRecommendedStep: 'Recommend HR leadership round to assess strategic HR thinking. HRBP depth and Workday onboarding plan to be discussed.',
    callDimensions: [
      { name: 'Talent Acquisition', score: 8, maxScore: 10, notes: 'Strong end-to-end recruitment experience across tech and non-tech roles' },
      { name: 'HR Operations', score: 8, maxScore: 10, notes: 'Good process orientation; comfortable with compliance and documentation' },
      { name: 'HRBP & Strategic HR', score: 5, maxScore: 10, notes: 'Limited strategic HR experience; mostly operational', verifiedGap: 'Candidate acknowledged limited HRBP exposure — "Most of my work has been on the operational and recruitment side."' },
      { name: 'Communication & Presentation', score: 7, maxScore: 10, notes: 'Decent communicator; could be more assertive in articulating impact' },
      { name: 'Employee Engagement', score: 8, maxScore: 10, notes: 'Described running engagement surveys and acting on feedback' },
      { name: 'HRMS & Tooling', score: 4, maxScore: 10, notes: 'No Workday experience; used basic HRMS tools', verifiedGap: 'Confirmed no Workday exposure: "We used a proprietary system, not Workday."' },
    ],
    callEvidence: [
      { source: 'call', label: 'Full-cycle recruitment demonstrated', detail: '"I managed hiring for 45 open positions in FY25, from JD creation to offer rollout — across tech and business functions."' },
      { source: 'call', label: 'Verified gap — HRBP', detail: '"My HRBP work has mostly been in a supporting capacity. I haven\'t owned the strategic partnership function independently."' },
      { source: 'call', label: 'Workday gap confirmed', detail: 'Uses a proprietary HRMS; willing to learn Workday during onboarding.' },
    ],
    competencies: [
      { name: 'Talent Acquisition', score: 80, importance: 'core', strength: 'strong' },
      { name: 'HR Operations', score: 78, importance: 'core', strength: 'strong' },
      { name: 'HRBP & Strategic HR', score: 50, importance: 'core', strength: 'moderate', notes: 'Limited strategic HR exposure' },
      { name: 'Employee Engagement', score: 75, importance: 'core', strength: 'moderate' },
      { name: 'HRMS & Technology', score: 42, importance: 'nice_to_have', strength: 'weak', notes: 'No Workday' },
      { name: 'Compliance & Policy', score: 70, importance: 'nice_to_have', strength: 'moderate' },
    ],
    skillGroups: [
      {
        category: 'HR Core',
        skills: [
          { name: 'Talent Acquisition', score: 8, strength: 'strong', source: 'call' },
          { name: 'HR Operations', score: 8, strength: 'strong', source: 'resume' },
          { name: 'Employee Engagement', score: 8, strength: 'strong', source: 'call' },
          { name: 'Onboarding', score: 7, strength: 'moderate', source: 'resume' },
          { name: 'Performance Management', score: 6, strength: 'moderate', source: 'resume' },
        ],
      },
      {
        category: 'Strategic HR',
        skills: [
          { name: 'HRBP Partnership', score: 5, strength: 'moderate', source: 'call' },
          { name: 'Workforce Planning', score: 5, strength: 'moderate', source: 'resume' },
          { name: 'HR Analytics', score: 4, strength: 'weak', source: 'resume' },
        ],
      },
      {
        category: 'Communication & Influence',
        skills: [
          { name: 'Verbal Communication', score: 7, strength: 'moderate', source: 'call' },
          { name: 'Stakeholder Management', score: 7, strength: 'moderate', source: 'call' },
          { name: 'Presentation Skills', score: 6, strength: 'moderate', source: 'call' },
        ],
      },
    ],
    radarSummary:
      'Anita demonstrates strong HR generalist capabilities with solid talent acquisition experience. Strategic HR and HRBP depth are moderate, and tooling knowledge needs development. A capable hire for a mid-level HR management role.',
    overallSummary:
      'Anita Bose is a dependable HR professional with good operational and talent acquisition experience. She would benefit from growth in strategic HR but is a solid hire for this role.',
    overallStrengths: ['Strong full-cycle recruitment experience', 'Good employee engagement track record', 'Available within budget and timeline'],
    overallConcerns: ['Limited HRBP strategic experience', 'No Workday HRMS knowledge'],
    overallNextStep: 'Schedule HR leadership round. Discuss HRBP development plan and Workday onboarding approach.',
  },
};

// ─── Fallback data generator for candidates without overrides ──
function buildFallbackAssessment(candidate: Candidate): CandidateAssessmentOverride {
  const skills = candidate.skills ?? [];
  const strong = candidate.strongMatches ?? [];
  const missing = candidate.missingRequirements ?? [];

  return {
    resumeSummary:
      `${candidate.name} has ${candidate.experience ?? 'relevant'} of experience. ` +
      `The resume aligns with ${strong.length > 0 ? strong.join(', ') : 'some role requirements'}. ` +
      (missing.length > 0 ? `Areas to confirm: ${missing.join(', ')}.` : 'No significant gaps identified.'),
    resumeEvidence: [
      ...strong.map(s => ({ source: 'resume' as const, label: s, detail: `Listed on resume as a key skill` })),
      ...missing.map(m => ({ source: 'resume' as const, label: `Gap: ${m}`, detail: `Not evidenced on resume — requires verification` })),
    ],
    callStrengths: candidate.callAssessmentComplete
      ? ['Good communication on the call', 'Expressed interest in the role', 'Availability discussed']
      : [],
    callConcerns: candidate.callAssessmentComplete
      ? missing.slice(0, 2).map(m => `${m} experience needs validation`)
      : [],
    callRecommendedStep: candidate.callAssessmentComplete
      ? 'Proceed to HR round for further evaluation.'
      : 'Complete AI screening call before proceeding.',
    callDimensions: candidate.callAssessmentComplete
      ? [
          { name: 'Communication', score: 7, maxScore: 10 },
          { name: 'Domain Knowledge', score: 6, maxScore: 10 },
          { name: 'Motivation & Fit', score: 7, maxScore: 10 },
          { name: 'Availability & Logistics', score: 8, maxScore: 10 },
        ]
      : [],
    callEvidence: candidate.callAssessmentComplete && candidate.aiSummary
      ? [{ source: 'call', label: 'Call Summary', detail: candidate.aiSummary }]
      : [],
    competencies: skills.slice(0, 4).map((s, i) => ({
      name: s,
      score: 55 + i * 8,
      importance: i < 2 ? ('core' as const) : ('nice_to_have' as const),
      strength: i < 2 ? ('moderate' as const) : ('moderate' as const),
    })),
    skillGroups: [
      {
        category: 'Core Skills',
        skills: skills.slice(0, 5).map((s, i) => ({
          name: s,
          score: 5 + Math.min(i, 3),
          strength: i < 2 ? ('moderate' as const) : ('moderate' as const),
          source: 'resume' as const,
        })),
      },
    ],
    radarSummary: `${candidate.name} covers core requirements. Full capability analysis requires completed AI call assessment.`,
    overallSummary: candidate.aiRecommendation ?? 'Evaluation in progress.',
    overallStrengths: strong,
    overallConcerns: missing,
    overallNextStep: candidate.callAssessmentComplete
      ? 'Review full screening report with HR team.'
      : 'AI screening call pending — schedule and complete before proceeding.',
  };
}

// ─── Main service ────────────────────────────────────────────

export const screeningReportService = {
  /**
   * Returns a full CandidateScreeningReportData for the given candidate.
   * Combines store data (resume fields, call status) with rich mock assessment.
   * Replace this with: GET /screening-reports/{candidateId}
   */
  getReport(candidate: Candidate): CandidateScreeningReportData {
    const override = assessmentOverrides[candidate.id] ?? buildFallbackAssessment(candidate);
    const callComplete = !!candidate.callAssessmentComplete;

    // ── Resume Screening section ──────────────────────────
    const resumeScreening: ResumeScreeningReport = {
      matchScore: candidate.matchScore ?? 0,
      compatibility: candidate.compatibility ?? 'not_compatible',
      resumeLabel: labelForScore(candidate.matchScore ?? 0),
      strongMatches: candidate.strongMatches ?? [],
      missingRequirements: candidate.missingRequirements ?? [],
      resumeSummary: override.resumeSummary,
      evidence: override.resumeEvidence,
    };

    // ── Call Assessment section ──────────────────────────
    const callAssessment: CallAssessmentReport = {
      complete: callComplete,
      overallScore: callComplete ? (candidate.callAssessmentScore ?? 0) : 0,
      label: callComplete ? (candidate.callAssessmentLabel ?? 'consider') : 'consider',
      confidence: callComplete ? (candidate.callAssessmentConfidence ?? 'medium') : 'low',
      signalCount: callComplete ? 38 + Math.floor((candidate.callAssessmentScore ?? 5) * 3) : 0,
      callDuration: candidate.callDuration ?? '—',
      strengths: callComplete ? override.callStrengths : [],
      concerns: callComplete ? override.callConcerns : [],
      recommendedNextStep: override.callRecommendedStep,
      dimensions: callComplete ? override.callDimensions : [],
      evidence: callComplete ? override.callEvidence : [],
    };

    // ── Capability Analysis section ──────────────────────
    const capabilityAnalysis: CapabilityAnalysis = {
      competencies: override.competencies,
      totalWeighted: override.competencies.filter(c => c.importance === 'core').length,
      radarSummary: override.radarSummary,
      skillGroups: override.skillGroups,
    };

    // ── Overall Recommendation ──────────────────────────
    // Only surface a strong overall recommendation once the call is complete
    const overallLabel: AIHireLabel = callComplete
      ? (candidate.callAssessmentLabel ?? 'consider')
      : 'consider';

    const overallScore = callComplete
      ? Math.round(
          ((candidate.matchScore ?? 0) / 10 * 0.35 +
           (candidate.callAssessmentScore ?? 0) * 0.65) * 10
        ) / 10
      : 0;

    return {
      candidateId: candidate.id,
      generatedAt: new Date().toISOString(),
      resumeScreening,
      callAssessment,
      capabilityAnalysis,
      overallRecommendation: {
        label: overallLabel,
        score: overallScore,
        summary: override.overallSummary,
        strengths: override.overallStrengths,
        concerns: override.overallConcerns,
        recommendedNextStep: override.overallNextStep,
      },
    };
  },

  /** Human-readable label for AIHireLabel */
  hireLabelText,

  /** Score ≥ 8.0 = Strong Hire, ≥ 6.5 = Hire, ≥ 5.0 = Consider, else No Hire */
  labelForCallScore(score: number): AIHireLabel {
    if (score >= 8.5) return 'strong_hire';
    if (score >= 6.5) return 'hire';
    if (score >= 5.0) return 'consider';
    return 'no_hire';
  },

  /** Returns true if the candidate has enough data to show a complete report */
  isReportAvailable(candidate: Candidate): boolean {
    return (candidate.matchScore !== undefined);
  },

  /** Whether call assessment section is available */
  isCallAssessmentComplete(candidate: Candidate): boolean {
    return !!candidate.callAssessmentComplete;
  },

  /** Badge color tokens for hire labels */
  hireLabelStyle(label: AIHireLabel): { bg: string; text: string; border: string } {
    if (label === 'strong_hire') return { bg: 'var(--status-success-bg)', text: 'var(--status-success-text)', border: 'var(--status-success-border)' };
    if (label === 'hire') return { bg: 'var(--brand-primary-light)', text: 'var(--brand-primary)', border: 'var(--brand-primary-border)' };
    if (label === 'consider') return { bg: 'var(--status-warning-bg)', text: 'var(--status-warning-text)', border: 'var(--status-warning-border)' };
    return { bg: 'var(--status-error-bg)', text: 'var(--status-error-text)', border: 'var(--status-error-border)' };
  },
};
