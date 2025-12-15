# PRD: User Documentation Website

## Objective

Create user-facing documentation for ProfeVision. Target audience: non-technical teachers. Goal: maximize UX by guiding users through all features.

## Constraints

- Each section: max 200 words
- Simple language, no technical jargon
- Translation-ready (ES/EN priority)
- Screenshots/GIFs for visual guidance

---

## Documentation Structure

### 1. Getting Started

| Section | Content |
|---------|---------|
| 1.1 Account Creation | Register, verify email |
| 1.2 First Login | Welcome modal, initial setup |
| 1.3 Onboarding Wizard | 6-step setup walkthrough |
| 1.4 Dashboard Overview | Main areas, navigation |
| 1.5 Onboarding Checklist | Floating task list guide |

### 2. Organization Setup

| Section | Content |
|---------|---------|
| 2.1 Create Institution | Add your school/institution |
| 2.2 Create Subject | Add course/subject |
| 2.3 Create Group | Create class groups |
| 2.4 Add Students | Manual + bulk import |
| 2.5 Grading Schemes | Configure grade scales |

### 3. Exam Creation

| Section | Content |
|---------|---------|
| 3.1 Import from Document | PDF/text extraction |
| 3.2 AI Chat Creation | Conversational builder |
| 3.3 Similar Exam | Generate variants with AI |
| 3.4 Edit Exam | Modify existing exams |
| 3.5 Assign to Groups | Link exam to classes |

### 4. Exam PDF & Printing

| Section | Content |
|---------|---------|
| 4.1 Generate PDF | Download exam + answer sheet |
| 4.2 QR Codes | Understanding QR purpose |
| 4.3 Print Guidelines | Paper, quality recommendations |

### 5. Grading with Camera (OMR)

| Section | Content |
|---------|---------|
| 5.1 Scan Overview | What is OMR scanning |
| 5.2 Start Scanning | Access scan wizard |
| 5.3 Capture Image | Camera or file upload |
| 5.4 Review Results | Verify detected answers |
| 5.5 Save & Continue | Confirm and scan next |
| 5.6 Troubleshooting | Common issues |

### 6. Results & Analytics

| Section | Content |
|---------|---------|
| 6.1 Results Dashboard | Statistics overview |
| 6.2 Question Analysis | Per-question breakdown |
| 6.3 Student Results | Individual scores |
| 6.4 Export to Excel | Download data |
| 6.5 Manual Override | Edit grades manually |
| 6.6 Sync Grades | Link to grading components |

### 7. Subscription & Limits

| Section | Content |
|---------|---------|
| 7.1 Free Tier | What's included |
| 7.2 Plus Tier | Unlimited features |
| 7.3 Usage Tracking | Monitor your limits |
| 7.4 Upgrade Process | How to upgrade |
| 7.5 Manage Subscription | Billing, cancel |

### 8. Account Settings

| Section | Content |
|---------|---------|
| 8.1 Profile | Edit personal info |
| 8.2 Password | Change password |
| 8.3 Notifications | Email preferences |
| 8.4 Language | Switch ES/EN |

### 9. FAQ

| Section | Content |
|---------|---------|
| 9.1 Account Issues | Login, password recovery |
| 9.2 Scanning Issues | QR not detected, blurry images |
| 9.3 Exam Issues | Editing, deleting, duplicating |
| 9.4 Billing Issues | Payment, invoices |

---

## Task Tracking

### Phase 1: Core User Flows
- [ ] 1.1-1.4 Getting Started
- [ ] 5.1-5.6 Grading with Camera (flagship feature)
- [ ] 3.1 Manual Exam Creation

### Phase 2: Organization Setup
- [ ] 2.1-2.5 All organization sections

### Phase 3: Advanced Exam Features
- [ ] 3.2-3.6 AI features, import, assign

### Phase 4: Results & Export
- [ ] 6.1-6.6 All results sections

### Phase 5: Subscription & Settings
- [ ] 7.1-7.5 Subscription
- [ ] 8.1-8.4 Settings

### Phase 6: Support Content
- [ ] 4.1-4.3 PDF/Printing
- [ ] 9.1-9.4 FAQ

---

## File Naming Convention

```
/content/docs/
├── es/
│   ├── getting-started/
│   │   ├── account-creation.mdx
│   │   ├── first-login.mdx
│   │   └── ...
│   ├── organization-setup/
│   ├── exam-creation/
│   ├── printing/
│   ├── grading/
│   ├── results/
│   ├── subscription/
│   ├── settings/
│   └── faq/
└── en/
    └── (mirror structure)
```

---

## Per-Section Template

Each MDX file follows:

```mdx
---
title: [Section Title]
description: [One-line description]
---

## [Title]

[2-3 sentences intro]

### Steps

1. [Step with screenshot]
2. [Step with screenshot]
3. ...

### Tips

- [Helpful tip]
- [Common mistake to avoid]

### Next

[Link to logical next section]
```

