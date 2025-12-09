# Promotion Rules Module

This module implements a flexible rule-based system for student promotion (passage automatique) in academic institutions.

## Overview

The promotion rules system allows administrators to:
1. **Define rules** - Create configurable promotion criteria using json-rules-engine
2. **Evaluate students** - Test students against rules to see who is eligible
3. **Execute promotions** - Automatically enroll eligible students in the next class
4. **Track history** - Maintain audit trail of all promotion executions

## Core Concepts

### Student Facts

When evaluating a student, the system computes comprehensive "facts" including:
- **Averages**: Overall, by teaching unit, by course
- **Scores**: Highest, lowest, distribution
- **Failures**: Count, type (compensable vs eliminatory)
- **Credits**: Earned, in progress, deficit, completion rate
- **Attempts**: Retakes, success rates
- **Status**: Enrollment history, years completed
- **Performance**: Composite index, trajectory

See `promotion-rules.types.ts` for the complete `StudentPromotionFacts` type.

### Rules

Rules are defined using [json-rules-engine](https://github.com/CacheControl/json-rules-engine) format:

```typescript
{
  conditions: {
    all: [ // or 'any'
      { fact: 'overallAverage', operator: 'greaterThanInclusive', value: 10 },
      { fact: 'creditsEarned', operator: 'greaterThanInclusive', value: 30 }
    ]
  },
  event: {
    type: 'promotion-eligible',
    params: { message: 'Student meets criteria' }
  }
}
```

Available operators:
- `equal`, `notEqual`
- `greaterThan`, `greaterThanInclusive`
- `lessThan`, `lessThanInclusive`
- `in`, `notIn`, `contains`, `doesNotContain`

### Workflow

1. **Create Rule** (Admin)
   ```typescript
   await trpc.promotionRules.create({
     name: "L1 to L2 Standard",
     description: "Standard promotion criteria",
     programId: "program-id", // optional
     ruleset: { ... }
   })
   ```

2. **Evaluate Class** (Preview)
   ```typescript
   const result = await trpc.promotionRules.evaluateClass({
     sourceClassId: "L1-2024",
     ruleId: "rule-id",
     academicYearId: "2024-2025"
   })
   // Returns: { eligible: [...], notEligible: [...] }
   ```

3. **Apply Promotion** (Execute)
   ```typescript
   await trpc.promotionRules.applyPromotion({
     sourceClassId: "L1-2024",
     targetClassId: "L2-2025",
     ruleId: "rule-id",
     academicYearId: "2025-2026",
     studentIds: ["student-1", "student-2"]
   })
   ```

4. **View History**
   ```typescript
   const executions = await trpc.promotionRules.listExecutions({
     sourceClassId: "L1-2024"
   })

   const details = await trpc.promotionRules.getExecutionDetails({
     executionId: "execution-id"
   })
   ```

## Example Rules

See `example-rules.ts` for pre-built rules:
- `standardPromotionRule` - Average >= 10, Credits >= 30
- `compensationPromotionRule` - With compensable failures
- `conditionalPromotionRule` - With academic debt
- `excellencePromotionRule` - High performance
- `repeatYearRule` - Redoublement criteria
- `creditBasedPromotionRule` - Focus on credits
- `unitBasedPromotionRule` - All units validated
- `comprehensivePromotionRule` - Multiple conditions

## Database Schema

### promotion_rules
- `id`, `name`, `description`
- `sourceClassId`, `programId`, `cycleLevelId` (optional filters)
- `ruleset` (JSONB)
- `isActive` (boolean)

### promotion_executions
- `id`, `ruleId`, `sourceClassId`, `targetClassId`
- `academicYearId`, `executedBy`
- `studentsEvaluated`, `studentsPromoted`
- `metadata` (JSONB), `executedAt`

### promotion_execution_results
- `id`, `executionId`, `studentId`
- `wasPromoted` (boolean)
- `evaluationData` (JSONB - student facts)
- `rulesMatched` (string[])

## API Endpoints

All endpoints under `trpc.promotionRules.*`:

### Rule Management (Admin only)
- `create(input)` - Create new rule
- `update(input)` - Update existing rule
- `delete({ id })` - Delete rule (if no executions)
- `getById({ id })` - Get rule details
- `list(filters)` - List rules with pagination

### Evaluation (Protected)
- `evaluateClass(input)` - Evaluate students against rule

### Execution (Admin only)
- `applyPromotion(input)` - Execute promotion for selected students
- `listExecutions(filters)` - View execution history
- `getExecutionDetails({ executionId })` - View execution details

## Testing

Run tests:
```bash
bun test apps/server/src/modules/promotion-rules/__tests__
```

Tests cover:
- Rule CRUD operations
- Validation of ruleset format
- Authorization (admin vs regular users)
- Evaluation logic (requires integration test setup)
- Execution workflow

## Common Use Cases

### 1. Standard L1 → L2 Promotion
Students need average >= 10, 30+ credits, no eliminatory failures.

### 2. Compensation Rules
Allow promotion with minor failures (8-10) if overall average is good.

### 3. Credit-Based Systems
Focus on credit accumulation rather than just averages.

### 4. Conditional Promotion
Allow promotion with academic debt but require specific conditions.

### 5. Excellence Track
Fast-track high-performing students with stricter criteria.

## Architecture

```
student-facts.service.ts
  └─> Computes all facts for a student
        ↓
promotion-rules.service.ts
  └─> Evaluates facts against rules (json-rules-engine)
        ↓
promotion-rules.router.ts
  └─> Exposes tRPC API
        ↓
Frontend / Client
  └─> Calls API to manage rules and execute promotions
```

## Future Enhancements

Potential improvements:
- [ ] Rule versioning
- [ ] Dry-run mode with detailed reports
- [ ] Batch processing for large classes
- [ ] Email notifications for students
- [ ] Rule templates library
- [ ] Visual rule builder UI
- [ ] Multi-stage promotion (L1 → L2 → L3)
- [ ] Custom fact calculators
- [ ] Integration with reporting/analytics

## Troubleshooting

**Rule evaluation fails with "undefined fact" error**
- Ensure all facts used in conditions exist in `StudentPromotionFacts`
- Use `allowUndefinedFacts: true` for optional facts

**Cannot delete rule**
- Rules with executions cannot be deleted (referential integrity)
- Set `isActive: false` to disable instead

**Promotion execution fails**
- Check that all referenced classes and students exist
- Verify user has admin permissions
- Ensure no conflicting enrollments

**Slow evaluation for large classes**
- Consider batch processing
- Cache student facts if evaluating multiple rules
- Use database indexes on enrollment/grade queries
