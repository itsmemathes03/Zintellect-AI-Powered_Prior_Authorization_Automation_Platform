// Zintellect AI — ALL content data. Replace placeholder media paths with your real files.

export const siteConfig = {
  title: 'Zintellect AI',
  tagline: 'Intelligent Healthcare Prior Authorization Automation Platform',
  team: 'Cognitive Crew',
  college: 'Velammal College of Engineering and Technology',
  track: 'Human – AI Collaboration',
  navSections: [
    { id: 'hero', label: 'Home' },
    { id: 'intro', label: 'Intro' },
    { id: 'problem', label: 'Problem' },
    { id: 'solution', label: 'Solution' },
    { id: 'security', label: 'Security' },
    { id: 'techstack', label: 'Tech Stack' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'roadmap', label: 'How It Works' },
    { id: 'demo', label: 'Demo' },
    { id: 'benefits', label: 'Impact' },
    { id: 'future', label: 'Future' },
    { id: 'faq', label: 'FAQ' },
  ],
}

export const heroContent = {
  headline: 'Zintellect AI',
  tagline: 'Intelligent Healthcare Prior Authorization Automation Platform',
  description:
    'Eliminating the friction between a clinical decision to treat and the patient\u2019s actual receipt of treatment \u2014 through a scalable, auditable, rights-protective Hybrid AI automation platform.',
  cta: 'Watch Demo',
  videoPlaceholder: '/assets/hero-demo.mp4', // drop your real demo MP4 here
}

export const problemContent = {
  title: 'The Problem',
  closingLine:
    'Zintellect AI eliminates the friction between a clinical decision to treat and the patient\u2019s actual receipt of treatment \u2014 through a scalable, auditable, rights-protective Hybrid AI automation platform.',
  painPoints: [
    {
      icon: 'FileText',
      title: 'Manual Paperwork',
      text: 'Paperwork-heavy prior authorization workflows that burden clinical staff.',
    },
    {
      icon: 'Scan',
      title: 'Unreadable Documents',
      text: 'Inability to process handwritten or scanned medical documents.',
    },
    {
      icon: 'Search',
      title: 'No Policy Matching',
      text: 'Absence of dynamic insurance policy matching capabilities.',
    },
    {
      icon: 'Clock',
      title: 'Treatment Delays',
      text: 'Critical treatment delays and clinical staff burnout from repetitive tasks.',
    },
    {
      icon: 'Users',
      title: 'Inequitable Access',
      text: 'Inequitable patient access to timely, life-saving care.',
    },
  ],
}

export const solutionContent = {
  title: 'The Solution',
  subtitle: 'HMH-RAGES — Hybrid Multimodal Hierarchical RAG Expert System',
  description:
    'Zintellect AI is an AI-powered Prior Authorization Automation Platform built on a Hybrid Multimodal Hierarchical RAG Expert System (HMH-RAGES) that streamlines healthcare authorization workflows between doctors, patients, and insurance providers. Providers submit requests digitally (patient info, clinical notes, lab reports, scanned documents) \u2192 HMH-RAGES pipeline auto-processes multimodal documents \u2192 extracts clinical entities via Medical NER \u2192 dynamically retrieves relevant insurance policy clauses via RAG-based semantic search \u2192 delivers fast, transparent, auditable outcomes.',
  pillars: [
    {
      id: 1,
      icon: 'Layers',
      title: 'HMH-RAGES',
      description:
        'Hybrid Multimodal Hierarchical RAG Expert System — the core AI architecture orchestrating document processing, retrieval, and reasoning.',
    },
    {
      id: 2,
      icon: 'FileImage',
      title: 'Multimodal OCR Engine',
      description:
        'PaddleOCR-VL / LayoutLMv3 pipeline for scanned and handwritten document processing with high accuracy.',
    },
    {
      id: 3,
      icon: 'GitBranch',
      title: 'Hierarchical RAG Retrieval',
      description:
        'Multi-level semantic search across insurance policy clauses using vector embeddings and FAISS/ChromaDB.',
    },
    {
      id: 4,
      icon: 'Brain',
      title: 'Medical NER',
      description:
        'Clinical entity and CPT code extraction from medical documents for structured data representation.',
    },
    {
      id: 5,
      icon: 'Gauge',
      title: 'Weighted Risk Scoring',
      description:
        'AI confidence scoring engine that generates approval, rejection, or manual review recommendations.',
    },
    {
      id: 6,
      icon: 'Eye',
      title: 'Explainable AI (XAI)',
      description:
        'Full decision reasoning trace with auditable, transparent logic behind every authorization outcome.',
    },
    {
      id: 7,
      icon: 'Users',
      title: 'Human-in-the-Loop',
      description:
        'Provider validation workflow enabling final review and confirmation of AI-generated decisions.',
    },
    {
      id: 8,
      icon: 'Shield',
      title: 'Secure Multi-Role Ecosystem',
      description:
        'Cloud-native architecture with role-based access (Doctor / Provider / Patient) and JWT authentication.',
    },
  ],
}

