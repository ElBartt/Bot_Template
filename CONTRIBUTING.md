# Contributing to Discord Bot Template

Thank you for your interest in contributing to the Discord Bot Template! We welcome contributions from developers of all skill levels. This guide will help you get started with contributing to the project.

## 🎯 Ways to Contribute

- **Bug Reports**: Help us identify and fix issues
- **Feature Requests**: Suggest new features or improvements
- **Code Contributions**: Submit bug fixes, features, or improvements
- **Documentation**: Improve guides, examples, and API documentation
- **Community Support**: Help other users in issues and discussions

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- Git
- A GitHub account
- Basic knowledge of JavaScript and Discord.js

### Setting Up Your Development Environment

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:

   ```bash
   git clone https://github.com/ElBartt/Discord-Bot-Template.git
   cd Discord-Bot-Template
   ```

3. **Add the upstream remote**:

   ```bash
   git remote add upstream https://github.com/ElBartt/Discord-Bot-Template.git
   ```

4. **Install dependencies**:

   ```bash
   npm install
   ```

5. **Set up environment variables**:

   ```bash
   cp .env.example .env.development
   # Edit .env with your Discord bot credentials
   ```

6. **Verify the setup**:
   ```bash
   npm run lint
   npm run start:dev
   ```

## 📋 Development Workflow

### Before You Start

1. **Check existing issues** to see if your bug/feature is already being worked on
2. **Create an issue** if one doesn't exist to discuss your proposed changes
3. **Wait for maintainer feedback** before starting work on large features

### Making Changes

1. **Create a feature branch** from `main`:

   ```bash
   git checkout main
   git pull upstream main
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards
3. **Test your changes** thoroughly
4. **Commit your changes** with clear, descriptive messages

### Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to build process or auxiliary tools

**Examples:**

```
feat(commands): add music playback command
fix(database): resolve connection timeout issues
docs(readme): update installation instructions
```

### Pull Request Process

1. **Update your branch** with the latest changes:

   ```bash
   git checkout main
   git pull upstream main
   git checkout your-feature-branch
   git rebase main
   ```

2. **Push your changes**:

   ```bash
   git push origin your-feature-branch
   ```

3. **Create a Pull Request** on GitHub with:

   - Clear title and description
   - Reference to related issues
   - Screenshots/GIFs if applicable
   - Test results or verification steps

4. **Address review feedback** promptly and professionally

## 🔍 Code Style Guidelines

### JavaScript/Node.js Standards

- **Use ES6+ features** (arrow functions, destructuring, async/await)
- **Prefer `const`** over `let`, avoid `var`
- **Use meaningful variable names** (`userMessage` not `msg`)
- **Keep functions small** and focused on single responsibilities
- **Handle errors gracefully** with try/catch blocks
- **Use JSDoc comments** for public APIs

### Project-Specific Conventions

- **Command Structure**: Follow the existing command template pattern
- **Error Handling**: Use the centralized error handling utilities
- **Logging**: Use the Winston logger, not `console.log`
- **Database Operations**: Use the database abstraction layer
- **Message Utilities**: Use provided embed and component utilities

### Code Examples

**Good Command Structure:**

```javascript
const { SlashCommandBuilder } = require("discord.js");
const { createSuccessEmbed, safeReply } = require("../../utils/messageUtils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("example")
    .setDescription("Example command description"),

  cooldown: 3,

  async execute(interaction) {
    try {
      // Command logic here
      const embed = createSuccessEmbed(
        "Success",
        "Command executed successfully!"
      );
      await safeReply(interaction, { embeds: [embed] });
    } catch (error) {
      logger.error("Example command error:", error);
      // Error handling here
    }
  },
};
```

**Good Event Handler:**

```javascript
const { Events } = require("discord.js");
const logger = require("../utils/logger");

module.exports = {
  name: Events.MessageCreate,
  once: false,

  async execute(message) {
    try {
      // Event logic here
      logger.debug(`Message received: ${message.content}`);
    } catch (error) {
      logger.error("Message create event error:", error);
    }
  },
};
```

## 🧪 Testing Guidelines

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### Writing Tests

- **Write tests for new features** and bug fixes
- **Test both success and error cases**
- **Mock external dependencies** (Discord API, database)
- **Use descriptive test names** that explain what is being tested

**Test Example:**

```javascript
const { createSuccessEmbed } = require("../../src/utils/messageUtils");

describe("messageUtils", () => {
  describe("createSuccessEmbed", () => {
    it("should create embed with correct title and description", () => {
      const embed = createSuccessEmbed("Test Title", "Test Description");

      expect(embed.data.title).toBe("Test Title");
      expect(embed.data.description).toBe("Test Description");
      expect(embed.data.color).toBe(0x00ff00); // Green color
    });
  });
});
```

## 📚 Documentation

### Writing Documentation

- **Use clear, concise language**
- **Include code examples** when applicable
- **Update relevant documentation** when making changes
- **Follow existing documentation structure**

### Documentation Types

- **README.md**: Project overview and quick start
- **API Documentation**: In-code JSDoc comments
- **Guides**: Step-by-step tutorials in `/docs`
- **Code Comments**: Explain complex logic, not obvious code

## 🔒 Security Considerations

- **Never commit sensitive data** (tokens, passwords, API keys)
- **Validate all user inputs** to prevent injection attacks
- **Use environment variables** for configuration
- **Follow Discord's Terms of Service** and rate limits
- **Report security vulnerabilities** privately to maintainers

## 🐛 Bug Reports

When reporting bugs, include:

- **Clear description** of the problem
- **Steps to reproduce** the issue
- **Expected vs actual behavior**
- **Environment information** (Node.js version, OS, etc.)
- **Error logs** and stack traces
- **Minimal code example** if applicable

## 💡 Feature Requests

When suggesting features:

- **Explain the use case** and problem it solves
- **Provide detailed description** of the proposed solution
- **Consider backwards compatibility**
- **Discuss implementation approach** if you have ideas
- **Be open to alternative solutions**

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and community support
- **Code Review**: Submit draft PRs for early feedback
- **Discord Communities**: Join Discord.js and Node.js communities

## 🏷️ Issue Labels

We use labels to categorize issues and PRs:

- `bug`: Something isn't working
- `enhancement`: New feature or improvement
- `documentation`: Documentation improvements
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention needed
- `question`: Further information requested
- `wontfix`: Will not be worked on

## 📈 Release Process

1. **Version bumping** follows [Semantic Versioning](https://semver.org/)
2. **Changelog** is updated with all changes
3. **Testing** on staging environment
4. **Release notes** summarize key changes
5. **Documentation** is updated as needed

## 🎉 Recognition

Contributors will be:

- **Listed in CONTRIBUTORS.md** (if they opt-in)
- **Mentioned in release notes** for significant contributions
- **Given credit** in documentation they help improve
- **Invited to become maintainers** for sustained contributions

## 📜 Code of Conduct

By participating in this project, you agree to:

- **Be respectful** and inclusive to all contributors
- **Use welcoming language** in all interactions
- **Focus on collaboration** and constructive feedback
- **Respect different viewpoints** and experiences
- **Follow project maintainer decisions** on technical matters

Unacceptable behavior includes harassment, discriminatory language, or disruptive conduct. Project maintainers have the right and responsibility to remove, edit, or reject contributions that don't align with this Code of Conduct.

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the same [MIT License](LICENSE) that covers the project.
