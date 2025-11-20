# Auth ↔ Domain Architecture Diagram

                         ┌───────────────────────────┐
                         │        Better Auth         │
                         │ (Identity & Sessions)      │
                         └───────────────────────────┘
                                 │
                         Auth User ID
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │       auth.user        │
                    │ (email, password, etc.)│
                    └────────────────────────┘
                                 │ 1
                                 │
                                 │ 1
                                 ▼
                    ┌────────────────────────┐
                    │     domain.user        │
                    │ (business user profile)│
                    │ - authUserId (FK)      │
                    │ - business role        │
                    │ - academic data        │
                    └────────────────────────┘
                                 │
                ┌────────────────┼──────────────────────────┐
                ▼                ▼                          ▼
     ┌───────────────────┐ ┌───────────────────┐ ┌──────────────────────┐
     │     students      │ │     teachers      │ │   administrators     │
     │   (domain layer)  │ │   (domain layer)  │ │ (secretary, dean…)   │
     └───────────────────┘ └───────────────────┘ └──────────────────────┘

# Why This Architecture Choice Makes Sense

Keeping **Better Auth users** separate from **domain (business) users** is the cleanest and safest approach.

## 1. Clear Separation of Concerns

Better Auth handles authentication only (identity, sessions, security).  
Your academic system handles business logic (students, teachers, admins).  
Mixing the two creates tight coupling and makes future changes risky.

## 2. Security and Stability

Authentication data must stay minimal, stable, and protected.  
Business data evolves often.  
Separating them avoids leaking sensitive auth fields into domain logic.

## 3. Scalability and Flexibility

You can add new user types (parents, supervisors, staff) or change academic rules  
without modifying the auth layer.  
This keeps the identity system future-proof.

## 4. Clean Linking Model

`auth.user` → `domain.user` (1:1)  
Then domain roles like student/teacher/admin extend from `domain.user`.  
This is the pattern used by Auth0, Supabase, Clerk, Firebase.

In short: **Auth stays technical. Domain stays functional. Both stay clean.**
