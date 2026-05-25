# Deployment

RE:BORN can be deployed as one Spring Boot service. The Docker image builds the React frontend first, packages it into the Spring Boot JAR, and serves the app from the same origin.

## Required Environment Variables

Use the `prod` profile with a persistent database.

```text
SPRING_PROFILES_ACTIVE=prod
DATABASE_URL=jdbc:postgresql://HOST:PORT/DATABASE
DATABASE_USERNAME=...
DATABASE_PASSWORD=...
DATABASE_DRIVER_CLASS_NAME=org.postgresql.Driver
JPA_DDL_AUTO=update
REQUIRE_WRITE_AUTH=true
DEV_LOGIN_ENABLED=false
KAKAO_REST_API_KEY=...
KAKAO_CLIENT_SECRET=... # optional
```

If the host provides a Render-style `postgresql://user:password@host:port/database` URL, the Docker entrypoint converts it automatically.

## Local Production Build

```powershell
npm.cmd --prefix frontend install
.\gradlew.bat bootJar
java -jar .\build\libs\reborn-0.0.1-SNAPSHOT.jar
```

Then open `http://localhost:8081`.

## Local Data Persistence

The `local` profile uses a file-based H2 database at `./data/reborn-local`.
This keeps local QA data across backend restarts. The `data/` directory is ignored by Git.

For deployment, keep using the `prod` profile with PostgreSQL.

## Docker

```powershell
docker build -t reborn .
docker run --rm -p 8081:8081 `
  -e SPRING_PROFILES_ACTIVE=prod `
  -e DATABASE_URL="jdbc:postgresql://host.docker.internal:5432/reborn" `
  -e DATABASE_USERNAME="reborn" `
  -e DATABASE_PASSWORD="change-me" `
  reborn
```

## Render Blueprint

The included `render.yaml` creates one Docker web service and one PostgreSQL database. After connecting the repository in Render, create a new Blueprint instance from this repo.

Render's database connection string is not a JDBC URL, so the Docker entrypoint converts it before Spring Boot starts.

After deployment, register the service URL in Kakao Developers as a redirect URI:

```text
https://YOUR_DOMAIN/
```

## Pre-Deploy Checklist

- Confirm the Render service uses `SPRING_PROFILES_ACTIVE=prod`.
- Confirm `REQUIRE_WRITE_AUTH=true` and `DEV_LOGIN_ENABLED=false`.
- Set `KAKAO_REST_API_KEY` in Render before testing Kakao login.
- Add the final Render URL to Kakao Developers redirect URI.
- Open the deployed root URL and confirm the React app loads from the Spring Boot service.
- Confirm read-only access works without login and write actions require login.
