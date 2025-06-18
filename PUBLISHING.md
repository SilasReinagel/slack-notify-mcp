# Publishing Guide

This guide covers how to publish the `slack-webhook-mcp-server` package to npm following best practices.

## Prerequisites

1. **npm Account**: You need an npm account. Create one at [npmjs.com](https://www.npmjs.com)
2. **npm CLI**: Make sure you have npm installed and are logged in:
   ```bash
   npm login
   ```
3. **Repository Setup**: Update the repository URLs in `package.json` to match your GitHub repository

## Pre-Publishing Checklist

### 1. Update Package Information
- [ ] Update `author` field in `package.json` with your name and email
- [ ] Update `repository` URLs to point to your actual GitHub repository
- [ ] Update `bugs` and `homepage` URLs accordingly
- [ ] Verify the package `name` is available on npm (check at npmjs.com)

### 2. Version Management
Follow [Semantic Versioning](https://semver.org/):
- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features, backwards compatible
- **PATCH** (0.0.1): Bug fixes, backwards compatible

Update version:
```bash
npm version patch   # For bug fixes
npm version minor   # For new features
npm version major   # For breaking changes
```

### 3. Build and Test
```bash
# Install dependencies
npm install

# Type check
npm run typecheck

# Build the package
npm run build

# Test the built package locally
node dist/index.js --help
```

### 4. Package Content Verification
```bash
# Preview what will be published
npm pack --dry-run

# Or create an actual tarball to inspect
npm pack
tar -tzf slack-webhook-mcp-server-*.tgz
```

## Publishing Steps

### Option 1: Standard Publishing
```bash
# Build and publish
npm run build
npm publish
```

### Option 2: Publishing with Scoped Package
If you want to publish under your npm scope:
```bash
# Update package name in package.json to @yourusername/slack-webhook-mcp-server
npm publish --access public
```

### Option 3: Beta/Alpha Releases
For pre-release versions:
```bash
# Update version with pre-release tag
npm version prerelease --preid=beta

# Publish with beta tag
npm publish --tag beta
```

## Post-Publishing

### 1. Verify Publication
- Check your package on [npmjs.com](https://www.npmjs.com/package/slack-webhook-mcp-server)
- Test installation: `npm install -g slack-webhook-mcp-server`
- Test functionality: `slack-webhook-mcp-server --help`

### 2. Create GitHub Release
1. Push your version tag: `git push --tags`
2. Create a release on GitHub with changelog

### 3. Update Documentation
- Update README.md with installation instructions
- Add examples and usage documentation

## Maintenance

### Regular Updates
- Keep dependencies updated: `npm audit` and `npm update`
- Monitor for security vulnerabilities
- Maintain backwards compatibility

### Deprecation (if needed)
```bash
# Deprecate a version
npm deprecate slack-webhook-mcp-server@1.0.0 "This version has security issues"

# Unpublish (only within 72 hours)
npm unpublish slack-webhook-mcp-server@1.0.0 --force
```

## Troubleshooting

### Common Issues
1. **Package name already taken**: Choose a different name or use scoped package
2. **Build errors**: Check TypeScript configuration and fix compilation errors
3. **Authentication errors**: Run `npm login` and verify credentials
4. **Permission errors**: Make sure you have permission to publish to the package name

### Files Not Being Published
- Check `.npmignore` file (we exclude source files, only publish `dist/`)
- Verify `files` array in `package.json`
- Use `npm pack --dry-run` to preview

### TypeScript Issues
- Ensure `typescript` is in devDependencies
- Verify `tsconfig.json` configuration
- Check that `.d.ts` files are generated in `dist/`

## Best Practices Implemented

✅ **Package Structure**
- Proper entry points (`main`, `types`, `bin`)
- ES modules support
- TypeScript declarations included

✅ **Build Process**
- Automated build on publish (`prepublishOnly`)
- Clean dist directory before build
- TypeScript compilation with declarations

✅ **File Management**
- `.npmignore` excludes source files
- `files` array in package.json explicitly defines published files
- Only built artifacts are published

✅ **Metadata**
- Comprehensive keywords for discoverability
- Proper license (MIT)
- Repository and bug tracker links
- Engine requirements (Node.js >= 18)

✅ **CLI Support**
- Binary entry point configured
- Executable permissions via shebang

✅ **Development Experience**
- TypeScript configuration
- Development scripts
- Version management ready 