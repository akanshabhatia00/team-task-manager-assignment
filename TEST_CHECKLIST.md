# Manual Test Checklist

## Authentication

- [ ] Signup works with valid name/email/password
- [ ] Duplicate email signup blocked
- [ ] Login works with valid credentials
- [ ] Wrong credentials rejected

## Project Management

- [ ] Authenticated user can create project
- [ ] Creator appears as `admin`
- [ ] Admin can add member by email
- [ ] Non-admin cannot add member

## Task Management

- [ ] Admin can create task with required fields
- [ ] Task assignee must be project member
- [ ] Member sees only assigned tasks
- [ ] Member can update own task status
- [ ] Member cannot update another member's task

## Dashboard

- [ ] Dashboard shows total tasks
- [ ] Dashboard status counts are accurate
- [ ] Overdue count updates for pending past-due tasks

## Deployment

- [ ] Backend Railway service is healthy (`/api/health`)
- [ ] Frontend Railway service loads
- [ ] Frontend can call backend in production
