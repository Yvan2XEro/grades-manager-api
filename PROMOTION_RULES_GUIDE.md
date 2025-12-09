# 🚀 Promotion Rules System - Quick Start Guide

Complete implementation of automated student promotion system with modern UI.

## ✅ What's Included

### Backend (Server)
- ✅ Database schema (3 new tables)
- ✅ tRPC API with 9 endpoints
- ✅ Student facts computation (50+ metrics)
- ✅ Rule evaluation engine (json-rules-engine)
- ✅ Atomic execution with transactions
- ✅ Complete test suite
- ✅ Example rules (9 pre-built templates)

### Frontend (Web)
- ✅ Dashboard with overview
- ✅ Rule management page
- ✅ Evaluation/preview page
- ✅ Execution page with confirmation
- ✅ History page with audit trail
- ✅ Responsive design
- ✅ Modern, soft UI

## 🎯 Quick Start

### 1. Apply Database Schema

```bash
cd /home/yvan/Workspaces/Projects/sgn/grades-manager-api
bun db:push
```

This creates the 3 new tables:
- `promotion_rules`
- `promotion_executions`
- `promotion_execution_results`

### 2. Start the Server

```bash
bun dev:server
```

Server runs at http://localhost:3000

### 3. Start the Frontend

```bash
bun dev:web
```

Frontend runs at http://localhost:5173 (or similar)

### 4. Access the UI

Navigate to: **`/admin/promotion-rules`**

## 📖 Usage Guide

### Creating a Rule

1. Go to `/admin/promotion-rules/rules`
2. Click "Create Rule"
3. Enter:
   - **Name**: e.g., "Standard L1 → L2 Promotion"
   - **Description**: When this rule applies
   - **Ruleset**: JSON configuration (see examples below)
4. Click "Create Rule"

**Example Ruleset:**
```json
{
  "conditions": {
    "all": [
      { "fact": "overallAverage", "operator": "greaterThanInclusive", "value": 10 },
      { "fact": "creditsEarned", "operator": "greaterThanInclusive", "value": 30 },
      { "fact": "eliminatoryFailures", "operator": "equal", "value": 0 }
    ]
  },
  "event": {
    "type": "promotion-eligible",
    "params": { "message": "Student meets standard criteria" }
  }
}
```

### Evaluating Students

1. Go to `/admin/promotion-rules/evaluate`
2. Select:
   - Promotion Rule
   - Source Class (e.g., "L1 2024")
   - Academic Year
3. Click "Evaluate Students"
4. Review results in **Eligible** and **Not Eligible** tabs
5. Select students to promote
6. Click "Proceed"

### Executing Promotion

1. After evaluation, you're redirected to `/admin/promotion-rules/execute`
2. Select target class (e.g., "L2 2025")
3. Review summary
4. Click "Execute Promotion"
5. Confirm the action

**What happens:**
- Current enrollments marked as "completed"
- New enrollments created in target class
- Student class reference updated
- Full audit trail recorded

### Viewing History

1. Go to `/admin/promotion-rules/history`
2. Browse past executions
3. Click "Details" to see:
   - Which rule was used
   - How many students were evaluated/promoted
   - Individual student results

## 📊 Available Facts for Rules

### Averages
- `overallAverage` - Weighted by credits (0-20)
- `overallAverageUnweighted` - Simple average
- `lowestScore`, `highestScore`, `lowestUnitAverage`

### Score Distribution
- `scoresAbove10`, `scoresBelow10`, `scoresBelow8`

### Failures & Validations
- `failedCoursesCount` - Total failed courses
- `eliminatoryFailures` - Scores < 8
- `compensableFailures` - Scores 8-10
- `validatedCoursesCount`
- `successRate` - % of courses passed

### Credits
- `creditsEarned` - Total earned
- `creditsInProgress` - Currently attempting
- `requiredCredits` - Required for level
- `creditDeficit` - Missing credits
- `creditCompletionRate` - % completion

### Attempts
- `coursesWithMultipleAttempts`
- `maxAttemptCount`
- `firstAttemptSuccessRate`
- `retakeSuccessRate`

### Advanced
- `performanceIndex` - Composite score (0-100)
- `isOnTrack` - Boolean
- `canReachRequiredCredits` - Boolean

