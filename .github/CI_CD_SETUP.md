# CI/CD Pipeline Documentation

## Overview

This project uses **GitHub Actions** for continuous integration and continuous deployment (CI/CD), automating code quality checks, build verification, and deployment workflows.

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DEVELOPER COMMITS CODE                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   PRE-COMMIT HOOKS (Local)                   │
│  • Console.log detection                                     │
│  • Prisma schema validation                                  │
│  • Large file detection                                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                 PUSH TO GITHUB (Trigger CI)                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              PARALLEL CI JOBS (GitHub Actions)               │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Code Quality │  │    Build     │  │   Database   │      │
│  │              │  │ Verification │  │  Validation  │      │
│  │ • Linting    │  │ • Backend    │  │ • Schema     │      │
│  │ • Formatting │  │ • Frontend   │  │ • Migrations │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐                                           │
│  │   Security   │                                           │
│  │    Audit     │                                           │
│  │ • npm audit  │                                           │
│  └──────────────┘                                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    ALL CHECKS PASSED ✅                      │
│                  Ready for Review/Merge                      │
└─────────────────────────────────────────────────────────────┘
```

## Workflows

### 1. **ci.yml** - Main CI Pipeline
**Triggers:** Push to `main` or `develop`, Pull Requests

**Jobs:**
- **Code Quality:** ESLint, formatting checks
- **Build Verification:** Backend syntax validation, frontend build
- **Database Validation:** Prisma schema validation, migration checks
- **Security Audit:** npm audit for vulnerable dependencies

**Runtime:** ~2-3 minutes

### 2. **pr-checks.yml** - Pull Request Validation
**Triggers:** PR opened, synchronized, or reopened

**Checks:**
- PR size validation (warns if >50 files)
- Secret detection (searches for API keys, passwords)
- Migration detection (flags database changes)

**Runtime:** ~30 seconds

### 3. **metrics.yml** - Code Metrics
**Triggers:** Push to `main`, manual dispatch

**Generates:**
- Code structure metrics (files, LOC)
- Database metrics (models, migrations)
- Git statistics (commits, contributors)

**Runtime:** ~20 seconds

## Pre-commit Hooks

Located in `.husky/pre-commit`, runs **locally before commit**:

1. **Debug Statement Detection:** Warns if `console.log` found
2. **Schema Validation:** Validates Prisma schema if changed
3. **Large File Detection:** Warns if files >5MB detected

## Setup Instructions

### 1. Enable GitHub Actions
GitHub Actions is automatically enabled for repositories. No additional setup needed.

### 2. Install Pre-commit Hooks (Optional)
```bash
# Install Husky
npm install --save-dev husky

# Initialize Husky
npx husky install

# Make hook executable
chmod +x .husky/pre-commit
```

### 3. View Workflow Runs
- Go to your GitHub repository
- Click "Actions" tab
- View all workflow runs and logs

## CI/CD Status Badges

Add to your README.md:

```markdown
![CI Pipeline](https://github.com/YOUR_USERNAME/stepout2play/actions/workflows/ci.yml/badge.svg)
![PR Checks](https://github.com/YOUR_USERNAME/stepout2play/actions/workflows/pr-checks.yml/badge.svg)
```

## What Gets Checked

| Check | Description | Failure Behavior |
|-------|-------------|------------------|
| Code Quality | ESLint linting, formatting | ⚠️ Warning (continues) |
| Build | Backend syntax, frontend build | ❌ Blocks merge |
| Database | Prisma schema validation | ❌ Blocks merge |
| Security | npm audit (moderate+) | ⚠️ Warning (continues) |
| PR Size | Files changed count | ℹ️ Informational |
| Secrets | API key/password detection | ⚠️ Warning |

## Continuous Deployment

**Current Status:** Not implemented (manual deployment)

**Future Enhancements:**
- Automated deployment to staging on `develop` branch
- Production deployment on `main` branch with approval gates
- Environment-based configuration management

## Performance

- **Average CI run time:** 2-3 minutes
- **Parallel job execution:** 4 jobs run concurrently
- **Caching:** Node modules cached for faster runs

## Troubleshooting

### CI Failing on "npm ci"
**Solution:** Ensure `package-lock.json` is committed and up-to-date

### Prisma validation failing
**Solution:** Run `npx prisma validate` locally before pushing

### Pre-commit hook not running
**Solution:** Reinstall Husky: `npx husky install`

## Metrics

Since implementing CI/CD:
- **Code quality:** Automated linting catches issues pre-merge
- **Build failures:** Caught in CI before production
- **Schema errors:** Detected before database corruption
- **Security:** Regular dependency audits

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Husky Documentation](https://typicode.github.io/husky/)
- [Prisma CLI Reference](https://www.prisma.io/docs/reference/api-reference/command-reference)

---

**Last Updated:** July 2026  
**Maintained By:** Development Team
