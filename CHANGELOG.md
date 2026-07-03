# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Rewritten

Complete overhaul of the library and example app, migrating to current
React Native tooling and upgrading all dependencies.

### Changed

- **React Native** 0.78 → 0.86, all ecosystem packages aligned
- **TypeScript** 5 → 6, **Jest** 29 → 30, **Turbo** 1 → 2
- **Prettier** 3.8 → 3.9, **ESLint** 9.22 → 9.x (latest v9)
- **Android Gradle** 8.12 → 8.13, **Gradle wrapper** updated
- Jest preset migrated to `@react-native/jest-preset` (moved in RN 0.86)
- Metro config rewritten for `react-native-builder-bob` 0.43
- Babel kept at v7 (Metro not yet compatible with Babel 8)
