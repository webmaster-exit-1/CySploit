# Copilot Instructions for CySploit

## Project Overview

CySploit is a cutting-edge cybersecurity analysis platform built with a modern full-stack architecture. It provides network discovery, vulnerability scanning, packet analysis, 3D visualization, and integrates with Shodan API and Metasploit Framework.

### Technology Stack

- **Frontend**: React 18 with TypeScript, Vite for bundling
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Desktop**: Electron for cross-platform support
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query)
- **3D Visualization**: A-Frame and React Force Graph

### Project Structure

```
CySploit/
├── client/          # React frontend application
│   └── src/         # Source files for the UI
├── server/          # Express backend server
│   ├── routes/      # API route handlers
│   └── services/    # Business logic services
├── electron/        # Electron desktop app configuration
├── shared/          # Shared types and utilities
├── migrations/      # Database migration files
└── scripts/         # Utility scripts
```

## Build and Development Commands

### Essential Commands

- **Install dependencies**: `npm install`
- **Development mode**: `npm run dev` (runs both client and server)
- **Build**: `npm run build` (builds both client and server)
- **Lint**: `npm run check` or `npm run lint`
- **Database generate**: `npm run db:generate`
- **Database migrate**: `npm run db:migrate`
- **Database push**: `npm run db:push`
- **Electron dev**: `npm run electron:dev`
- **Build Electron**: `npm run build:electron`

### Testing

Currently, there is no automated test suite. When adding tests in the future, follow the project's TypeScript and testing conventions.

## Code Style and Conventions

### General Principles

1. **TypeScript First**: Use TypeScript for all new code. Avoid `any` types when possible (warnings allowed).
2. **ESLint**: Follow the project's ESLint configuration. Run `npm run lint` before committing.
3. **Functional Components**: Use React functional components with hooks, not class components.
4. **Async/Await**: Prefer async/await over raw Promises for better readability.

### TypeScript Guidelines

- Use explicit type annotations for function parameters and return types
- Leverage TypeScript's type inference where it improves code clarity
- Use interfaces for object shapes and types for unions/intersections
- Unused variables generate warnings, not errors

### React Guidelines

- Use hooks (`useState`, `useEffect`, `useCallback`, etc.) for state management
- Follow the shadcn/ui component patterns for UI components
- Use TanStack Query for data fetching and caching
- Keep components focused and single-purpose

### CSS/Styling Guidelines

- Use Tailwind CSS utility classes for styling
- Follow the shadcn/ui design system and component library
- Ensure UI is responsive and accessible
- Use the existing color scheme and design tokens

### File Organization

- Place client-side code in `client/src/`
- Place server-side code in `server/`
- Shared types and utilities go in `shared/`
- Use clear, descriptive file names
- Group related functionality together

### Naming Conventions

- **Files**: Use kebab-case for file names (e.g., `network-scanner.tsx`)
- **Components**: Use PascalCase for React components (e.g., `NetworkScanner`)
- **Functions**: Use camelCase for functions and variables (e.g., `handleSubmit`)
- **Constants**: Use UPPER_SNAKE_CASE for constants (e.g., `API_BASE_URL`)
- **Types/Interfaces**: Use PascalCase (e.g., `UserProfile`, `ScanResult`)

## Security Considerations

### Critical Security Rules

1. **No API Keys in Code**: Never commit API keys, secrets, or credentials to version control
2. **Input Validation**: Always validate and sanitize user input on both client and server
3. **Dependency Updates**: Be cautious about introducing new dependencies
4. **Security Vulnerabilities**: If you find a security issue, document it clearly
5. **Elevated Permissions**: This is a security tool that may require elevated permissions - request only the minimum necessary

### Secure Coding Practices

- Use environment variables for sensitive configuration (`.env` file)
- Store sensitive credentials in the system's keychain/credential manager
- Validate and sanitize all user inputs
- Use parameterized queries for database operations
- Follow OWASP security best practices

## API and External Integrations

### Shodan API

- API keys configured in Settings → API Keys
- Never hardcode Shodan API keys
- Handle API rate limits gracefully

### Metasploit Integration

- Shares PostgreSQL database with CySploit
- Configure connection settings in Settings
- Ensure Metasploit Framework is installed on the system

### Database (PostgreSQL)

- Use Drizzle ORM for all database operations
- Migrations are in `migrations/` directory
- Use `npm run db:generate` to generate migrations
- Use `npm run db:migrate` to apply migrations

## Dependencies and Package Management

### Package Manager