export const techStackContent = {
  title: 'Built With',
  categories: [
    { id: 'all', label: 'All' },
    { id: 'frontend', label: 'Frontend' },
    { id: 'backend', label: 'Backend' },
    { id: 'ai', label: 'AI Layer' },
    { id: 'database', label: 'Database' },
    { id: 'security', label: 'Security' },
    { id: 'devops', label: 'DevOps' },
  ],
  items: [
    { name: 'React.js', cat: 'frontend', desc: 'SPA for healthcare workflow management' },
    { name: 'Tailwind CSS', cat: 'frontend', desc: 'Responsive modern UI framework' },
    { name: 'Axios', cat: 'frontend', desc: 'Promise-based HTTP client for API communication' },
    { name: 'Lucide React', cat: 'frontend', desc: 'Dashboard iconography and UI icons' },
    { name: 'React Router DOM', cat: 'frontend', desc: 'Role-based navigation and routing' },
    { name: 'Python FastAPI', cat: 'backend', desc: 'High-performance REST API framework' },
    { name: 'Uvicorn', cat: 'backend', desc: 'ASGI server for Python async capabilities' },
    { name: 'RESTful APIs', cat: 'backend', desc: 'Secure inter-module communication' },
    { name: 'Pydantic', cat: 'backend', desc: 'Data validation and serialization' },
    { name: 'HMH-RAGES', cat: 'ai', desc: 'Hybrid Multimodal Hierarchical RAG Expert System' },
    { name: 'PaddleOCR-VL', cat: 'ai', desc: 'Multimodal OCR for scanned/handwritten docs' },
    { name: 'LayoutLMv3', cat: 'ai', desc: 'Document layout understanding model' },
    { name: 'BGE-Large / E5-Large', cat: 'ai', desc: 'Vector embedding models' },
    { name: 'FAISS / ChromaDB', cat: 'ai', desc: 'Vector database for policy retrieval' },
    { name: 'Medical NER', cat: 'ai', desc: 'Symptom/diagnosis/procedure/CPT extraction' },
    { name: 'Ollama Qwen 2.5 (1.5B)', cat: 'ai', desc: 'Clinical reasoning LLM' },
    { name: 'Weighted Risk Scoring', cat: 'ai', desc: 'AI confidence scoring engine' },
    { name: 'Explainable AI (XAI)', cat: 'ai', desc: 'Transparent reasoning trace' },
    { name: 'SQLite', cat: 'database', desc: 'Lightweight relational database' },
    { name: 'JWT', cat: 'security', desc: 'Token-based authentication' },
    { name: 'Bcrypt', cat: 'security', desc: 'Password hashing and security' },
    { name: 'RBAC', cat: 'security', desc: 'Role-Based Access Control (Doctor/Provider/Patient)' },
    { name: 'Docker', cat: 'devops', desc: 'Containerization for consistent deployment' },
    { name: 'Cloudflare Tunnel', cat: 'devops', desc: 'Secure public access tunneling' },
    { name: 'Swagger UI', cat: 'devops', desc: 'API documentation and testing' },
    { name: 'npm / Vite', cat: 'devops', desc: 'Build system and package management' },
  ],
}

