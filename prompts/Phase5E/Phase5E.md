# FamilyWealthOS — Phase 5E Implementation Prompt
## Authentication, Authorization & Platform Security Foundation

---

# Context

You are continuing implementation of **FamilyWealthOS**.

Previous phases are COMPLETE.

Phase 5D completed:

- Investment Domain
- Protection & Insurance Domain
- Backend REST APIs
- SQLite Migrations
- React Frontend
- TanStack Query
- Repository Pattern
- Application Services
- Shared UI Components
- Tests Passing (144 Passed)
- Clean Production Build

Do NOT redesign existing architecture.

Respect every existing architectural decision.

---

# Objective

Implement the complete security foundation of FamilyWealthOS.

This phase introduces:

- Authentication
- Authorization
- Multi-tenancy
- Audit Logging
- Session Management
- API Security
- Secure Storage
- Security Middleware

This phase MUST NOT change business logic.

Only introduce platform security.

---

# Architecture Principles

Continue existing architecture.

Repository

↓

Application Service

↓

Controller

↓

Routes

↓

Frontend Service

↓

TanStack Query

↓

React Components

Never bypass Application Services.

Never access repositories directly from controllers.

---

# NON-NEGOTIABLE RULES

## DO NOT MODIFY

Investment Engine

Portfolio Summary

XIRR Engine

Net Worth Engine

Protection Engine

Insurance Repository Logic

Financial Calculations

Existing Database Tables

Existing APIs

Existing Components

Existing Dashboard Logic

---

# Phase 5E Deliverables

## Backend

Create

/auth

domain

including

AuthenticationRepository

AuthenticationService

AuthenticationController

AuthenticationRoutes

JWT middleware

Password hashing

Session management

Refresh token support

Token validation

Logout endpoint

---

## User Management

Create tables

users

roles

permissions

user_roles

role_permissions

sessions

audit_logs

---

## Multi Tenancy

Introduce

family_id

ownership enforcement

Every repository query must automatically filter by

family_id

No user should ever access another family's data.

---

## Authorization

Implement RBAC.

Roles:

Owner

Spouse

Adult Child

Parent

Advisor

ReadOnly

Administrator

Permission examples

Investment.Read

Investment.Write

Insurance.Read

Insurance.Write

Family.Read

Family.Write

Settings.Manage

Documents.Read

Documents.Write

---

## Middleware

Create middleware

Authenticate

Authorize

CorrelationId

RequestLogging

SecurityHeaders

ExceptionHandling

AuditLogging

RateLimiting

---

## Password Security

Hash passwords using bcrypt.

Never store plaintext.

Implement

password policy

account lockout

failed login tracking

password reset tokens

email verification placeholders

---

## JWT

Support

Access Token

Refresh Token

Rotation

Expiration

Revocation

---

## Audit Logging

Every write operation should generate

AuditLog

containing

User

Timestamp

CorrelationId

Operation

Entity

Before

After

IP

Browser

---

## Frontend

Create

Login Page

Forgot Password

Reset Password

Unauthorized Page

Session Expired Page

Profile Page

Change Password

Role Management (Admin)

---

## Navigation

Navigation should automatically hide

menus

pages

buttons

actions

that user cannot access.

---

## API Client

Automatically

attach JWT

refresh token

retry once after refresh

logout when refresh fails

---

## Security Headers

Implement

CORS

CSP

HSTS

X-Frame-Options

X-Content-Type-Options

Referrer Policy

---

## Database

Migration

005_security.ts

Create

Users

Roles

Permissions

Sessions

AuditLogs

Indexes

Foreign Keys

---

# Component Reuse

Reuse existing

MetricCard

HoldingTable

Timeline

InsightCard

RiskGauge

NavigationDrawer

Layout

Theme

Icons

Do NOT create duplicate UI.

---

# Testing

Create unit tests for

Authentication

Authorization

JWT

Repositories

Middleware

Audit Logs

Controllers

Target

100% pass

Existing

144 tests

must continue passing.

---

# Build Requirements

Backend

npm test

PASS

Frontend

npm run build

PASS

No TypeScript errors

No ESLint errors

No Vite errors

---

# Deliverables

Generate

1.

Implementation

2.

Migration

3.

Repositories

4.

Services

5.

Controllers

6.

Routes

7.

Middleware

8.

Frontend

9.

Tests

10.

Documentation

11.

AI_CHANGELOG update

12.

SESSION_CONTEXT update

13.

Sprint_5E_Retrospective.md

14.

Phase 5E - Implementation Summary.md

---

# Definition of Done

✓ Authentication working

✓ JWT implemented

✓ RBAC enforced

✓ Multi-tenancy enforced

✓ Audit logs generated

✓ Session management working

✓ Secure password hashing

✓ Refresh tokens working

✓ Frontend authentication complete

✓ Navigation permission-aware

✓ Existing domains untouched

✓ Existing APIs compatible

✓ Existing tests passing

✓ New tests passing

✓ Production build clean

✓ Documentation complete

---

# Additional Architectural Improvements

While implementing, also establish the foundation for future phases without exposing unfinished features:

### Notification Abstraction
- Create interfaces/events for future notifications (Premium Due, Goal Reminder, Tax Alert).
- Do not implement delivery channels yet.

### Document Service Abstraction
- Introduce `DocumentRepository` and `DocumentStorageProvider` interfaces.
- Keep current `documentId` references compatible.

### Domain Events
Create a lightweight event model for future extensibility:

- UserLoggedIn
- UserLoggedOut
- PolicyUpdated
- InvestmentUpdated
- FamilyMemberAdded
- DocumentUploaded

No event bus implementation yet—only contracts/interfaces.

---

# Architectural Goal

This phase should establish the complete security and platform foundation so that all future modules (Taxation, Estate Planning, Loans, Documents, AI Advisor, External Integrations, Mobile Apps) can build on a secure, multi-tenant architecture without requiring major refactoring.