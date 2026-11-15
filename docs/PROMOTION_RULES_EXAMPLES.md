# Guide to Promotion Rules and External Student Admission

## System overview

The system uses **json-rules-engine** to evaluate students automatically against configurable criteria. Each rule is defined in JSON and can combine several conditions.

## Facts available for evaluation

Each student is evaluated with the following data:

### Identification
- `studentId`: Unique ID of the student
- `registrationNumber`: Registration number
- `classId`: Current class
- `programCode`: Program code
- `academicYearId`: Academic year

### Academic averages
- `overallAverage`: Weighted overall average (0-20)
- `overallAverageUnweighted`: Unweighted average
- `lowestScore`: Lowest score
- `highestScore`: Highest score
- `lowestUnitAverage`: Lowest teaching unit (UE) average

### Score distribution
- `scoresAbove10`: Number of courses passed (≥10)
- `scoresBelow10`: Number of failures (<10)
- `scoresBelow8`: Number of eliminatory failures (<8)
- `failedCoursesCount`: Total failed courses
- `validatedCoursesCount`: Total validated courses

### ECTS credits
- `creditsEarned`: Credits earned (total)
- `creditsEarnedThisYear`: Credits earned this year
- `creditsInProgress`: Credits in progress
- `requiredCredits`: Credits required for the cycle
- `creditDeficit`: Credit deficit
- `creditCompletionRate`: Completion rate (0-1)

### Success rates
- `successRate`: Overall success rate (0-1)
- `unitValidationRate`: Teaching unit validation rate (0-1)
- `firstAttemptSuccessRate`: First-attempt success rate
- `performanceIndex`: Composite performance index (0-100)

### Failures and compensation
- `compensableFailures`: Compensable failures (8-10)
- `eliminatoryFailures`: Eliminatory failures (<8)
- `failedTeachingUnitsCount`: Number of failed teaching units

### Attempts and academic path
- `coursesWithMultipleAttempts`: Courses with several attempts
- `maxAttemptCount`: Maximum number of attempts
- `previousEnrollmentsCount`: Number of previous enrollments
- `completedYears`: Completed years
- `isOnTrack`: Student on schedule (boolean)

---

## Standard Rule Examples

### 1. Standard Promotion Rule (Licence 1 → Licence 2)

**Criteria:**
- Overall average ≥ 10
- Success rate ≥ 70%
- At most 2 failed teaching units
- No eliminatory failure (<8)

```json
{
  "conditions": {
    "all": [
      {
        "fact": "overallAverage",
        "operator": "greaterThanInclusive",
        "value": 10
      },
      {
        "fact": "successRate",
        "operator": "greaterThanInclusive",
        "value": 0.7
      },
      {
        "fact": "failedTeachingUnitsCount",
        "operator": "lessThanInclusive",
        "value": 2
      },
      {
        "fact": "eliminatoryFailures",
        "operator": "equal",
        "value": 0
      }
    ]
  },
  "event": {
    "type": "student-promoted",
    "params": {
      "message": "Étudiant admis au niveau supérieur"
    }
  }
}
```

### 2. Rule with Compensation (Promotion with carried-over debts)

**Criteria:**
- Average ≥ 10
- At most 15 credits of deficit
- No more than 1 eliminatory failure
- Completion rate ≥ 75%

```json
{
  "conditions": {
    "all": [
      {
        "fact": "overallAverage",
        "operator": "greaterThanInclusive",
        "value": 10
      },
      {
        "fact": "creditDeficit",
        "operator": "lessThanInclusive",
        "value": 15
      },
      {
        "fact": "eliminatoryFailures",
        "operator": "lessThanInclusive",
        "value": 1
      },
      {
        "fact": "creditCompletionRate",
        "operator": "greaterThanInclusive",
        "value": 0.75
      }
    ]
  },
  "event": {
    "type": "student-promoted-with-debt",
    "params": {
      "message": "Admis avec dette (max 15 crédits à rattraper)"
    }
  }
}
```

### 3. Excellence Rule (Promotion with Honors)

**Criteria:**
- Average ≥ 14
- Success rate = 100%
- All credits earned
- Performance index ≥ 80

