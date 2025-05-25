# Claude Guidelines for gentrace-node

## Project Overview

gentrace-node is a Node.js SDK for the Gentrace API, which provides tools for evaluating and monitoring AI applications.

## Code Style Guidelines

- Follow the existing TypeScript/JavaScript code style in the repository
- Use ES6+ features where appropriate
- Maintain consistent indentation (2 spaces)
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Follow the existing error handling patterns

## Testing Requirements

- Write unit tests for new functionality using the existing test framework
- Ensure all tests pass before submitting PRs
- Maintain or improve test coverage

## PR Guidelines

- Keep PRs focused on a single feature or bug fix
- Include clear descriptions of changes
- Reference related issues
- Update documentation as needed

## Commit Message Format

- Use clear, descriptive commit messages
- Start with a verb in the present tense (e.g., "Add", "Fix", "Update")
- Reference issue numbers when applicable

## Dependencies

- Minimize adding new dependencies
- Prefer well-maintained, widely-used packages
- Consider bundle size impact

## Security Considerations

- Never expose API keys or sensitive information
- Follow secure coding practices
- Validate user inputs

## Documentation

- Update README.md for significant changes
- Document new features and APIs
- Keep code comments up-to-date

## Performance

- Consider performance implications of changes
- Avoid unnecessary computations or memory usage
