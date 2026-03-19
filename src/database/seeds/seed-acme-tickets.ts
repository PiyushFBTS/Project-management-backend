/**
 * ACME Group — Project Phases & Tickets Seed
 *
 * Creates phases and tickets for all 4 ACME projects.
 * Safe to re-run: clears existing phases/tickets for the company first.
 *
 * Run with:
 *   npm run db:seed:tickets
 */
import 'reflect-metadata';
import { config } from 'dotenv';
config();

import { AppDataSource } from '../data-source';
import { AdminUser } from '../entities/admin-user.entity';
import { Employee } from '../entities/employee.entity';
import { Project } from '../entities/project.entity';
import { ProjectPhase, PhaseStatus } from '../entities/project-phase.entity';
import { ProjectTask, TaskPriority, ProjectTaskStatus } from '../entities/project-task.entity';

// ── Ticket counter (per project prefix) ──────────────────────────────────────
const ticketCounters: Record<string, number> = {};
function nextTicket(prefix: string): string {
  ticketCounters[prefix] = (ticketCounters[prefix] ?? 0) + 1;
  return `${prefix}-${String(ticketCounters[prefix]).padStart(3, '0')}`;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Phase + task definitions per project ─────────────────────────────────────

type TaskDef = {
  title: string;
  description: string;
  priority: TaskPriority;
  status: ProjectTaskStatus;
  estimatedHours: number;
  dueDaysFromNow: number; // positive = future, negative = past
};

type PhaseDef = {
  name: string;
  description: string;
  status: PhaseStatus;
  startDaysFromNow: number;
  endDaysFromNow: number;
  tasks: TaskDef[];
};

function d(offsetDays: number): string {
  const dt = new Date();
  dt.setDate(dt.getDate() + offsetDays);
  return dt.toISOString().slice(0, 10);
}

const PROJECT_DATA: Record<string, PhaseDef[]> = {
  'PRJ-001': [
    // ERP Implementation
    {
      name: 'Phase 1 — Requirements & Planning',
      description: 'Gather business requirements, define scope, and create project plan.',
      status: PhaseStatus.COMPLETED,
      startDaysFromNow: -90, endDaysFromNow: -70,
      tasks: [
        { title: 'Kickoff meeting with stakeholders', description: 'Conduct initial kickoff session with all key stakeholders to align on goals.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.DONE, estimatedHours: 4, dueDaysFromNow: -88 },
        { title: 'Business requirements document (BRD)', description: 'Draft and review the full Business Requirements Document covering all modules.', priority: TaskPriority.CRITICAL, status: ProjectTaskStatus.DONE, estimatedHours: 20, dueDaysFromNow: -82 },
        { title: 'AS-IS process mapping', description: 'Document current (AS-IS) business processes across Finance, HR, and Inventory.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.DONE, estimatedHours: 16, dueDaysFromNow: -80 },
        { title: 'TO-BE process design', description: 'Design future-state (TO-BE) workflows aligned with ERP capabilities.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.DONE, estimatedHours: 12, dueDaysFromNow: -75 },
        { title: 'Project plan & milestone schedule', description: 'Create detailed project plan with milestones, resource allocation, and timeline.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.DONE, estimatedHours: 8, dueDaysFromNow: -72 },
      ],
    },
    {
      name: 'Phase 2 — System Design & Architecture',
      description: 'Technical architecture, database design, and system configuration blueprint.',
      status: PhaseStatus.COMPLETED,
      startDaysFromNow: -70, endDaysFromNow: -45,
      tasks: [
        { title: 'Technical architecture document', description: 'Define server infrastructure, integration points, and deployment architecture.', priority: TaskPriority.CRITICAL, status: ProjectTaskStatus.DONE, estimatedHours: 16, dueDaysFromNow: -65 },
        { title: 'Database schema design', description: 'Design the core database schema for Finance, Inventory, and HR modules.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.DONE, estimatedHours: 20, dueDaysFromNow: -60 },
        { title: 'ERP configuration blueprint', description: 'Prepare the system configuration document covering chart of accounts, warehouses, and HR setup.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.DONE, estimatedHours: 24, dueDaysFromNow: -55 },
        { title: 'Integration design — third-party APIs', description: 'Design integration specs for payment gateway, logistics, and tax APIs.', priority: TaskPriority.MEDIUM, status: ProjectTaskStatus.DONE, estimatedHours: 12, dueDaysFromNow: -50 },
        { title: 'Security & access control design', description: 'Define role-based access control matrix and security hardening plan.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.DONE, estimatedHours: 8, dueDaysFromNow: -47 },
      ],
    },
    {
      name: 'Phase 3 — Development & Configuration',
      description: 'Core module development, customisations, and system configuration.',
      status: PhaseStatus.IN_PROGRESS,
      startDaysFromNow: -45, endDaysFromNow: 15,
      tasks: [
        { title: 'Finance module — GL & AP setup', description: 'Configure General Ledger, Accounts Payable workflows, and chart of accounts.', priority: TaskPriority.CRITICAL, status: ProjectTaskStatus.DONE, estimatedHours: 32, dueDaysFromNow: -35 },
        { title: 'Inventory module — warehouse management', description: 'Set up warehouse zones, bin locations, and stock movement workflows.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.DONE, estimatedHours: 28, dueDaysFromNow: -28 },
        { title: 'HR module — payroll integration', description: 'Integrate payroll engine with attendance and leave management modules.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.IN_PROGRESS, estimatedHours: 36, dueDaysFromNow: -5 },
        { title: 'Custom dashboard — management reports', description: 'Build role-based dashboards for CEO, Finance Head, and Operations Manager.', priority: TaskPriority.MEDIUM, status: ProjectTaskStatus.IN_PROGRESS, estimatedHours: 24, dueDaysFromNow: 5 },
        { title: 'Payment gateway integration', description: 'Integrate Razorpay / HDFC payment gateway for AR module.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.IN_REVIEW, estimatedHours: 16, dueDaysFromNow: 0 },
        { title: 'Data migration — legacy system', description: 'Extract, transform, and load historical data from the legacy ERP.', priority: TaskPriority.CRITICAL, status: ProjectTaskStatus.TODO, estimatedHours: 40, dueDaysFromNow: 12 },
        { title: 'Email notification service', description: 'Build automated email alerts for PO approvals, invoice due dates, and low-stock alerts.', priority: TaskPriority.MEDIUM, status: ProjectTaskStatus.TODO, estimatedHours: 12, dueDaysFromNow: 15 },
      ],
    },
    {
      name: 'Phase 4 — Testing & UAT',
      description: 'System testing, user acceptance testing, and defect resolution.',
      status: PhaseStatus.NOT_STARTED,
      startDaysFromNow: 16, endDaysFromNow: 35,
      tasks: [
        { title: 'Unit testing — Finance module', description: 'Write and execute unit tests for all Finance module APIs and calculations.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.TODO, estimatedHours: 20, dueDaysFromNow: 18 },
        { title: 'Integration testing — all modules', description: 'End-to-end integration testing across Finance, Inventory, and HR.', priority: TaskPriority.CRITICAL, status: ProjectTaskStatus.TODO, estimatedHours: 32, dueDaysFromNow: 24 },
        { title: 'UAT — Finance team', description: 'Coordinate UAT sessions with client Finance team and document sign-offs.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.TODO, estimatedHours: 16, dueDaysFromNow: 28 },
        { title: 'UAT — Operations team', description: 'Coordinate UAT sessions with Operations and Warehouse managers.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.TODO, estimatedHours: 16, dueDaysFromNow: 30 },
        { title: 'Performance & load testing', description: 'Run load tests simulating 500 concurrent users on critical workflows.', priority: TaskPriority.MEDIUM, status: ProjectTaskStatus.TODO, estimatedHours: 12, dueDaysFromNow: 33 },
        { title: 'Defect resolution & regression', description: 'Fix all P1/P2 defects found during UAT and run regression suite.', priority: TaskPriority.CRITICAL, status: ProjectTaskStatus.TODO, estimatedHours: 24, dueDaysFromNow: 35 },
      ],
    },
    {
      name: 'Phase 5 — Deployment & Go-Live',
      description: 'Production deployment, hypercare, and project closure.',
      status: PhaseStatus.NOT_STARTED,
      startDaysFromNow: 36, endDaysFromNow: 50,
      tasks: [
        { title: 'Production environment setup', description: 'Configure production servers, SSL, and security groups.', priority: TaskPriority.CRITICAL, status: ProjectTaskStatus.TODO, estimatedHours: 8, dueDaysFromNow: 37 },
        { title: 'Final data migration — cutover', description: 'Execute final delta data migration and freeze legacy system.', priority: TaskPriority.CRITICAL, status: ProjectTaskStatus.TODO, estimatedHours: 16, dueDaysFromNow: 40 },
        { title: 'Go-live deployment', description: 'Deploy all modules to production with rollback plan on standby.', priority: TaskPriority.CRITICAL, status: ProjectTaskStatus.TODO, estimatedHours: 8, dueDaysFromNow: 42 },
        { title: 'Hypercare support (week 1)', description: 'On-site support during first week post go-live for all business units.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.TODO, estimatedHours: 40, dueDaysFromNow: 49 },
        { title: 'Project closure & handover', description: 'Prepare closure report, hand over documentation, and conduct lessons learned.', priority: TaskPriority.MEDIUM, status: ProjectTaskStatus.TODO, estimatedHours: 8, dueDaysFromNow: 50 },
      ],
    },
  ],

  'SUP-001': [
    // Production Support
    {
      name: 'Phase 1 — Onboarding & Assessment',
      description: 'Understand existing production environment and establish support baseline.',
      status: PhaseStatus.COMPLETED,
      startDaysFromNow: -60, endDaysFromNow: -45,
      tasks: [
        { title: 'Environment documentation review', description: 'Review existing architecture docs, runbooks, and incident history.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.DONE, estimatedHours: 8, dueDaysFromNow: -58 },
        { title: 'Access provisioning — all systems', description: 'Provision team access to production, staging, monitoring, and ticketing tools.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.DONE, estimatedHours: 4, dueDaysFromNow: -55 },
        { title: 'SLA & escalation matrix definition', description: 'Define P1–P4 SLA targets and escalation paths with client team.', priority: TaskPriority.CRITICAL, status: ProjectTaskStatus.DONE, estimatedHours: 6, dueDaysFromNow: -50 },
        { title: 'Initial health check — infrastructure', description: 'Run full health check on servers, DBs, queues, and external integrations.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.DONE, estimatedHours: 12, dueDaysFromNow: -47 },
      ],
    },
    {
      name: 'Phase 2 — Stabilisation',
      description: 'Resolve backlog of known issues and stabilise the production environment.',
      status: PhaseStatus.COMPLETED,
      startDaysFromNow: -45, endDaysFromNow: -20,
      tasks: [
        { title: '[P1] Fix memory leak in order processing service', description: 'Identify and patch the memory leak causing weekly restarts in the order service.', priority: TaskPriority.CRITICAL, status: ProjectTaskStatus.DONE, estimatedHours: 16, dueDaysFromNow: -42 },
        { title: 'Optimise slow dashboard queries', description: 'Add missing indexes and rewrite 3 slow reports that exceed 10s load time.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.DONE, estimatedHours: 12, dueDaysFromNow: -38 },
        { title: 'Scheduled job — cleanup orphaned records', description: 'Write and deploy nightly cleanup job for orphaned cart and session records.', priority: TaskPriority.MEDIUM, status: ProjectTaskStatus.DONE, estimatedHours: 8, dueDaysFromNow: -32 },
        { title: 'SSL certificate renewal', description: 'Renew wildcard SSL certificate and update all load balancer configs.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.DONE, estimatedHours: 4, dueDaysFromNow: -28 },
        { title: 'Alert tuning — reduce false positives', description: 'Review 45 active alerts and suppress/tune 20+ low-value noise alerts.', priority: TaskPriority.MEDIUM, status: ProjectTaskStatus.DONE, estimatedHours: 8, dueDaysFromNow: -22 },
      ],
    },
    {
      name: 'Phase 3 — Ongoing Maintenance',
      description: 'Continuous support, monitoring, minor enhancements, and monthly patching.',
      status: PhaseStatus.IN_PROGRESS,
      startDaysFromNow: -20, endDaysFromNow: 90,
      tasks: [
        { title: '[P2] Email delivery failure — SMTP timeout', description: 'Investigate intermittent SMTP timeouts causing email delivery failures for order confirmations.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.IN_PROGRESS, estimatedHours: 6, dueDaysFromNow: -2 },
        { title: 'Monthly security patching — March', description: 'Apply OS and middleware security patches on all production nodes during maintenance window.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.IN_REVIEW, estimatedHours: 8, dueDaysFromNow: 0 },
        { title: 'Add pagination to export API', description: 'Client reported timeout on export-all endpoint. Add cursor-based pagination.', priority: TaskPriority.MEDIUM, status: ProjectTaskStatus.TODO, estimatedHours: 8, dueDaysFromNow: 5 },
        { title: 'DB backup verification — quarterly', description: 'Restore and verify DB backups on DR environment as per quarterly DR drill.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.TODO, estimatedHours: 6, dueDaysFromNow: 10 },
        { title: 'Performance review — Q1 report', description: 'Prepare Q1 support metrics report: ticket volume, SLA adherence, MTTR.', priority: TaskPriority.MEDIUM, status: ProjectTaskStatus.TODO, estimatedHours: 4, dueDaysFromNow: 14 },
        { title: '[P3] UI glitch on mobile Safari — checkout page', description: 'Fix layout overflow bug on checkout confirmation page on iOS Safari 17.', priority: TaskPriority.LOW, status: ProjectTaskStatus.TODO, estimatedHours: 4, dueDaysFromNow: 20 },
      ],
    },
  ],

  'PRJ-002': [
    // CRM Migration
    {
      name: 'Phase 1 — Discovery & Data Analysis',
      description: 'Analyse Salesforce data model, volume, and quality before migration.',
      status: PhaseStatus.COMPLETED,
      startDaysFromNow: -55, endDaysFromNow: -38,
      tasks: [
        { title: 'Salesforce data model audit', description: 'Document all Salesforce objects, fields, relationships, and custom metadata.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.DONE, estimatedHours: 16, dueDaysFromNow: -52 },
        { title: 'Data volume & quality assessment', description: 'Profile data quality: identify duplicates, nulls, and format inconsistencies across all objects.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.DONE, estimatedHours: 12, dueDaysFromNow: -48 },
        { title: 'Field mapping document — SF to in-house CRM', description: 'Create field-by-field mapping between Salesforce and target CRM schema.', priority: TaskPriority.CRITICAL, status: ProjectTaskStatus.DONE, estimatedHours: 20, dueDaysFromNow: -44 },
        { title: 'Migration risk assessment', description: 'Identify high-risk data sets, complex relationships, and rollback triggers.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.DONE, estimatedHours: 8, dueDaysFromNow: -40 },
      ],
    },
    {
      name: 'Phase 2 — ETL Development',
      description: 'Build extract, transform, and load pipelines for all CRM data.',
      status: PhaseStatus.IN_PROGRESS,
      startDaysFromNow: -38, endDaysFromNow: 10,
      tasks: [
        { title: 'ETL pipeline — Accounts & Contacts', description: 'Build and test ETL for 45,000 Account and 120,000 Contact records.', priority: TaskPriority.CRITICAL, status: ProjectTaskStatus.DONE, estimatedHours: 24, dueDaysFromNow: -30 },
        { title: 'ETL pipeline — Opportunities & Deals', description: 'Migrate Opportunity pipeline with stage history and associated activities.', priority: TaskPriority.CRITICAL, status: ProjectTaskStatus.DONE, estimatedHours: 28, dueDaysFromNow: -22 },
        { title: 'ETL pipeline — Activity & Email history', description: 'Migrate 500K+ email and activity records with thread linking.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.IN_PROGRESS, estimatedHours: 32, dueDaysFromNow: 2 },
        { title: 'Custom object migration — Products & Pricelists', description: 'Migrate custom product catalogue and multi-currency pricelist configurations.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.IN_PROGRESS, estimatedHours: 20, dueDaysFromNow: 5 },
        { title: 'Attachment & file migration', description: 'Migrate ~20GB of attached documents from Salesforce Files to S3.', priority: TaskPriority.MEDIUM, status: ProjectTaskStatus.TODO, estimatedHours: 16, dueDaysFromNow: 8 },
        { title: 'Data reconciliation report', description: 'Build automated reconciliation report comparing source vs target record counts and key fields.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.TODO, estimatedHours: 12, dueDaysFromNow: 10 },
      ],
    },
    {
      name: 'Phase 3 — Testing & Validation',
      description: 'Validate migrated data and run user acceptance testing.',
      status: PhaseStatus.NOT_STARTED,
      startDaysFromNow: 11, endDaysFromNow: 28,
      tasks: [
        { title: 'Data validation — Accounts & Contacts', description: 'Spot-check 500 records and run automated validation rules on all migrated accounts.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.TODO, estimatedHours: 12, dueDaysFromNow: 13 },
        { title: 'Data validation — Opportunities', description: 'Validate opportunity history, stage transitions, and revenue calculations.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.TODO, estimatedHours: 10, dueDaysFromNow: 16 },
        { title: 'UAT — Sales team (wave 1)', description: 'First wave UAT with 10 sales reps: verify their accounts, contacts, and pipeline view.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.TODO, estimatedHours: 16, dueDaysFromNow: 20 },
        { title: 'UAT — Sales managers (wave 2)', description: 'Second wave UAT focusing on dashboards, reports, and forecast views.', priority: TaskPriority.MEDIUM, status: ProjectTaskStatus.TODO, estimatedHours: 12, dueDaysFromNow: 24 },
        { title: 'Sign-off and cutover go/no-go', description: 'Present validation results and get formal go/no-go approval for cutover.', priority: TaskPriority.CRITICAL, status: ProjectTaskStatus.TODO, estimatedHours: 4, dueDaysFromNow: 28 },
      ],
    },
    {
      name: 'Phase 4 — Cutover & Go-Live',
      description: 'Final cutover from Salesforce, user training, and post-go-live support.',
      status: PhaseStatus.NOT_STARTED,
      startDaysFromNow: 29, endDaysFromNow: 45,
      tasks: [
        { title: 'Delta migration — final sync', description: 'Perform final incremental sync of records changed during UAT period.', priority: TaskPriority.CRITICAL, status: ProjectTaskStatus.TODO, estimatedHours: 8, dueDaysFromNow: 30 },
        { title: 'Salesforce sandbox freeze', description: 'Freeze Salesforce writes and redirect all users to new CRM.', priority: TaskPriority.CRITICAL, status: ProjectTaskStatus.TODO, estimatedHours: 4, dueDaysFromNow: 32 },
        { title: 'User training — all sales reps', description: 'Conduct 3-hour training sessions for 45 sales reps on the new CRM.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.TODO, estimatedHours: 24, dueDaysFromNow: 38 },
        { title: 'Go-live monitoring — week 1', description: 'Dedicated on-call monitoring and rapid response for first week post-cutover.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.TODO, estimatedHours: 40, dueDaysFromNow: 44 },
        { title: 'Salesforce licence decommission plan', description: 'Prepare plan and timeline for cancelling Salesforce licences post go-live.', priority: TaskPriority.MEDIUM, status: ProjectTaskStatus.TODO, estimatedHours: 4, dueDaysFromNow: 45 },
      ],
    },
  ],

  'PRJ-003': [
    // Mobile App Development
    {
      name: 'Phase 1 — Discovery & Wireframes',
      description: 'Define app features, user flows, and create low-fidelity wireframes.',
      status: PhaseStatus.COMPLETED,
      startDaysFromNow: -75, endDaysFromNow: -55,
      tasks: [
        { title: 'User research & persona definition', description: 'Interview 15 end users and define primary and secondary personas for the app.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.DONE, estimatedHours: 12, dueDaysFromNow: -72 },
        { title: 'Feature list & user story mapping', description: 'Create full product backlog with epics, user stories, and acceptance criteria.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.DONE, estimatedHours: 16, dueDaysFromNow: -68 },
        { title: 'Low-fidelity wireframes — iOS & Android', description: 'Create wireframes for all 25 screens covering onboarding, dashboard, and key flows.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.DONE, estimatedHours: 20, dueDaysFromNow: -62 },
        { title: 'Wireframe review & sign-off', description: 'Present wireframes to client stakeholders and get written sign-off.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.DONE, estimatedHours: 4, dueDaysFromNow: -57 },
      ],
    },
    {
      name: 'Phase 2 — UI/UX Design',
      description: 'High-fidelity UI design, design system, and interactive prototypes.',
      status: PhaseStatus.COMPLETED,
      startDaysFromNow: -55, endDaysFromNow: -30,
      tasks: [
        { title: 'Design system — colours, typography, components', description: 'Build the design system library with all base components in Figma.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.DONE, estimatedHours: 20, dueDaysFromNow: -52 },
        { title: 'High-fidelity screens — onboarding flow', description: 'Design pixel-perfect onboarding, login, and registration screens.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.DONE, estimatedHours: 16, dueDaysFromNow: -48 },
        { title: 'High-fidelity screens — dashboard & home', description: 'Design main dashboard, notifications, and home screen.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.DONE, estimatedHours: 20, dueDaysFromNow: -42 },
        { title: 'High-fidelity screens — core feature flows', description: 'Design all 12 core feature screens: task management, profile, reports.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.DONE, estimatedHours: 32, dueDaysFromNow: -35 },
        { title: 'Interactive prototype & client review', description: 'Build clickable Figma prototype and present to client for approval.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.DONE, estimatedHours: 8, dueDaysFromNow: -31 },
      ],
    },
    {
      name: 'Phase 3 — Frontend Development',
      description: 'React Native implementation of all screens and navigation.',
      status: PhaseStatus.IN_PROGRESS,
      startDaysFromNow: -30, endDaysFromNow: 20,
      tasks: [
        { title: 'Project scaffolding — React Native + navigation', description: 'Set up React Native project with Expo, navigation stack, and CI config.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.DONE, estimatedHours: 8, dueDaysFromNow: -28 },
        { title: 'Onboarding & auth screens', description: 'Implement splash, onboarding carousel, login, register, and forgot-password screens.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.DONE, estimatedHours: 20, dueDaysFromNow: -20 },
        { title: 'Dashboard & home screen', description: 'Implement main dashboard with summary cards and quick-action buttons.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.DONE, estimatedHours: 16, dueDaysFromNow: -14 },
        { title: 'Task management screens', description: 'Implement task list, task detail, create-task, and task filter screens.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.IN_PROGRESS, estimatedHours: 24, dueDaysFromNow: -3 },
        { title: 'Push notification integration', description: 'Integrate Firebase Cloud Messaging for push notifications on iOS and Android.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.IN_PROGRESS, estimatedHours: 12, dueDaysFromNow: 3 },
        { title: 'Profile & settings screens', description: 'Implement user profile, avatar upload, notification preferences, and dark mode toggle.', priority: TaskPriority.MEDIUM, status: ProjectTaskStatus.TODO, estimatedHours: 16, dueDaysFromNow: 10 },
        { title: 'Offline mode & local caching', description: 'Implement Redux Persist + SQLite caching for core data to support offline usage.', priority: TaskPriority.MEDIUM, status: ProjectTaskStatus.TODO, estimatedHours: 20, dueDaysFromNow: 18 },
      ],
    },
    {
      name: 'Phase 4 — Backend Integration',
      description: 'Connect mobile app to REST APIs, authentication, and real-time features.',
      status: PhaseStatus.NOT_STARTED,
      startDaysFromNow: 21, endDaysFromNow: 45,
      tasks: [
        { title: 'JWT authentication & refresh token flow', description: 'Implement secure auth with JWT, refresh token rotation, and biometric login.', priority: TaskPriority.CRITICAL, status: ProjectTaskStatus.TODO, estimatedHours: 16, dueDaysFromNow: 22 },
        { title: 'API integration — dashboard data', description: 'Connect all dashboard widgets to live API endpoints.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.TODO, estimatedHours: 12, dueDaysFromNow: 26 },
        { title: 'API integration — task CRUD', description: 'Integrate task create, update, delete, and status-change APIs with optimistic UI.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.TODO, estimatedHours: 16, dueDaysFromNow: 30 },
        { title: 'WebSocket — real-time notifications', description: 'Implement WebSocket connection for real-time task updates and chat notifications.', priority: TaskPriority.MEDIUM, status: ProjectTaskStatus.TODO, estimatedHours: 20, dueDaysFromNow: 36 },
        { title: 'File upload — photo & attachment', description: 'Implement photo capture and file attachment upload to S3 from mobile.', priority: TaskPriority.MEDIUM, status: ProjectTaskStatus.TODO, estimatedHours: 12, dueDaysFromNow: 42 },
        { title: 'API error handling & retry logic', description: 'Implement global error handling, exponential backoff retries, and user-facing error states.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.TODO, estimatedHours: 8, dueDaysFromNow: 44 },
      ],
    },
    {
      name: 'Phase 5 — QA & App Store Release',
      description: 'Testing, performance optimisation, and publishing to App Store & Play Store.',
      status: PhaseStatus.NOT_STARTED,
      startDaysFromNow: 46, endDaysFromNow: 65,
      tasks: [
        { title: 'QA — functional test cases (250 cases)', description: 'Execute 250 functional test cases across all screens on iOS and Android.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.TODO, estimatedHours: 32, dueDaysFromNow: 48 },
        { title: 'Device compatibility testing', description: 'Test on 12 device/OS combinations: iPhone 13/14/15, Pixel 7/8, Samsung S23/S24.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.TODO, estimatedHours: 16, dueDaysFromNow: 52 },
        { title: 'Performance profiling & optimisation', description: 'Profile app startup time, memory usage, and scroll performance. Target <2s cold start.', priority: TaskPriority.MEDIUM, status: ProjectTaskStatus.TODO, estimatedHours: 12, dueDaysFromNow: 55 },
        { title: 'App Store submission — iOS', description: 'Prepare app store listing, screenshots, and submit for Apple review.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.TODO, estimatedHours: 8, dueDaysFromNow: 60 },
        { title: 'Play Store submission — Android', description: 'Prepare Play Store listing, signed APK, and submit for Google review.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.TODO, estimatedHours: 6, dueDaysFromNow: 61 },
        { title: 'Post-release monitoring — week 1', description: 'Monitor crash reports via Sentry, review user reviews, and push hotfix if needed.', priority: TaskPriority.HIGH, status: ProjectTaskStatus.TODO, estimatedHours: 20, dueDaysFromNow: 65 },
      ],
    },
  ],
};

// ── Main ──────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('Connecting to database…');
  await AppDataSource.initialize();
  console.log('Connected.\n');

  // ── Find ACME company ────────────────────────────────────────────────────────
  const adminRepo = AppDataSource.getRepository(AdminUser);
  const acmeAdmin = await adminRepo.findOne({ where: { email: 'admin@acme.com' } });
  if (!acmeAdmin?.companyId) {
    throw new Error('Could not find ACME admin (admin@acme.com). Run the main seed first.');
  }
  const companyId = acmeAdmin.companyId;
  console.log(`[Company] ACME Group — id: ${companyId}`);

  // ── Load resources ───────────────────────────────────────────────────────────
  const projRepo = AppDataSource.getRepository(Project);
  const phaseRepo = AppDataSource.getRepository(ProjectPhase);
  const taskRepo = AppDataSource.getRepository(ProjectTask);
  const empRepo = AppDataSource.getRepository(Employee);

  const projects = await projRepo.find({ where: { companyId } });
  const employees = await empRepo.find({ where: { companyId, isActive: true } });

  // ── Clear existing phases & tasks ────────────────────────────────────────────
  const existingPhases = await phaseRepo.count({ where: { companyId } });
  const existingTasks = await taskRepo.count({ where: { companyId } });
  if (existingPhases > 0 || existingTasks > 0) {
    await taskRepo.createQueryBuilder().delete().where('company_id = :companyId', { companyId }).execute();
    await phaseRepo.createQueryBuilder().delete().where('company_id = :companyId', { companyId }).execute();
    console.log(`[Cleared] ${existingTasks} tasks, ${existingPhases} phases.\n`);
  }

  let totalPhases = 0;
  let totalTasks = 0;

  for (const project of projects) {
    const phaseDefs = PROJECT_DATA[project.projectCode];
    if (!phaseDefs) {
      console.log(`[Project] ${project.projectCode} — no phase data defined, skipping.`);
      continue;
    }

    console.log(`\n[Project] ${project.projectCode} — ${project.projectName}`);

    // Reset ticket counter per project
    const ticketPrefix = project.projectCode.replace('-', '');

    for (let pi = 0; pi < phaseDefs.length; pi++) {
      const pd = phaseDefs[pi];

      const phase = await phaseRepo.save(
        phaseRepo.create({
          projectId: project.id,
          name: pd.name,
          description: pd.description,
          status: pd.status,
          startDate: d(pd.startDaysFromNow),
          endDate: d(pd.endDaysFromNow),
          sortOrder: pi + 1,
          companyId,
        }),
      );
      totalPhases++;

      console.log(`  ├─ ${pd.name} [${pd.status}] — ${pd.tasks.length} tickets`);

      for (let ti = 0; ti < pd.tasks.length; ti++) {
        const td = pd.tasks[ti];
        const ticket = nextTicket(ticketPrefix);

        // Assign random employee as assignee for in-progress / done tasks
        const shouldAssign = td.status !== ProjectTaskStatus.TODO;
        const assigneeId = shouldAssign ? pick(employees).id : null;

        await taskRepo.save(
          taskRepo.create({
            projectId: project.id,
            phaseId: phase.id,
            ticketNumber: ticket,
            title: td.title,
            description: td.description,
            priority: td.priority,
            status: td.status,
            estimatedHours: td.estimatedHours,
            dueDate: d(td.dueDaysFromNow),
            assigneeId,
            sortOrder: ti + 1,
            companyId,
          }),
        );
        totalTasks++;
      }
    }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`[Done] Created ${totalPhases} phases and ${totalTasks} tickets across ${projects.length} projects.`);
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
