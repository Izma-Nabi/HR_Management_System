# Local Database Certificates

If Aiven/Prisma asks for a CA certificate, download the CA certificate from
the Aiven console and save it here as:

```text
Backend/certs/aiven-ca.pem
```

Then use the `DATABASE_URL` example in `.env.example` that includes:

```text
sslcert=./certs/aiven-ca.pem
```

Certificate files ending in `.pem` are ignored by Git for local safety.
