# Contributing to CySploit

Thank you for your interest in contributing to CySploit! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct (see CODE_OF_CONDUCT.md).

## How Can I Contribute?

### Reporting Bugs

Bug reports help us improve CySploit. When reporting bugs, please:

1. Check if the bug has already been reported in the Issues tab
2. Use the bug report template when creating a new issue
3. Include detailed steps to reproduce the problem
4. Include screenshots if applicable
5. Specify your operating system, CySploit version, and any other relevant details

### Suggesting Features

We welcome feature suggestions:

1. Check if the feature has already been suggested in the Issues tab
2. Use the feature request template when creating a new issue
3. Clearly describe the feature and its use case
4. Explain why this feature would benefit the CySploit community

### Pull Requests

We actively welcome pull requests:

1. Fork the repository
2. Create a branch for your feature or bugfix (`git checkout -b feature/my-feature` or `git checkout -b fix/my-bugfix`)
3. Make your changes
4. Write or update tests as needed
5. Update documentation as needed
6. Ensure all tests pass
7. Create a pull request
8. Reference any related issues in your pull request

## Development Setup

### Prerequisites

- Node.js (v18.x or later)
- npm (v8.x or later)
- PostgreSQL (optional, for database features)

### Setting Up the Development Environment

1. Clone your fork of the repository
    ```bash
    git clone https://github.com/your-username/CySploit.git
    cd CySploit
    ```

2. Install dependencies
    ```bash
    npm install
    ```

3. Create a `.env` file based on `.env.example`
    ```bash
    cp .env.example .env
    ```

4. Start the development server
    ```bash
    npm run dev
    ```

### Running Tests

```bash
npm test
```

### Building the Desktop App

```bash
npm run electron:build
```

## Style Guide

### JavaScript/TypeScript

- We follow the ESLint configuration in the project
- Use TypeScript where possible
- Use async/await instead of Promises where appropriate
- Document your code with JSDoc comments

### CSS/UI

- We use Tailwind CSS for styling
- Follow the design system and component library (shadcn/ui)
- Ensure UI is responsive and accessible

## Commit Guidelines

- Use conventional commit messages where possible (e.g., `feat: add network scanner`, `fix: resolve connection issue`)
- Keep commits focused on a single change
- Write clear commit messages that describe what and why (not how)

## Documentation

- Update documentation when changing functionality
- Document new features, including:
  - Purpose of the feature
  - How to use it
  - Any security implications
  - Examples if applicable

## Security

- Always validate user input
- Be cautious about introducing new dependencies
- Never commit API keys or secrets
- Follow the security guidelines in SECURITY.md
- If you find a security vulnerability, please follow the security reporting process

## Questions?

If you have questions about contributing, feel free to:

1. Open an issue with the "question" label
2. Contact the maintainers directly

Thank you for contributing to CySploit!