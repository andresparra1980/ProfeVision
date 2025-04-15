# ESLint 8 to ESLint 9 Migration Guide

## Changes Made

- Upgraded from ESLint 8 to ESLint 9
- Converted from legacy configuration (`.eslintrc.json`) to flat config format (`eslint.config.js`)
- Added necessary plugins to maintain the same linting rules
- Added explicit react-hooks plugin dependency

## Key Differences in ESLint 9

1. **Flat Config Format**
   - ESLint 9 uses the flat config format by default
   - Configuration is now in `eslint.config.js` at the project root
   - The file is a JavaScript module that exports an array of config objects

2. **Plugin and Extension Changes**
   - Plugins are now imported directly in the config file
   - Extensions are replaced with spreading config objects
   - Rules need to be explicitly included per file pattern

3. **Removed Legacy Files**
   - The `.eslintrc.json` file is no longer used
   - All configuration is now centralized in `eslint.config.js`

## Post-Migration Verification

After the migration, you should verify that:

1. Run `yarn lint` to check that ESLint still works
2. Review any errors or warnings to ensure they match expectations
3. If you encounter any issues, check:
   - Plugin compatibility
   - Rule definitions
   - Import paths

## References

- [ESLint 9 Release Notes](https://eslint.org/blog/2023/10/eslint-v9.0.0-released/)
- [Flat Config Migration Guide](https://eslint.org/docs/latest/use/configure/migration-guide)
- [Configuration Files (ESLint 9)](https://eslint.org/docs/latest/use/configure/configuration-files) 