```json
{
  "conditions": {
    "all": [
      {
        "fact": "overallAverage",
        "operator": "greaterThanInclusive",
        "value": 14
      },
      {
        "fact": "successRate",
        "operator": "equal",
        "value": 1
      },
      {
        "fact": "creditCompletionRate",
        "operator": "greaterThanInclusive",
        "value": 0.95
      },
      {
        "fact": "performanceIndex",
        "operator": "greaterThanInclusive",
        "value": 80
      }
    ]
  },
  "event": {
    "type": "student-promoted-excellence",
    "params": {
      "message": "Admis avec mention - Excellent parcours"
    }
  }
}
```

### 4. Authorized Repeat-Year Rule

**Criteria:**
- Average between 8 and 10
- At most 2 previous repeated years
- No dropped courses
- Credit deficit < 30

```json
{
  "conditions": {
    "all": [
      {
        "fact": "overallAverage",
        "operator": "greaterThanInclusive",
        "value": 8
      },
      {
        "fact": "overallAverage",
        "operator": "lessThan",
        "value": 10
      },
      {
        "fact": "previousEnrollmentsCount",
        "operator": "lessThanInclusive",
        "value": 2
      },
      {
        "fact": "creditDeficit",
        "operator": "lessThan",
        "value": 30
      }
    ]
  },
  "event": {
    "type": "student-repeat-year",
    "params": {
      "message": "Redoublement autorisé"
    }
  }
}
```

### 5. Credit-Based Rule (LMD System)

**Criteria:**
- At least 45 credits earned (out of 60)
- Average ≥ 10
- At most 1 failed teaching unit

```json
{
  "conditions": {
    "all": [
      {
        "fact": "creditsEarned",
        "operator": "greaterThanInclusive",
        "value": 45
      },
      {
        "fact": "overallAverage",
        "operator": "greaterThanInclusive",
        "value": 10
      },
      {
        "fact": "failedTeachingUnitsCount",
        "operator": "lessThanInclusive",
        "value": 1
      }
    ]
  },
  "event": {
    "type": "student-promoted-lmd",
    "params": {
      "message": "Admis - Crédits LMD validés"
    }
  }
}
```

---

## Handling External Students (Direct Admission)

### Problem

Students coming from other institutions:
- Have no grade history in the system
- Have no recorded credits
- Are admitted directly to a specific level
- Must not be blocked by the standard promotion rules

### Solution 1: Transfer Field (Recommended)

**Required schema change:**

Add an `isTransferStudent` or `admissionType` field to the `students` table:

```typescript
// In apps/server/src/db/schema/app-schema.ts
export const students = pgTable("students", {
  // ... other fields
  admissionType: text("admission_type").default("normal"), // "normal", "transfer", "direct"
  transferInstitution: text("transfer_institution"), // Name of the institution of origin
  transferCredits: integer("transfer_credits").default(0), // Transferred credits
  transferLevel: text("transfer_level"), // Admission level (L1, L2, M1, etc.)
});
```

**Update the facts service:**

```typescript
// In student-facts.service.ts, add at the start of computeStudentFacts:
const student = await db.query.students.findFirst({
  where: eq(schema.students.id, studentId),
  // ...
});

// Add to the facts:
const facts: StudentPromotionFacts = {
  // ... other facts

  // New fields for external students
  isTransferStudent: student.admissionType === "transfer",
  admissionType: student.admissionType,
  transferCredits: student.transferCredits ?? 0,
  hasAcademicHistory: transcript.overallAverage > 0, // Indicates whether the student has grades
};
```

**Special rule for external students:**

```json
{
  "conditions": {
    "any": [
      {
        "all": [
          {
            "fact": "isTransferStudent",
            "operator": "equal",
            "value": true
          },
          {
            "fact": "transferCredits",
            "operator": "greaterThanInclusive",
            "value": 30
          }
        ]
      },
      {
        "all": [
          {
            "fact": "admissionType",
            "operator": "equal",
            "value": "direct"
          }
        ]
      }
    ]
  },
  "event": {
    "type": "external-student-admitted",
    "params": {
      "message": "Étudiant externe admis sur dossier"
    }
  }
}
```

### Solution 2: Manual Enrollment Without a Rule

For exceptional admissions, set up an administrative procedure:

1. **Create the student** with `admissionType = "direct"`
2. **Enroll them directly** in the target class
3. **Record the transferred credits** manually
4. **Do not use** the automatic promotion system

**Example code:**