See full list in `apps/server/src/modules/promotion-rules/promotion-rules.types.ts`

## 🎨 Example Rules

### 1. Standard Promotion
```json
{
  "conditions": {
    "all": [
      { "fact": "overallAverage", "operator": "greaterThanInclusive", "value": 10 },
      { "fact": "creditsEarned", "operator": "greaterThanInclusive", "value": 30 },
      { "fact": "eliminatoryFailures", "operator": "equal", "value": 0 }
    ]
  },
  "event": {
    "type": "promotion-eligible",
    "params": { "message": "Standard criteria met" }
  }
}
```

### 2. With Compensation
```json
{
  "conditions": {
    "all": [
      { "fact": "overallAverage", "operator": "greaterThanInclusive", "value": 10 },
      { "fact": "failedCoursesCount", "operator": "lessThanInclusive", "value": 2 },
      { "fact": "lowestScore", "operator": "greaterThanInclusive", "value": 8 }
    ]
  },
  "event": {
    "type": "promotion-eligible",
    "params": { "message": "Eligible with compensation" }
  }
}
```

### 3. Credit-Based
```json
{
  "conditions": {
    "all": [
      { "fact": "creditsEarned", "operator": "greaterThanInclusive", "value": 35 },
      { "fact": "creditCompletionRate", "operator": "greaterThanInclusive", "value": 0.85 }
    ]
  },
  "event": {
    "type": "promotion-eligible",
    "params": { "message": "Credit threshold met" }
  }
}
```

More examples in: `apps/server/src/modules/promotion-rules/example-rules.ts`

## 🔐 Permissions

- **View Rules**: Any authenticated user
- **Create/Edit Rules**: Admin only
- **Evaluate**: Any authenticated user
- **Execute Promotions**: Admin only
- **View History**: Any authenticated user

## 🎯 Testing

### Backend Tests
```bash
bun test apps/server/src/modules/promotion-rules
```

### Manual Testing Workflow
1. Create test data (students, classes, grades)
2. Create a simple rule
3. Evaluate a class
4. Execute promotion for 1-2 students
5. Verify in history

## 🐛 Troubleshooting

### "No students found"
- Ensure students exist in the source class
- Check that grades have been entered

### "Rule evaluation failed"
- Validate JSON format
- Check that facts exist in code
- Review error message

### "Cannot delete rule"
- Rules with executions can't be deleted
- Set `isActive: false` instead

### Type errors
```bash
bun check-types
```

## 📚 Documentation

- **Backend API**: `apps/server/src/modules/promotion-rules/README.md`
- **Frontend UI**: `apps/web/src/pages/promotion-rules/README.md`
- **Facts Reference**: `apps/server/src/modules/promotion-rules/promotion-rules.types.ts`
- **Example Rules**: `apps/server/src/modules/promotion-rules/example-rules.ts`

## 🎨 UI Screenshots

### Dashboard
Clean overview with stats and action cards

### Rules Management
Grid of rule cards with create/edit dialogs

### Evaluation
Split view: eligible vs not eligible students with metrics

### Execution
Confirmation flow with visual diagram

### History
Table of past executions with drill-down details

## 🚀 Next Steps

1. **Customize Rules**: Edit example rules for your institution
2. **Add Validations**: Implement institution-specific requirements
3. **Enhance UI**: Add filtering, search, bulk operations
4. **Notifications**: Email students about promotions
5. **Reports**: Generate PDF/Excel reports
6. **Scheduling**: Schedule promotions in advance

## 💡 Tips

- Start with simple rules and test thoroughly
- Use `isActive: false` to disable rules without deleting
- Review execution history regularly
- Keep rule names descriptive
- Document custom rules in descriptions
- Test with small classes first

## 🆘 Support

For issues or questions:
1. Check the backend README
2. Check the frontend README
3. Review example rules
4. Check test files for usage examples

---

**Built with:**
- Backend: Bun + Hono + tRPC + Drizzle + PostgreSQL
- Frontend: React + TypeScript + TailwindCSS + shadcn/ui
- Rules Engine: json-rules-engine

Enjoy automated promotions! 🎓✨
