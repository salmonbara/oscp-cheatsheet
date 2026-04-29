---
title: Nmap
type: note
tab: Enum
tools: [nmap]
inputs: []
outputs: [Ports, Services]
tags: [Enumeration]
---

# Nmap

## TCP

#Enumeration
Quick TCP scan reference from a default pass to a full aggressive scan.

```sh
# Fast common-port scan.
nmap -T4 -F <TARGET_IP>

# Default scripts and version detection.
nmap -sC -sV -oN nmap/default <TARGET_IP>

# Full TCP port scan with service detection.
nmap -Pn -sC -sV -p- -oN nmap/tcp-all <TARGET_IP>
nmap -sV -sC -p- <TARGET_IP> -oN scan_<TARGET_IP>.txt

# Aggressive full scan.
nmap -vv -Pn -A -sC -sS -T4 -p- <TARGET_IP> -oN nmap/fullscan
```

## UDP

#Enumeration
Quick UDP scan reference for top ports and common infrastructure services.

```sh
# Basic mixed TCP/UDP discovery.
nmap -sS -sU -Pn -sV <TARGET_IP>

# Top UDP ports.
nmap -sU -A --top-ports=20 --version-all <TARGET_IP>
nmap -sU --top-ports 200 <TARGET_IP> -oN udp_<TARGET_IP>.txt

# Common infrastructure UDP ports.
nmap -sU -A -p 53,67,68,161,162 --version-all <TARGET_IP>
```

## Scripts

#Enumeration
Run a broad safe/discovery/vuln NSE pass after the initial scan.

```sh
nmap --script vuln,safe,discovery -oN nmap/scripts <TARGET_IP>
```
