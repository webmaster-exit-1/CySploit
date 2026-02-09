# Testing Infrastructure Documentation

**Created:** 2026-02-07  
**Version:** 2.0.5  
**Status:** ✅ Configured and Operational

---

## 📋 Overview

CySploit now has a comprehensive testing infrastructure using Vitest, @testing-library/react, and coverage reporting. This document describes the testing setup, how to write tests, and best practices.

---

## 🛠️ Testing Stack

### Core Testing Framework
- **Vitest** (v4.0.18) - Fast unit test framework powered by Vite
- **@testing-library/react** - React component testing utilities
- **@testing-library/jest-dom** - Custom DOM matchers
- **jsdom** - JavaScript implementation of web standards for Node.js
- **@vitest/ui** - Visual UI for running tests
- **@vitest/coverage-v8** - Code coverage reporting using V8

---

## 🚀 Getting Started

### Running Tests

```bash
# Run tests in watch mode (for development)
npm test

# Run tests once and exit
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

---

## 📁 Test Structure

### Test Files Location
Tests are located in the `/tests` directory at the project root:

```
CySploit/
├── tests/
│   ├── setup.ts              # Test setup and global mocks
│   ├── utils.test.ts         # Utility functions tests
│   ├── NeonBorder.test.tsx   # Component tests
│   └── ...more tests
├── vitest.config.ts          # Vitest configuration
└── ...
```

### Naming Convention
- Unit tests: `*.test.ts` or `*.spec.ts`
- Component tests: `*.test.tsx` or `*.spec.tsx`
- Integration tests: `*.integration.test.ts`
- E2E tests: `*.e2e.test.ts`

---

## ✅ Current Test Coverage

### Summary (as of 2026-02-07)
- **Test Files:** 2
- **Total Tests:** 48 (all passing ✅)
- **Statement Coverage:** 100%
- **Branch Coverage:** 96.96%
- **Function Coverage:** 100%
- **Line Coverage:** 100%

### Tested Modules
1. **Utility Functions** (`client/src/lib/utils.ts`)
   - 35 tests covering all utility functions
   - 100% coverage across all metrics

2. **NeonBorder Component** (`client/src/components/common/NeonBorder.tsx`)
   - 13 tests covering all component variations
   - 100% coverage across all metrics

---

## 📝 Writing Tests

### Unit Test Example (Utility Functions)

```typescript
import { describe, it, expect } from 'vitest';
import { formatBytes } from '@/lib/utils';

describe('formatBytes', () => {
  it('should format 0 bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
  });

  it('should format bytes correctly', () => {
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1024 * 1024)).toBe('1 MB');
  });
});
```

### Component Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NeonBorder } from '@/components/common/NeonBorder';

describe('NeonBorder Component', () => {
  it('should render children correctly', () => {
    render(<NeonBorder color="cyan">Test Content</NeonBorder>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should apply cyan color class', () => {
    const { container } = render(
      <NeonBorder color="cyan">Test</NeonBorder>
    );
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass('neon-border-cyan');
  });
});
```

---

## 🎯 Test Coverage Goals

Our coverage targets are:

- **Minimum Coverage:** 70%
- **Target Coverage:** >80%
- **Current Coverage:** 100% (utilities and components tested so far)

### Coverage Thresholds (vitest.config.ts)
```typescript
coverage: {
  lines: 70,
  functions: 70,
  branches: 70,
  statements: 70
}
```

---

## 🔧 Configuration