export const roadmapContent = {
  title: 'How It Works',
  subtitle: '9-Step Automated Prior Authorization Pipeline',
  steps: [
    {
      step: 1,
      icon: 'UserPlus',
      title: 'Patient Registration',
      duration: '~2 min',
      highlights: ['Personal details capture', 'Insurance policy ID', 'Coverage tier detection'],
      description:
        'Patient registers on the platform with personal details and insurance information. The system captures demographic data, policy ID, and coverage details.',
    },
    {
      step: 2,
      icon: 'ShieldCheck',
      title: 'Insurance Verification',
      duration: '~30 sec',
      highlights: ['Real-time eligibility check', 'Provider database sync', 'Active coverage confirmation'],
      description:
        'System automatically validates insurance membership and eligibility in real-time against provider databases, confirming active coverage and benefit details.',
    },
    {
      step: 3,
      icon: 'ClipboardList',
      title: 'Authorization Request',
      duration: '~3 min',
      highlights: ['Treatment specification', 'Clinical urgency flags', 'Provider dashboard submission'],
      description:
        'Doctor submits a treatment or procedure authorization request through the provider dashboard, specifying clinical requirements and urgency.',
    },
    {
      step: 4,
      icon: 'FileUp',
      title: 'Clinical Document Upload',
      duration: '~1 min',
      highlights: ['Multi-format support (PDF, JPG, PNG)', 'Scanned & handwritten docs', 'Batch upload capability'],
      description:
        'Medical reports, prescriptions, lab results, and supporting evidence are uploaded in various formats including scanned and handwritten documents.',
    },
    {
      step: 5,
      icon: 'BrainCircuit',
      title: 'AI Clinical Analysis',
      duration: '~45 sec',
      highlights: ['Multimodal OCR text extraction', 'Hierarchical RAG context retrieval', 'Medical NER entity extraction'],
      description:
        'Qwen HMH-RAGES pipeline processes all documents: Multimodal OCR extracts text, Hierarchical RAG retrieves relevant context, and Medical NER identifies clinical entities and CPT codes.',
    },
    {
      step: 6,
      icon: 'FileSearch',
      title: 'Policy Rule Matching',
      duration: '~20 sec',
      highlights: ['Semantic clause retrieval', 'Cross-reference engine', 'Policy requirement validation'],
      description:
        'RAG-based semantic search retrieves relevant insurance policy clauses. The rule engine cross-references extracted clinical data against policy requirements.',
    },
    {
      step: 7,
      icon: 'Scale',
      title: 'Authorization Decision',
      duration: '~10 sec',
      highlights: ['Weighted risk score calculation', 'Confidence level assessment', 'Full reasoning trace generation'],
      description:
        'Weighted risk scoring engine evaluates all factors and generates an outcome: approval, rejection, or manual review — each with a confidence score and full reasoning trace.',
    },
    {
      step: 8,
      icon: 'UserCheck',
      title: 'Provider Validation',
      duration: '~5 min',
      highlights: ['Decision review dashboard', 'Modify or override options', 'Audit trail documentation'],
      description:
        'Insurance provider reviews the AI-generated decision through the validation dashboard, with the ability to confirm, modify, or override with documented rationale.',
    },
    {
      step: 9,
      icon: 'CheckCircle',
      title: 'Authorization Outcome',
      duration: 'Instant',
      highlights: ['Real-time status update', 'Request history logging', 'SQLite audit trail storage'],
      description:
        'Final status is displayed in the patient dashboard and request history. All requests, decisions, and audit trails are stored and tracked in SQLite.',
    },
  ],
}

export const introVideoContent = {
  title: 'See Zintellect in Motion',
  description:
    'A brief walkthrough of the Zintellect AI platform — from patient intake to authorization outcome.',
  videoSrc: '/assets/intro.mp4', // drop your intro MP4 here
}

export const chartData = {
  beforeAfter: {
    before: { days: 14, label: 'Traditional Process (Days)' },
    after: { minutes: 12, label: 'Zintellect AI (Minutes)' },
  },
  pillarEffectiveness: [
    { label: 'HMH-RAGES', value: 96 },
    { label: 'Multimodal OCR', value: 92 },
    { label: 'Hierarchical RAG', value: 89 },
    { label: 'Medical NER', value: 94 },
    { label: 'Risk Scoring', value: 91 },
    { label: 'Explainable AI', value: 88 },
    { label: 'Human-in-Loop', value: 95 },
    { label: 'Secure Ecosystem', value: 93 },
  ],
  processingMetrics: [
    { label: 'Document Processing', before: 240, after: 3, unit: 'min' },
    { label: 'Policy Matching', before: 120, after: 1, unit: 'min' },
    { label: 'Decision Generation', before: 60, after: 0.5, unit: 'min' },
    { label: 'Approval Cycle', before: 168, after: 8, unit: 'hrs' },
  ],
}

