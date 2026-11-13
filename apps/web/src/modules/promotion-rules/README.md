# Promotion Rules UI

Modern, soft interface for managing automated student promotions.

## Pages Overview

### 1. Dashboard (`/admin/promotion-rules`)
Landing page with overview cards and quick actions.

**Features:**
- Quick stats (active rules, recent executions, students promoted)
- Action cards for main workflows
- Recent activity feed

### 2. Rules Management (`/admin/promotion-rules/rules`)
Create, edit, and manage promotion rules.

**Features:**
- Grid view of all rules with status badges
- Create/Edit dialogs with JSON editor
- Toggle active/inactive status
- Delete rules (if no executions)
- Real-time validation

### 3. Evaluate Promotion (`/admin/promotion-rules/evaluate`)
Preview which students are eligible before executing.

**Features:**
- Select rule, source class, and academic year
- Evaluate all students in the class
- Tabbed view: Eligible vs Not Eligible
- Detailed student cards with metrics
- Select students for promotion
- Batch select/deselect

### 4. Execute Promotion (`/admin/promotion-rules/execute`)
Confirm and apply promotions to selected students.

**Features:**
- Summary of selections
- Target class selection
- Visual flow diagram
- Confirmation dialog with impact details
- Atomic execution with transaction

### 5. Execution History (`/admin/promotion-rules/history`)
View audit trail of past promotions.

**Features:**
- Table of all executions with key metrics
- Detailed view dialog
- Student-level results
- Success rate indicators

## Components

### `RuleCard`
Displays a promotion rule with actions menu.

**Props:**
- `rule`: Rule object
- `onEdit`, `onDelete`, `onToggleActive`: Callbacks

### `StudentEvaluationCard`
Shows student evaluation with metrics and selection.

**Props:**
- `student`: Student info
- `facts`: Computed facts (average, credits, etc.)
- `eligible`: Boolean
- `reasons`: Evaluation notes
- `selected`: Selection state
- `onToggleSelect`: Callback

## Design System

### Colors
- **Primary**: Default theme color for actions
- **Green**: Success, eligible students
- **Red**: Errors, not eligible
- **Amber**: Warnings, partial success

### Animations
- Fade-in on page load
- Slide-in for results
- Smooth transitions on hover
- Loading states with spinners

### Layout
- Responsive grid (1-3 columns)
- Cards with hover effects
- Consistent spacing
- Mobile-friendly

## User Flow

```
Dashboard
  ├─> Manage Rules
  │     ├─> Create New Rule
  │     ├─> Edit Rule
  │     └─> Delete Rule
  │
  ├─> Evaluate & Execute
  │     ├─> Select Parameters
  │     ├─> Evaluate Students
  │     ├─> Select Eligible
  │     ├─> Choose Target Class
  │     └─> Execute with Confirmation
  │
  └─> View History
        ├─> List Executions
        └─> View Details
```

## State Management

- **tRPC Queries**: Data fetching with React Query
- **React State**: Form inputs, dialogs
- **URL State**: Navigation between pages
- **Router State**: Pass data between evaluate → execute

## Dependencies

- `@tanstack/react-query` - Data fetching
- `react-router` - Routing
- `sonner` - Toast notifications
- `lucide-react` - Icons
- `shadcn/ui` - Component library

## Permissions

All promotion routes require:
- Authentication (protected routes)
- Admin role for modifications

## Best Practices

### Performance
- Lazy load pages
- Debounce search inputs
- Pagination for large lists
- Optimistic updates

### UX
- Loading states for all async operations
- Error boundaries
- Confirmation dialogs for destructive actions
- Clear feedback with toasts

### Accessibility
- Keyboard navigation
- ARIA labels
- Focus management
- Color contrast ratios

## Future Enhancements

- [ ] Rule templates library
- [ ] Visual rule builder (no-code)
- [ ] Bulk operations
- [ ] Export reports (PDF/Excel)
- [ ] Email notifications
- [ ] Scheduling promotions
- [ ] Dry-run mode
- [ ] Student search/filter
- [ ] Dark mode
- [ ] Multi-language support
