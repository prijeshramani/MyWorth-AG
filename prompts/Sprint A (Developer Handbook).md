# Sprint A - Developer Handbook

## Context

The Family Wealth OS architecture has been approved.

The following documents already exist and are considered the current baseline:

- CURRENT_STATE.md
- TARGET_ARCHITECTURE.md
- DOMAIN_MODEL.md
- DATABASE_MIGRATION_PLAN.md
- API_MIGRATION_PLAN.md
- FRONTEND_MIGRATION_PLAN.md
- TECHNICAL_DEBT_ROADMAP.md
- SECURITY_REVIEW.md
- MVP_SCOPE.md
- ARCHITECTURE_DECISIONS.md
- PROJECT_CHARTER.md
- Product Vision documents

DO NOT rewrite these documents.

Create only NEW documents.

These documents will become the permanent Developer Handbook.

This handbook should be written as if onboarding a senior software engineer joining the project.

No production code.

No React components.

No SQL migrations.

Documentation only.

--------------------------------------------------

Create the following files.

01_ARCHITECTURE_PRINCIPLES.md

Include:

- Core architectural principles
- Evolution before Replacement
- Local First
- Privacy First
- Knowledge Driven
- Configuration over Hardcoding
- Separation of Concerns
- Domain Driven Design
- SOLID
- YAGNI
- KISS
- DRY

Explain WHY each principle exists.

--------------------------------------------------

02_CODING_STANDARDS.md

Include:

Backend standards

Frontend standards

Naming conventions

Folder naming

File naming

Interfaces

Enums

DTOs

Repositories

Services

Controllers

Hooks

React components

Import ordering

Error handling

Logging

Comments

TypeScript strictness

Formatting

ESLint

Prettier

--------------------------------------------------

03_DEFINITION_OF_DONE.md

A feature is complete only if

Requirements approved

Architecture reviewed

Code written

Tests added

Documentation updated

Migration tested

Security reviewed

Performance reviewed

Accessibility reviewed

Manual validation completed

Git tag created

--------------------------------------------------

04_GIT_WORKFLOW.md

Branch strategy

Commit message convention

Feature branches

Release tags

Hotfix flow

Pull Request checklist

Merge strategy

--------------------------------------------------

05_ERROR_HANDLING_STANDARD.md

Backend

Frontend

API

Validation

Database

Unexpected exceptions

User-friendly messages

Logging strategy

--------------------------------------------------

06_LOGGING_STANDARD.md

Log levels

Correlation IDs

Audit logs

Financial logs

Security logs

Performance logs

Sensitive data masking

--------------------------------------------------

07_TESTING_STANDARD.md

Unit tests

Integration tests

Financial calculation tests

Migration tests

Security tests

Performance tests

Regression tests

Coverage expectations

--------------------------------------------------

08_AI_DEVELOPMENT_STANDARD.md

How AI should interact with the project.

How prompts should be written.

How AI should review code.

How AI should avoid changing architecture.

How AI should update documentation.

How AI should handle business rules.

--------------------------------------------------

09_REVIEW_CHECKLIST.md

Architecture checklist

Security checklist

Performance checklist

UI checklist

Financial correctness checklist

Documentation checklist

--------------------------------------------------

10_DEVELOPER_ONBOARDING.md

A new developer should be able to join the project by reading only this document.

Explain:

Project vision

Folder structure

How to run

How to test

How to create features

How to create ADRs

How to work with AI

How to submit pull requests

Common mistakes to avoid

--------------------------------------------------

11_PROJECT_GLOSSARY.md

Financial terms

Technical terms

Project-specific terminology

Abbreviations

Domain definitions

--------------------------------------------------

12_RELEASE_PROCESS.md

Development

Testing

Release Candidate

Production Release

Rollback

Backup strategy

--------------------------------------------------

--------------------------------------------------

13_SESSION_CONTEXT_STANDARD.md

Design the specification for a file named:

.ai/SESSION_CONTEXT.md

This file will act as the persistent engineering memory between AI sessions.

Every development session MUST update this file before completion.

The specification should define the structure, required sections, and update rules.

The file should include the following sections.

--------------------------------------------------

# Current Sprint

Sprint Number

Sprint Goal

Current Status

Completion Percentage

--------------------------------------------------

# Current Branch

Git Branch

Last Commit

Pending Pull Requests

--------------------------------------------------

# Current Feature

Feature Name

Specification Document

Implementation Status

Dependencies

--------------------------------------------------

# Files Modified

List every file changed during the session.

Explain WHY each file changed.

--------------------------------------------------

# Architecture Decisions

List any new ADRs created.

List any architecture changes.

Reference ADR numbers.

--------------------------------------------------

# Business Rules Added

Document every new financial/business rule introduced.

Reference the configuration file where the rule is stored.

--------------------------------------------------

# Database Changes

New Tables

New Columns

New Indexes

Migration Scripts

Rollback Notes

--------------------------------------------------

# API Changes

New Endpoints

Modified Endpoints

Deprecated Endpoints

Breaking Changes

--------------------------------------------------

# UI Changes

New Screens

Modified Components

Deleted Components

Navigation Changes

--------------------------------------------------

# Technical Debt

Technical debt introduced.

Technical debt removed.

Future cleanup items.

--------------------------------------------------

# Known Issues

Open Bugs

Limitations

Temporary Workarounds

--------------------------------------------------

# Test Status

Unit Tests

Integration Tests

Financial Tests

Migration Tests

Coverage

--------------------------------------------------

# Next Recommended Task

Exactly ONE recommendation.

Explain why it is the highest priority.

Do not recommend multiple tasks.

--------------------------------------------------

# Blockers

Anything preventing progress.

Missing requirements.

Missing decisions.

Missing documentation.

--------------------------------------------------

# Notes for Next AI Session

Provide a concise summary explaining:

Current project state.

Current sprint.

Recent work completed.

Important assumptions.

Files that should be read before continuing.

Potential risks.

--------------------------------------------------

Rules

This file MUST be updated at the end of every development session.

It becomes the primary context file for all future AI sessions.

Every new AI session should begin by reading:

1. .ai/SESSION_CONTEXT.md
2. PROJECT_CHARTER.md
3. TARGET_ARCHITECTURE.md
4. Current Sprint Specification

Only after reading these files should implementation continue.

Quality Requirements

Every document must:

- Use professional Markdown
- Include diagrams where helpful (Mermaid)
- Be internally consistent with existing documentation
- Cross-reference existing architecture documents
- Avoid duplication where possible
- Be suitable for a long-lived software project

Think like a Principal Software Architect writing an engineering handbook for a product expected to evolve over the next 20 years.