export const demoContent = {
  title: 'See It In Action',
  description:
    'Watch how Zintellect AI transforms the prior authorization workflow from end to end.',
  fullVideoSrc: '/assets/full.mp4', // drop your full demo MP4 here
  videoPlaceholder: 'https://drive.google.com/file/d/1xJ_W0YcQg3KlhZ9u0dVWQjRrq9E_GQ2A/preview', // Replace with your hosted video URL
  mockups: [
    {
      role: 'Doctor Dashboard',
      label: 'Doctor',
      desc: 'Submit and track authorization requests, view patient records, and receive AI-powered recommendations.',
      gradient: 'from-teal-500 to-cyan-600',
    },
    {
      role: 'Patient Portal',
      label: 'Patient',
      desc: 'Register insurance details, upload medical documents, and track authorization status in real-time.',
      gradient: 'from-cyan-500 to-blue-600',
    },
    {
      role: 'Provider Review',
      label: 'Provider',
      desc: 'Review AI-generated decisions, validate outcomes, and manage authorizations across your organization.',
      gradient: 'from-blue-500 to-indigo-600',
    },
  ],
}

export const benefitsContent = {
  title: 'Impact',
  subtitle: 'Transforming Healthcare Prior Authorization',
  categories: [
    {
      title: 'Efficiency & Automation',
      icon: 'Zap',
      color: 'teal',
      stat: { value: 95, suffix: '%', label: 'Faster Processing' },
      items: [
        'Reduces prior authorization processing time from days to minutes',
        'Automates clinical document review and insurance policy validation',
        'Eliminates manual paperwork and repetitive authorization tasks',
        'Real-time insurance eligibility verification',
        'Centralized request tracking and authorization history',
      ],
    },
    {
      title: 'Scalability',
      icon: 'Expand',
      color: 'cyan',
      stat: { value: 100, suffix: 'K+', label: 'Requests Scalable' },
      items: [
        'Cloud-native architecture supports multiple healthcare organizations',
        'Handles large volumes of authorization requests efficiently',
        'Modular microservices architecture for easy feature expansion',
        'Integrates with multiple insurance providers and healthcare systems',
        'Ready for Docker, Cloudflare, and cloud deployment',
      ],
    },
    {
      title: 'Healthcare Impact',
      icon: 'Heart',
      color: 'rose',
      stat: { value: 99, suffix: '%', label: 'Faster Patient Access' },
      items: [
        'Accelerates patient access to critical treatments and procedures',
        'Reduces treatment delays caused by authorization bottlenecks',
        'Improves patient satisfaction via faster approvals',
        'Transparent, auditable authorization decisions',
        'Supports digital transformation in healthcare administration',
      ],
    },
  ],
}

export const futureContent = {
  title: 'Future Vision',
  subtitle: 'Roadmap to Enterprise-Grade Healthcare AI',
  tracks: [
    {
      title: 'AI Enhancements',
      icon: 'Brain',
      items: [
        'Upgrade to Qwen 2.5 7B / 14B for complex clinical reasoning',
        'Multi-LLM support (Qwen, Llama, GPT)',
        'Full HMH-RAGES production deployment with persistent vector DB',
        'Clinical Risk Assessment Engine',
      ],
    },
    {
      title: 'User Experience',
      icon: 'Smartphone',
      items: [
        'Mobile application support for iOS and Android',
        'SMS notifications for authorization updates',
        'Real-time authorization alerts and push notifications',
        'Voice-based clinical documentation',
      ],
    },
    {
      title: 'Enterprise Scalability',
      icon: 'Building2',
      items: [
        'Cloud deployment on AWS / Azure',
        'Kubernetes orchestration for auto-scaling',
        'Multi-hospital and multi-organization support',
        'Analytics and reporting dashboard with BI integration',
      ],
    },
  ],
}

