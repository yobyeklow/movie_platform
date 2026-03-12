# Contributing to Movie Platform

Thank you for your interest in contributing to Movie Platform! This document provides guidelines and instructions for contributing.

## 🤝 How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

When creating a bug report, include:
- A descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment details (OS, Node.js version, etc.)

### Suggesting Enhancements

Enhancement suggestions are welcome. Please:
- Use a clear and descriptive title
- Provide a detailed explanation of the suggested enhancement
- Explain why this enhancement would be useful
- Provide examples if applicable

### Pull Requests

#### Before Submitting

1. **Fork the repository**
   ```bash
   # Fork on GitHub, then clone locally
   git clone https://github.com/your-username/movie_platform.git
   cd movie_platform
   ```

2. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

3. **Make your changes**
   - Follow the existing code style
   - Write clear, descriptive commit messages
   - Add tests if applicable
   - Update documentation

4. **Test your changes**
   ```bash
   # Run smart contract tests
   anchor test

   # Run frontend linter
   cd movie_app
   npm run lint
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   # or
   git commit -m "fix: resolve issue with wallet connection"
   ```

   Use conventional commit messages:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting, etc.)
   - `refactor:` - Code refactoring
   - `test:` - Adding or updating tests
   - `chore:` - Maintenance tasks

6. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then create a Pull Request on GitHub.

#### Pull Request Guidelines

- **Title**: Use a clear, descriptive title
- **Description**: Explain what your PR does and why
- **Related Issues**: Link to any related issues (e.g., "Fixes #123")
- **Screenshots**: Include screenshots for UI changes
- **Testing**: Describe how you tested your changes

## 📋 Code Style

### Smart Contracts (Rust)

- Use **cargo fmt** to format code
- Follow Rust naming conventions
- Add comments for complex logic
- Handle errors properly with `?` operator
- Use `#[account]` attributes clearly

```rust
// Good
pub fn mint_pass(ctx: Context<MintPass>, tier: u8) -> Result<()> {
    require!(tier <= 2, ErrorCode::InvalidTier);
    // ... implementation
    Ok(())
}
```

### Frontend (TypeScript/React)

- Use **Prettier** for formatting
- Use TypeScript for type safety
- Use functional components with hooks
- Keep components small and focused
- Use descriptive variable/function names

```typescript
// Good
interface MovieCardProps {
  movie: Movie;
  onWatch: (id: string) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onWatch }) => {
  return (
    <div className="movie-card">
      {/* component content */}
    </div>
  );
};
```

## 🧪 Testing

### Smart Contract Tests

Write tests in the `tests/` directory:

```typescript
describe("Mint Pass", () => {
  it("mints a bronze pass successfully", async () => {
    // arrange
    const tier = 0; // bronze

    // act
    await program.methods
      .mintPass(tier)
      .accounts({ /* accounts */ })
      .rpc();

    // assert
    const passAccount = await program.account.pass.fetch(passPDA);
    assert.equal(passAccount.tier, tier);
  });
});
```

### Frontend Tests

For UI testing, consider using React Testing Library.

## 📝 Documentation

- Update README.md if you add new features
- Update inline comments for complex code
- Document any breaking changes
- Keep API routes documented

## 🐛 Debugging

### Smart Contract Debugging

```bash
# Run tests with output
anchor test -- --nocapture

# Show program logs
solana logs <PROGRAM_ID>
```

### Frontend Debugging

```bash
# Run in debug mode
npm run dev

# Check browser console for errors
```

## 📦 Development Workflow

### Recommended VS Code Extensions

- **Rust Analyzer** - Rust language support
- **TypeScript/JavaScript** - TypeScript support
- **Prettier** - Code formatting
- **ESLint** - Code linting
- **Solana** - Solana integration

### Git Workflow

```bash
# Keep your branch up to date
git checkout main
git pull origin main
git checkout your-branch
git rebase main
```

## 🚫 What NOT to Do

- Don't commit `.env` files or any sensitive data
- Don't commit `node_modules/` or `target/` directories
- Don't commit `.next/` build artifacts
- Don't include API keys or private keys
- Don't make breaking changes without discussing first
- Don't submit large refactors in a single PR

## 📞 Getting Help

- Check existing issues and discussions
- Read the documentation
- Ask questions in GitHub Discussions
- Reach out to maintainers

## 📜 Code of Conduct

Be respectful, inclusive, and professional:
- Welcome newcomers and help them learn
- Assume good intentions
- Be constructive in feedback
- Focus on what is best for the community

---

**Thank you for contributing! 🎉**
