# Project Guidelines

## Security & Privacy
- Never commit secrets: API keys, passwords, certificates, tokens
- Scan code for exposed credentials before Git operations
- Use environment variables or secure config files for sensitive data
- Review dependencies for known vulnerabilities
- Sanitize logs and error messages to avoid data leaks

## Git Workflow
- Always commit and push non-trivial changes when Git repo exists
- Write descriptive commit messages explaining the "why"
- Review changes before committing: `git diff --staged`
- Use branching strategy appropriate for project size
- Tag releases for versioned software

## Code Quality
- Follow existing code style and conventions in the project
- Run project's quality tools before committing (linter, formatter, tests)
- Match existing patterns: imports, error handling, logging
- Verify changes don't break existing functionality
- Write self-documenting code; avoid unnecessary comments

## Build & Development
- Build: No build step required (vanilla HTML/CSS/JS)
- Test: Manual testing of quiz generation and file uploads
- Lint/Format: Use consistent JavaScript ES6+ formatting
- Run: `python -m http.server` or open index.html in browser
- Package: Static file deployment (GitHub Pages, Netlify, etc.)

## Project Standards

### Code Organization
- Follow existing directory structure
- Group related functionality together
- Use consistent naming conventions
- Separate configuration from implementation

### Dependencies
- Prefer established, maintained libraries
- Document version requirements
- Keep dependencies minimal and justified
- Pin versions for reproducible builds

### Documentation
- Update relevant docs when changing behavior
- Include setup/build instructions
- Document non-obvious design decisions
- Keep README current with project state