### Vitest Configuration (`vitest.config.ts`)

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/',
        '**/build/'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
      '@server': path.resolve(__dirname, './server')
    }
  }
});
```

### Test Setup (`tests/setup.ts`)

The setup file includes:
- Jest-DOM matchers for better assertions
- Automatic cleanup after each test
- Global mocks for:
  - `window.matchMedia`
  - `IntersectionObserver`
  - `ResizeObserver`

---

## 🧪 Testing Best Practices

### 1. Test Naming
- Use descriptive test names that explain what is being tested
- Follow the pattern: "should [expected behavior] when [condition]"
- Examples:
  - ✅ "should format bytes correctly"
  - ✅ "should apply hover effect when hoverEffect is true"
  - ❌ "test formatBytes"

### 2. Test Organization
- Group related tests using `describe` blocks
- One `describe` block per function or component
- Nested `describe` blocks for complex scenarios

### 3. Test Coverage
- Aim for 100% coverage of utility functions
- Test all component props and variations
- Test edge cases and error conditions
- Don't test implementation details, test behavior

### 4. Component Testing
- Test user-visible behavior, not implementation
- Use accessible queries (`getByRole`, `getByLabelText`, `getByText`)
- Avoid testing CSS classes unless they affect functionality
- Mock external dependencies (API calls, third-party libraries)

### 5. Assertions
- Use specific matchers from jest-dom when available
- Prefer `toBeInTheDocument()` over `toBeTruthy()`
- Test one thing per test (prefer multiple small tests)

---

## 📊 What to Test Next

The next areas to add tests:

### Phase 1: Core Utilities (High Priority)
- [ ] Network scanner utilities (`server/services/networkService.ts`)
- [ ] Packet analyzer logic
- [ ] Database queries (Drizzle ORM)
- [ ] API route handlers
- [ ] More React components (critical UI components)

### Phase 2: Integration Tests
- [ ] End-to-end scan workflow
- [ ] Database operations
- [ ] API endpoints
- [ ] Authentication flow (once implemented)

### Phase 3: E2E Tests
- [ ] User login flow
- [ ] Network scanning workflow
- [ ] Settings configuration
- [ ] Report generation

---

## 🐛 Debugging Tests

### Running Specific Tests
```bash
# Run a specific test file
npm test -- tests/utils.test.ts

# Run tests matching a pattern
npm test -- -t "formatBytes"

# Run tests in a specific directory
npm test -- tests/components/
```

### Using the UI
```bash
# Launch the Vitest UI
npm run test:ui
```
The UI provides:
- Visual test runner
- Test file browser
- Coverage visualization
- Error inspection

### Debugging in VS Code
Add this configuration to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["test"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

---

## 🔗 CI/CD Integration

Tests are ready to be integrated into GitHub Actions CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: npm run test:run

- name: Generate Coverage Report
  run: npm run test:coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json
```

---

## 📚 Resources

### Documentation
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library React](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest-DOM Matchers](https://github.com/testing-library/jest-dom)

### Internal Documentation
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines

---

## 🎯 Success Metrics

### Current Status
- ✅ Vitest configured and operational
- ✅ Test setup files created
- ✅ 48 tests written and passing
- ✅ 100% coverage on tested modules
- ✅ Test scripts added to package.json
- ✅ Coverage reporting configured

### Next Milestones
- [ ] 30% overall code coverage (next month)
- [ ] 70% overall code coverage (end of quarter)
- [ ] 80% overall code coverage (production release)
- [ ] E2E tests for critical workflows
- [ ] CI/CD integration

---

## 🤝 Contributing Tests

When contributing to CySploit:

1. **Write tests for new code**
   - All new features must include tests
   - Aim for >80% coverage of new code

2. **Update existing tests**
   - If you modify functionality, update tests
   - Don't skip tests to make builds pass

3. **Run tests before committing**
   ```bash
   npm run test:run
   npm run lint
   ```

4. **Include test results in PRs**
   - Mention test coverage in PR description
   - Include screenshots of failing tests if fixing bugs

---

## 📞 Questions or Issues?

- **GitHub Issues:** https://github.com/webmaster-exit-1/CySploit/issues
- **Email:** echohellosuperuser@member.fsf.org

---

**Last Updated:** 2026-02-07  
**Next Review:** 2026-02-14  
**Maintained By:** CySploit Development Team
