# Test Coverage Guide

This project uses [c8](https://github.com/bcoe/c8) for test coverage reporting with Node.js's built-in test runner.

## Available Coverage Commands

### Unit Tests with Coverage
```bash
npm run test:cov
```
Runs all unit tests (`*.spec.ts`) and generates coverage reports in HTML, text, and LCOV formats.

### Watch Mode with Coverage
```bash
npm run test:cov:watch
```
Runs tests in watch mode with coverage reporting.

### Integration Tests with Coverage
```bash
npm run test:cov:integration
```
Runs all integration tests (`*.integration.spec.ts`) with coverage reporting.

### E2E Tests with Coverage
```bash
npm run test:cov:e2e
```
Runs all end-to-end tests with coverage reporting.

### All Tests with Coverage
```bash
npm run test:cov:all
```
Runs all test types (unit, integration, and e2e) with combined coverage reporting.

## Coverage Reports

After running any coverage command, you'll find reports in the `coverage/` directory:

- **HTML Report**: Open `coverage/index.html` in your browser for an interactive coverage report
- **LCOV Report**: `coverage/lcov.info` - Can be used by CI/CD tools and IDE integrations
- **Text Report**: Printed directly to the console

## Coverage Configuration

Coverage settings are configured in `.c8rc.json`:

- **Included**: All TypeScript files in `src/**/*.ts`
- **Excluded**: 
  - Test files (`*.spec.ts`, `*.integration.spec.ts`, `*.test.ts`)
  - Type definitions (`*.d.ts`)
  - Migrations (`src/migrations/**`)
  - Entry point (`src/main.ts`)
  - TypeORM config (`typeorm.config.ts`)

### Coverage Thresholds

The project is configured with 80% coverage thresholds for:
- Lines
- Functions
- Branches
- Statements

To enforce these thresholds, update `.c8rc.json` and set `"check-coverage": true`.

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run tests with coverage
  run: npm run test:cov

- name: Upload coverage reports
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

### GitLab CI Example
```yaml
test:coverage:
  script:
    - npm run test:cov
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
```

## IDE Integration

### Visual Studio Code
Install the [Coverage Gutters](https://marketplace.visualstudio.com/items?itemName=ryanluker.vscode-coverage-gutters) extension and it will automatically pick up the `coverage/lcov.info` file.

### WebStorm/IntelliJ
Go to `Run > Show Coverage Data` and select the `coverage/lcov.info` file.

## Tips

1. **Keep coverage high**: Aim for at least 80% coverage on critical business logic
2. **Focus on meaningful tests**: Don't write tests just to increase coverage numbers
3. **Review HTML reports**: They help identify untested code paths
4. **Exclude when necessary**: Not all code needs coverage (e.g., DTOs, interfaces)

## Troubleshooting

### Coverage not showing TypeScript files
- Ensure `ts-node` is properly configured
- Check that source maps are enabled in your `tsconfig.json`

### Low coverage numbers
- Run with `--all` flag to include all files, not just tested ones
- Check `.c8rc.json` to ensure files aren't being excluded unnecessarily

### Coverage reports not generated
- Ensure the `coverage/` directory has write permissions
- Check that c8 is installed: `npm list c8`