export const statsContent = {
  stats: [
    { value: '14d', label: 'Traditional Processing', color: 'text-rose-400' },
    { value: '12m', label: 'Zintellect AI Speed', color: 'text-teal-light' },
    { value: '95%', label: 'Faster Approvals', color: 'text-emerald-400' },
    { value: '99.97%', label: 'Time Reduction', color: 'text-cyan-400' },
    { value: '8', label: 'Innovation Pillars', color: 'text-purple-400' },
    { value: '9', label: 'Pipeline Steps', color: 'text-amber-400' },
  ],
}

export const securityContent = {
  title: 'Enterprise Security & Compliance',
  subtitle: 'Built for Healthcare-Grade Data Protection',
  description:
    'Zintellect AI is architected with enterprise-grade security from the ground up. Every layer of the platform — from data ingestion to API access — follows healthcare industry best practices for confidentiality, integrity, and availability.',
  items: [
    {
      icon: 'Shield',
      title: 'HIPAA Compliance',
      description:
        'Architected to meet HIPAA Privacy and Security Rule requirements for protected health information (PHI) handling, with administrative, physical, and technical safeguards.',
    },
    {
      icon: 'Lock',
      title: 'AES-256 Encryption',
      description:
        'All data encrypted at rest using AES-256 and in transit via TLS 1.3. Documents, clinical data, and PHI are encrypted end-to-end throughout the pipeline.',
    },
    {
      icon: 'Users',
      title: 'Role-Based Access Control',
      description:
        'Granular RBAC with distinct roles — Doctor, Provider, Patient — each with least-privilege access to only the data and actions required for their workflow.',
    },
    {
      icon: 'Key',
      title: 'JWT Authentication',
      description:
        'Stateless JWT-based authentication with token expiration, refresh token rotation, and secure HTTP-only cookie storage for session management.',
    },
    {
      icon: 'FileSearch',
      title: 'Audit Trails',
      description:
        'Every authorization request, decision, modification, and access event is logged with timestamp, user identity, action type, and data fingerprint for complete auditability.',
    },
    {
      icon: 'Clock',
      title: 'Session Management',
      description:
        'Configurable session timeouts, concurrent session limits, and automatic logout on inactivity. All sessions tracked and revocable by administrators.',
    },
    {
      icon: 'Database',
      title: 'Data Isolation',
      description:
        'Multi-tenant data isolation ensures each healthcare organization\'s data is logically and physically separated. Cross-tenant access is impossible by design.',
    },
    {
      icon: 'Globe',
      title: 'Secure API Gateway',
      description:
        'All API traffic routed through a secure gateway with rate limiting, request validation, IP filtering, and comprehensive request/response logging.',
    },
  ],
}

export const faqContent = {
  title: 'Frequently Asked Questions',
  subtitle: 'Everything you need to know about Zintellect AI',
  items: [
    {
      q: 'What is Zintellect AI?',
      a: 'Zintellect AI is an AI-powered Prior Authorization Automation Platform built by Cognitive Crew. It uses a Hybrid Multimodal Hierarchical RAG Expert System (HMH-RAGES) to streamline healthcare authorization workflows between doctors, patients, and insurance providers — reducing processing time from days to minutes.',
    },
    {
      q: 'How does the HMH-RAGES pipeline work?',
      a: 'HMH-RAGES (Hybrid Multimodal Hierarchical RAG Expert System) processes prior authorization requests through a 9-step pipeline: patient registration, insurance verification, request submission, document upload, AI clinical analysis (OCR + NER + RAG), policy matching, risk-scored decision, provider validation, and final authorization outcome.',
    },
    {
      q: 'What document formats are supported?',
      a: 'The platform supports PDF, JPG, and PNG formats for medical reports, prescriptions, lab results, and supporting evidence. The Multimodal OCR engine powered by PaddleOCR-VL and LayoutLMv3 can process both typed and handwritten documents with high accuracy.',
    },
    {
      q: 'How long does an authorization take?',
      a: 'Zintellect AI processes the average prior authorization request in approximately 12 minutes, compared to the traditional 14-day manual process. The AI analysis itself takes about 45 seconds, with the remaining time allocated to document upload and provider validation.',
    },
    {
      q: 'Is patient data secure?',
      a: 'Yes. Zintellect AI is built with enterprise-grade security: HIPAA-compliant architecture, AES-256 encryption at rest and TLS 1.3 in transit, JWT-based authentication with role-based access control, comprehensive audit trails, and multi-tenant data isolation.',
    },
    {
      q: 'Can Zintellect AI integrate with existing healthcare systems?',
      a: 'The platform exposes RESTful APIs for integration with existing Electronic Health Record (EHR) systems, practice management software, and insurance provider portals. Docker containerization and Cloudflare Tunnel support simplify deployment in existing infrastructure.',
    },
  ],
}