---

## Decisions

| Item | Decision |
|------|----------|
| Screenshots | Manual capture |
| Videos | YouTube channel (embedded links) |
| Search | Fumadocs Orama (sufficient) |
| Feedback | None |
| Versioning | See below |

---

## Versioning Strategy

**Recommendation: URL-based versioning with "latest" default**

```
/docs/v1/getting-started/...
/docs/v2/getting-started/...
/docs/latest/... → redirects to current version
```

**When to create new version:**
- Major UI redesign
- Breaking workflow changes
- New major features that alter existing flows

**For minor updates:**
- Edit existing docs in place
- Add "Updated: [date]" badge if significant
- Use callouts for new features: `<Callout type="new">Available since v2.1</Callout>`

**Implementation:**
- Fumadocs supports versioning via folder structure
- Keep only 2 versions active (current + previous)
- Archive older versions as PDF downloads

---

## Screenshot Guidelines

### Format & Dimensions

| Type | Format | Dimensions | Use Case |
|------|--------|------------|----------|
| Full page | WebP | 1280x800 | Dashboard overviews, full workflows |
| Component | WebP | 800x600 | Forms, modals, specific UI elements |
| Mobile | WebP | 390x844 | Mobile-specific features (scanning) |
| Detail | WebP | 400x300 | Buttons, small UI elements |

**Quality:** 85% compression (balance size/clarity)

### Storage Location

```
apps/docs/public/images/
├── es/
│   ├── getting-started/
│   │   ├── account-creation-01-form.webp
│   │   ├── account-creation-02-verify.webp
│   │   └── ...
│   ├── grading/
│   │   ├── scan-01-fab-button.webp
│   │   ├── scan-02-instructions.webp
│   │   └── ...
│   └── ...
└── en/
    └── (mirror structure - only if UI text differs)
```

### Naming Convention

```
[section]-[step]-[description].webp
```

**Examples:**
- `account-creation-01-register-form.webp`
- `account-creation-02-email-verification.webp`
- `scan-03-camera-capture.webp`
- `results-02-question-analysis.webp`

### Screenshot Checklist

Per screenshot, document:
- [ ] Section ID (e.g., 1.1)
- [ ] Step number
- [ ] Description (what to capture)
- [ ] UI state (logged in/out, data visible)
- [ ] Highlights (what to emphasize with arrows/boxes)

---

## Screenshot Requirements by Section

### 1. Getting Started

| ID | File Name | Description | Highlights |
|----|-----------|-------------|------------|
| 1.1-01 | `account-creation-01-register-form.webp` | Registration form empty | Form fields |
| 1.1-02 | `account-creation-02-verify-email.webp` | Email verification page | Check inbox message |
| 1.1-03 | `account-creation-03-email-confirmed.webp` | Confirmation success | Success message |
| 1.2-01 | `first-login-01-welcome-modal.webp` | Welcome modal after first login | CTA button |
| 1.3-01 | `onboarding-01-welcome-step.webp` | Onboarding wizard step 1 | Progress indicator |
| 1.3-02 | `onboarding-02-institution-step.webp` | Institution creation step | Form |
| 1.3-03 | `onboarding-03-subject-step.webp` | Subject creation step | Form |
| 1.3-04 | `onboarding-04-group-step.webp` | Group creation step | Form |
| 1.3-05 | `onboarding-05-students-step.webp` | Add students step | Input area |
| 1.3-06 | `onboarding-06-complete-step.webp` | Completion step | Success message |
| 1.4-01 | `dashboard-01-overview.webp` | Full dashboard view | Stats cards, sidebar |
| 1.4-02 | `dashboard-02-sidebar.webp` | Sidebar navigation expanded | Menu items |
| 1.5-01 | `checklist-01-floating.webp` | Floating checklist button | Bottom-right corner |
| 1.5-02 | `checklist-02-tasks.webp` | Checklist expanded with 4 tasks | Task items, checkmarks |
| 1.5-03 | `checklist-03-create-drawer.webp` | Exam creation drawer options | 3 creation methods |

### 2. Organization Setup

| ID | File Name | Description | Highlights |
|----|-----------|-------------|------------|
| 2.1-01 | `institution-01-list.webp` | Institutions list page | Add button |
| 2.1-02 | `institution-02-create-form.webp` | Create institution modal | Form fields |
| 2.2-01 | `subject-01-list.webp` | Subjects list page | Add button |
| 2.2-02 | `subject-02-create-form.webp` | Create subject modal | Form fields |
| 2.3-01 | `group-01-list.webp` | Groups list page | Add button, archive toggle |
| 2.3-02 | `group-02-create-form.webp` | Create group modal | Form fields |
| 2.4-01 | `students-01-group-list.webp` | Students in group view | Add button |
| 2.4-02 | `students-02-add-manual.webp` | Add student form | Form fields |
| 2.4-03 | `students-03-bulk-import.webp` | Bulk import dialog | Text area |
| 2.5-01 | `grading-scheme-01-view.webp` | Grading scheme page | Scale table |
| 2.5-02 | `grading-scheme-02-edit.webp` | Edit grading scheme | Form |

