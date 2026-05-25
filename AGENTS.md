# Repository Guidelines

## Project Structure & Module Organization

This repository is a Java 17 Spring Boot application built with Gradle. Main source code lives in `src/main/java/com/seo/reborn`, with `RebornApplication.java` as the application entry point. Runtime configuration and console assets are in `src/main/resources`, including `application.yaml` and `banner.txt`. Tests live under `src/test/java/com/seo/reborn` and should mirror the main package layout. Product requirements are maintained in `docs/REQUIREMENTS.md`. Gradle wrapper files are committed at the repository root and under `gradle/wrapper`.

## Build, Test, and Development Commands

Use the Gradle wrapper so contributors run the same Gradle version:

```powershell
.\gradlew.bat compileJava
```

Compiles main Java sources.

```powershell
.\gradlew.bat test
```

Runs the JUnit Platform test suite.

```powershell
.\gradlew.bat bootRun
```

Starts the Spring Boot application locally.

This project requires Java 17. On Windows, verify `JAVA_HOME` points to a JDK 17 installation before running Gradle.

## Coding Style & Naming Conventions

Use Java conventions: classes in `PascalCase`, methods and fields in `camelCase`, and constants in `UPPER_SNAKE_CASE`. Keep packages under `com.seo.reborn`. Indent Java code with tabs, matching the existing source. Prefer constructor injection for Spring components. Keep configuration in YAML with two-space indentation and no leading whitespace before root keys.

## Testing Guidelines

Tests use `spring-boot-starter-test` with JUnit Platform. Name test classes after the unit or integration target, for example `RebornApplicationTests` or `StartupConsoleTests`. Keep test packages aligned with production packages. Run `.\gradlew.bat test` before opening a pull request. If tests need Spring context startup, provide a test datasource or profile so JPA auto-configuration can load.

## Commit & Pull Request Guidelines

This checkout does not include Git history, so no repository-specific commit convention can be inferred. Use clear, imperative commit messages such as `Add startup console banner` or `Configure test datasource`. Pull requests should include a short summary, test results, linked issues when applicable, and screenshots or console output when changing user-visible CLI or startup output.

## Security & Configuration Tips

Do not commit local database credentials, secrets, or machine-specific paths. Use environment variables or profile-specific configuration for datasource settings. Keep generated build outputs in `build/` out of source control.