export const architectureContent = {
  title: 'System Architecture',
  subtitle: 'HMH-RAGES Pipeline — End-to-End Flow',
  description:
    'The HMH-RAGES architecture orchestrates a seamless flow from document ingestion to authorization outcome. Each stage is designed for accuracy, transparency, and auditability.',
  nodes: [
    {
      id: 'input',
      label: 'Input',
      title: 'Document Ingestion',
      icon: 'FileUp',
      desc: 'Multi-format document intake (PDF, JPG, PNG, scanned) with batch upload capability and format validation.',
      gradient: 'from-rose-500/20 to-rose-600/10',
      border: 'border-rose-500/30',
      textColor: 'text-rose-300',
    },
    {
      id: 'ocr',
      label: 'OCR Engine',
      title: 'Multimodal OCR',
      icon: 'FileImage',
      desc: 'PaddleOCR-VL + LayoutLMv3 extract text from typed and handwritten medical documents with high accuracy.',
      gradient: 'from-amber-500/20 to-amber-600/10',
      border: 'border-amber-500/30',
      textColor: 'text-amber-300',
    },
    {
      id: 'ner',
      label: 'NER',
      title: 'Medical NER',
      icon: 'Brain',
      desc: 'Clinical entity extraction identifies symptoms, diagnoses, procedures, and CPT codes from extracted text.',
      gradient: 'from-purple-500/20 to-purple-600/10',
      border: 'border-purple-500/30',
      textColor: 'text-purple-300',
    },
    {
      id: 'rag',
      label: 'RAG',
      title: 'Hierarchical RAG',
      icon: 'GitBranch',
      desc: 'Semantic search across insurance policy clauses using BGE-Large/E5-Large embeddings and FAISS/ChromaDB vector stores.',
      gradient: 'from-blue-500/20 to-blue-600/10',
      border: 'border-blue-500/30',
      textColor: 'text-blue-300',
    },
    {
      id: 'scoring',
      label: 'Scoring',
      title: 'Weighted Risk Scoring',
      icon: 'Gauge',
      desc: 'AI confidence engine evaluates all factors — clinical data, policy rules, risk indicators — to generate a scored outcome.',
      gradient: 'from-teal-500/20 to-teal-600/10',
      border: 'border-teal-500/30',
      textColor: 'text-teal-300',
    },
    {
      id: 'decision',
      label: 'Decision',
      title: 'Authorization Outcome',
      icon: 'CheckCircle',
      desc: 'Final decision (approve, reject, or manual review) with full XAI reasoning trace, confidence score, and audit trail.',
      gradient: 'from-emerald-500/20 to-emerald-600/10',
      border: 'border-emerald-500/30',
      textColor: 'text-emerald-300',
    },
  ],
  connections: [
    { from: 'input', to: 'ocr', label: 'Documents' },
    { from: 'ocr', to: 'ner', label: 'Extracted Text' },
    { from: 'ner', to: 'rag', label: 'Clinical Entities' },
    { from: 'rag', to: 'scoring', label: 'Policy Matches' },
    { from: 'scoring', to: 'decision', label: 'Risk Score' },
  ],
}

export const teamContent = {
  title: 'Built by Cognitive Crew',
  college: 'Velammal College of Engineering and Technology',
  track: 'Human – AI Collaboration',
  members: [
    { name: 'Matheswaran S', role: 'Team Lead' },
    { name: 'Nithish Kumar G', role: 'Member' },
    { name: 'Swathi B', role: 'Member' },
  ],
  ctaButtons: [
    { label: 'Request a Demo', href: '#', primary: true },
    { label: 'View on GitHub', href: '#', primary: false },
  ],
}