### 3. Exam Creation

| ID | File Name | Description | Highlights |
|----|-----------|-------------|------------|
| 3.1-01 | `import-01-button.webp` | Import button on exams list | Button highlight |
| 3.1-02 | `import-02-upload.webp` | Import dialog with dropzone | Upload area |
| 3.1-03 | `import-03-progress.webp` | Extraction progress | Stage indicators |
| 3.1-04 | `import-04-preview.webp` | Extracted questions preview | Question cards |
| 3.2-01 | `chat-01-access.webp` | AI chat access button | Button highlight |
| 3.2-02 | `chat-02-interface.webp` | AI chat interface | Chat input, messages |
| 3.2-03 | `chat-03-options.webp` | Chat options (language, clear, save) | Options buttons |
| 3.3-01 | `similar-01-button.webp` | Similar exam button on exam card | Wand icon |
| 3.3-02 | `similar-02-progress.webp` | Generation progress stepper | 6 steps |
| 3.4-01 | `edit-01-access.webp` | Edit exam access | Edit button |
| 3.4-02 | `edit-02-draft.webp` | Edit draft exam page | Question editor |
| 3.4-03 | `edit-03-published.webp` | Published exam (limited edit) | Toggle/answer buttons |
| 3.5-01 | `assign-01-access.webp` | Assign to groups access | Assign button |
| 3.5-02 | `assign-02-select.webp` | Group selection | Checkboxes |
| 3.5-03 | `assign-03-config.webp` | Per-group config | Date, duration fields |

### 4. Exam PDF & Printing

| ID | File Name | Description | Highlights |
|----|-----------|-------------|------------|
| 4.1-01 | `pdf-01-generate-button.webp` | Generate PDF button | Button location |
| 4.1-02 | `pdf-02-preview.webp` | PDF preview | Exam + answer sheet |
| 4.2-01 | `qr-01-location.webp` | QR code on answer sheet | QR highlighted |
| 4.3-01 | `print-01-settings.webp` | Print dialog settings | Recommended settings |

### 5. Grading with Camera (OMR)

| ID | File Name | Description | Highlights |
|----|-----------|-------------|------------|
| 5.1-01 | `scan-01-answer-sheet.webp` | Physical answer sheet example | Bubbles, QR |
| 5.2-01 | `scan-02-fab-button.webp` | Floating scan button | FAB button |
| 5.2-02 | `scan-03-wizard-start.webp` | Scan wizard instructions | Step 1 |
| 5.3-01 | `scan-04-camera-view.webp` | Camera capture interface | Capture button |
| 5.4-01 | YouTube embed | Processing demo video | https://youtube.com/shorts/ZceuTIpAzWk |
| 5.4-02 | `scan-05-results.webp` | Detected answers + save button | Answer grid, save button |
| 5.5-01 | `scan-06-success.webp` | Success with options | Finish, scan another buttons |
| 5.6-01 | `scan-error-01-qr.webp` | QR not detected error | Error message |

### 6. Results & Analytics

| ID | File Name | Description | Highlights |
|----|-----------|-------------|------------|
| 6.1-01 | `results-01-dashboard.webp` | Results overview | Stats cards |
| 6.2-01 | `results-02-question-chart.webp` | Per-question analysis | Bar chart |
| 6.2-02 | `results-03-answer-distribution.webp` | Answer distribution | Pie/bar chart |
| 6.3-01 | `results-04-student-table.webp` | Individual results table | Scores column |
| 6.4-01 | `results-05-export-button.webp` | Export to Excel button | Button highlight |
| 6.5-01 | `results-06-manual-edit.webp` | Manual grade override | Edit interface |
| 6.6-01 | `results-07-sync-grades.webp` | Sync grades dialog | Sync button |

### 7. Subscription & Limits

*Text-only section - no screenshots needed*

### 8. Account Settings

*Text-only section - no screenshots needed*

---

## Total Screenshots

| Section | Count |
|---------|-------|
| 1. Getting Started | 15 |
| 2. Organization Setup | 11 |
| 3. Exam Creation | 15 |
| 4. PDF & Printing | 4 |
| 5. Grading (OMR) | 8 |
| 6. Results | 7 |
| 7. Subscription | 0 |
| 8. Settings | 0 |
| **Total** | **60** |

---

## Deployment Notes

- `apps/web` and `apps/docs` are separate Vercel projects
- Enable "Skip deployments when no changes" to avoid unnecessary builds
