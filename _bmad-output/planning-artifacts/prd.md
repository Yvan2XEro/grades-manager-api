---
stepsCompleted:
  - step-01-init
  - step-02-discovery
inputDocuments:
  - path: _bmad-output/planning-artifacts/retake-exams-analysis.md
    description: Retake exams product/domain analysis
  - path: docs/PROMOTION_RULES_GUIDE.md
    description: Promotion rules system overview and rule facts
  - path: docs/admin-exam-enhancements.md
    description: Admin exam management enhancements
  - path: docs/exam-grade-delegation.md
    description: Exam grade delegation design notes
  - path: docs/architecture.md
    description: System architecture snapshot and constraints
documentCounts:
  productBriefs: 0
  research: 0
  brainstorming: 0
  projectDocs: 5
workflowType: 'prd'
lastStep: 1
lastStep: 2
---

# Product Requirements Document - TKAMS (Tefoye and Kana Academic Management System)

**Author:** Yvan  
**Date:** 2026-01-09

## Executive Summary

TKAMS already tracks exams, grades, and promotion facts, but retake sessions are only inferred through ad-hoc data. This effort introduces a first-class “retake exam” session that pairs directly with the original exam while reusing the existing scheduling, validation, and ledger pipelines. Registrars will see who qualifies for a retake, create a linked session, and monitor the outcome; teachers will grade inside a dedicated retake context that preserves the original attempt; student ledgers and promotion facts will refresh automatically when a retake is validated. The result is an auditable retake lifecycle without rewriting core exam models.

### What Makes This Special

- Elevates rattrapage from an implied rule to an explicit workflow, removing registrar spreadsheets and teacher confusion.
- Keeps delivery minimal by leaning on today’s exam, grade, and promotion services while adding the session linkage, policy flags, and ledger triggers required for compliance.
- Creates a single source of truth for eligibility, scheduling, grading, and promotion impact so academic decisions are traceable.

## Project Classification

**Technical Type:** web_app (API-backed admin + teacher workflows)  
**Domain:** edtech  
**Complexity:** medium  
**Project Context:** Brownfield - extending existing system

Retake exams are modeled as a new session type attached to existing exams, respecting TKAMS’ Bun/Hono/tRPC back end, Drizzle schema, Better Auth context, and React/Vite client shell. The work spans registrar scheduling UI, teacher grading UX, and promotion recalculation, but stays within the current service boundaries—no new analytics stacks or batch jobs in MVP.