- Use `npm` as the package manager
- Run `npm install` to install dependencies
- Keep `package.json` and `package-lock.json` in sync

### Adding New Dependencies

1. Evaluate if the dependency is necessary
2. Check for security vulnerabilities
3. Use `npm install <package>` for runtime dependencies
4. Use `npm install --save-dev <package>` for dev dependencies
5. Update documentation if the dependency affects usage

## Documentation Standards

### Code Documentation

- Use JSDoc comments for complex functions and classes
- Document function parameters, return types, and behavior
- Keep comments up to date with code changes
- Explain "why" in comments, not "what" (code should be self-explanatory)

### User Documentation

- Update README.md when adding new features
- Document configuration options in relevant files
- Include usage examples for new features
- Document security implications of features

## Commit Guidelines

### Commit Message Format

Use conventional commit messages:
- `feat: add network scanner feature`
- `fix: resolve connection timeout issue`
- `docs: update installation instructions`
- `refactor: simplify authentication logic`
- `chore: update dependencies`

### Commit Best Practices

- Keep commits focused on a single change
- Write clear, descriptive commit messages
- Reference issue numbers when applicable (e.g., `fix: resolve #123`)

## Pull Request Guidelines

1. Fork the repository and create a feature branch
2. Make your changes following the code style guidelines
3. Run `npm run lint` to check for linting errors
4. Run `npm run build` to ensure the project builds successfully
5. Write or update tests as needed (when test infrastructure exists)
6. Update documentation as needed
7. Create a pull request with a clear description
8. Reference any related issues

## Common Tasks

### Adding a New Feature

1. Plan the feature and its scope
2. Create necessary types/interfaces in `shared/` or appropriate location
3. Implement backend API routes in `server/routes/`
4. Implement frontend components in `client/src/`
5. Add appropriate error handling
6. Update documentation
7. Test the feature manually

### Fixing a Bug

1. Reproduce the bug
2. Identify the root cause
3. Implement the fix with minimal changes
4. Test the fix thoroughly
5. Ensure no regressions
6. Document the fix if it affects usage

### Updating Dependencies

1. Review the changelog for breaking changes
2. Update the dependency version
3. Run `npm install`
4. Test the application thoroughly
5. Update code if breaking changes exist

## Architecture Patterns

### Backend (Express.js)

- Use Express middleware for cross-cutting concerns
- Implement route handlers in `server/routes/`
- Keep business logic in `server/services/`
- Use async/await for asynchronous operations
- Return appropriate HTTP status codes

### Frontend (React)

- Use TanStack Query for API calls and caching
- Implement proper loading and error states
- Use React Router (wouter) for navigation
- Keep components small and focused
- Use custom hooks for reusable logic

### Database (Drizzle ORM)

- Define schemas with proper types
- Use transactions for multi-step operations
- Handle database errors gracefully
- Use migrations for schema changes

## Performance Considerations

- Optimize React component re-renders with `useMemo` and `useCallback`
- Use React Query's caching effectively
- Minimize bundle size by avoiding unnecessary dependencies
- Use lazy loading for large components
- Optimize database queries to avoid N+1 problems

## Accessibility

- Ensure UI is keyboard navigable
- Use semantic HTML elements
- Provide appropriate ARIA labels
- Test with screen readers when possible
- Ensure sufficient color contrast

## Electron-Specific Guidelines

- Keep Electron main process code in `electron/`
- Use IPC for communication between main and renderer processes
- Handle platform-specific code appropriately
- Test on multiple platforms when possible (Linux, Windows, macOS)

## Environment Setup

### Required Environment Variables

Create a `.env` file based on `.env.example`:
- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Server port (default: 5000)
- Additional API keys as needed

### Local Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up PostgreSQL database
4. Create `.env` file with configuration
5. Run database migrations: `npm run db:migrate`
6. Start development server: `npm run dev`
7. Open browser to `http://localhost:5000`

## Troubleshooting

### Common Issues

- **Build failures**: Ensure all dependencies are installed with `npm install`
- **Database connection errors**: Check `DATABASE_URL` in `.env`
- **Port conflicts**: Change `PORT` in `.env` if default port is occupied
- **Electron issues**: Ensure Electron is properly installed

## Questions and Support

- Open an issue on GitHub with the "question" label
- Review existing issues and documentation
- Contact maintainers: echohellosuperuser@member.fsf.org

## Additional Resources

- [Contributing Guidelines](../CONTRIBUTING.md)
- [Security Policy](../SECURITY.md)
- [README](../README.md)
