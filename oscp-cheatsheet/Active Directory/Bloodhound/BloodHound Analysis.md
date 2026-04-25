---
title: BloodHound Analysis
type: note
tab: Active Directory
tools:
  - nxc
  - bloodhound
inputs:
  - Username
  - Password
outputs:
  - Paths
tags:
  - ActiveDirectory
  - Enumeration
---

# BloodHound Analysis

## Focus

- BloodHound collection commands now live in [[../Post-Creds Enum]].
- This note is for what to look at after the data is loaded.

## What To Review

- Shortest path to `Domain Admins`
- Sessions on admin workstations / servers
- Local admin edges on member servers
- ACL abuse paths such as `GenericAll`, `WriteDACL`, `ForceChangePassword`
- Delegation and AD CS shortcuts

## Cypher Queries

#ActiveDirectory #Enumeration
Useful custom queries when built-in BloodHound queries are not specific enough.

```cypher
-- Shortest path to Domain Admins.
MATCH p=shortestPath((u:User)-[*1..]->(g:Group {name:'DOMAIN ADMINS@<DOMAIN>'})) RETURN p

-- All Kerberoastable users.
MATCH (u:User {hasspn:true}) RETURN u.name, u.description

-- Computers with unconstrained delegation.
MATCH (c:Computer {unconstraineddelegation:true}) RETURN c.name

-- AS-REP roastable users.
MATCH (u:User {dontreqpreauth:true}) RETURN u.name

-- Non-admin users with a path to Domain Admins.
MATCH p=shortestPath((u:User {admincount:false})-[*1..]->(g:Group {name:'DOMAIN ADMINS@<DOMAIN>'})) RETURN p

-- Users with local admin rights on computers.
MATCH p=(u:User)-[:AdminTo]->(c:Computer) RETURN u.name, c.name

-- Inspect one user and its direct outgoing edges.
MATCH (u:User {name:"<USER>@<DOMAIN>"})-[r]->(o) RETURN u,r,o

-- Inspect one group and its direct outgoing edges.
MATCH (g:Group {name:"<GROUP>@<DOMAIN>"})-[r]->(o) RETURN g,r,o
```

## Next

- Collection flow: [[../Post-Creds Enum]]
- Edge abuse: [[Edges Privilege]]
- AD CS abuse: [[Certification - ADCS]]
- Full privesc pathing: [[Privesc]]
