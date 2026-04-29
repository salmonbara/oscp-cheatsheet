---
title: 5432 - PostgreSQL
type: service
tab: Services
ports: [5432]
service: PostgreSQL
phases: [enumeration, credential-access]
tools: [psql, hydra]
inputs: [Username, Password]
outputs: [Databases, Tables, Credentials]
tags:
  - PostgreSQL
  - Enumeration
  - InitialAccess
---

# 5432 - PostgreSQL

## Commands

### Connect

#Username #Password #PostgreSQL #Enumeration
Connect to PostgreSQL after finding or guessing credentials.

```sh
psql -h <TARGET_IP> -U <USER>
psql -h <TARGET_IP> -U <USER> -d <DB_NAME>
```

### Quick Enum

#Username #Password #PostgreSQL #Enumeration
List databases, switch database, list tables, and inspect a table.

```sql
\l
\c <DB_NAME>
\dt
\d <TABLE_NAME>
SELECT * FROM <TABLE_NAME> LIMIT 10;
```

### Hydra Check

#Username #Password #PostgreSQL #InitialAccess
Test PostgreSQL credentials with Hydra only after confirming lockout risk is not relevant.

```sh
hydra -l <USER> -P <WORDLIST> <TARGET_IP> postgres
```