```typescript
// Special endpoint for direct admission
admitExternalStudent: adminProcedure
  .input(z.object({
    studentData: z.object({
      firstName: z.string(),
      lastName: z.string(),
      // ...
    }),
    targetClassId: z.string(),
    transferCredits: z.number().optional(),
    transferInstitution: z.string().optional(),
    justification: z.string(),
  }))
  .mutation(async ({ input, ctx }) => {
    return db.transaction(async (tx) => {
      // Create the student
      const student = await tx.insert(schema.students).values({
        ...input.studentData,
        admissionType: "direct",
        transferCredits: input.transferCredits,
        transferInstitution: input.transferInstitution,
        class: input.targetClassId,
      }).returning();

      // Create the enrollment directly
      await tx.insert(schema.enrollments).values({
        studentId: student[0].id,
        classId: input.targetClassId,
        academicYearId: ctx.academicYear.id,
        status: "active",
        metadata: {
          admissionType: "direct",
          justification: input.justification,
        }
      });

      return student[0];
    });
  })
```

### Solution 3: "Bypass" Promotion Rule for Direct Admissions

Create a special rule that applies only to students without history:

```json
{
  "conditions": {
    "all": [
      {
        "fact": "hasAcademicHistory",
        "operator": "equal",
        "value": false
      },
      {
        "fact": "admissionType",
        "operator": "in",
        "value": ["transfer", "direct"]
      }
    ]
  },
  "event": {
    "type": "bypass-promotion-external",
    "params": {
      "message": "Admission directe - Pas de vérification de notes requise"
    }
  },
  "priority": 100
}
```

**Note:** This rule must have a high priority so that it is evaluated first.

---

## Complex Rules with Multiple Conditions

### Rule with OR Conditions (ANY)

Admit if one of the following conditions is met:
- Average ≥ 12 AND no failure
- OR Credits earned ≥ 55/60 AND average ≥ 10

```json
{
  "conditions": {
    "any": [
      {
        "all": [
          {
            "fact": "overallAverage",
            "operator": "greaterThanInclusive",
            "value": 12
          },
          {
            "fact": "failedCoursesCount",
            "operator": "equal",
            "value": 0
          }
        ]
      },
      {
        "all": [
          {
            "fact": "creditsEarned",
            "operator": "greaterThanInclusive",
            "value": 55
          },
          {
            "fact": "overallAverage",
            "operator": "greaterThanInclusive",
            "value": 10
          }
        ]
      }
    ]
  },
  "event": {
    "type": "student-promoted-flexible",
    "params": {
      "message": "Admis selon critères flexibles"
    }
  }
}
```

---

## Implementation Recommendations

### 1. Rule Hierarchy

Create several rules with different priorities:

1. **Excellence rule** (priority: 100) - For the best students
2. **Standard rule** (priority: 50) - Normal promotion
3. **Debt rule** (priority: 30) - Conditional promotion
4. **External rule** (priority: 90) - Direct admissions
5. **Repeat-year rule** (priority: 10) - Last resort

### 2. Suggested Workflow

```
1. Evaluate the student against all active rules
2. Apply the highest-priority rule that matches
3. Record the execution with a justification
4. Create the new enrollment
5. Notify the student and the administration
```

### 3. User Interface

Add to the `/admin/promotion-rules` page:

- ✅ **Rule list** with active/inactive status
- ✅ **JSON editor** with real-time validation
- ✅ **Rule tester** with a simulation on one student
- ✅ **Templates** of preconfigured rules
- ✅ **Filter by admission type** (normal, external, excellence)

### 4. Audit and Traceability

Every promotion must record:
- The rule applied
- The student's facts at the time of evaluation
- The user who triggered the action
- The date and time
- The students concerned

---

## FAQ

**Q: How do I test a rule before applying it?**

A: Use the `evaluateClassForPromotion` endpoint, which returns the eligible students without promoting them.

**Q: Can several rules be combined?**

A: Yes, the system evaluates all active rules and applies the one with the highest priority.

**Q: How do I handle special cases?**

A: Create a specific rule with a high priority, or use direct manual admission.

**Q: Are transferred credits taken into account?**

A: Yes, if you add the `transferCredits` field to the facts and add it to `creditsEarned`.

---

## Next Steps

1. ✅ Add the `admissionType` and `transferCredits` fields to the schema
2. ✅ Update the facts service
3. ✅ Create the standard rules in the interface
4. ✅ Test with real data
5. ✅ Train the administrators
6. ✅ Document the rules specific to your institution
