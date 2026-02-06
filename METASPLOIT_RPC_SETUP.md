# Metasploit RPC Integration Setup

## Overview

CySploit integrates with Metasploit Framework via the Metasploit RPC (Remote Procedure Call) interface. **Metasploit is not embedded** in CySploit - instead, CySploit connects to an external Metasploit RPC daemon (`msfrpcd`) that must be running separately.

This design allows CySploit to leverage the full power of Metasploit Framework while maintaining a clean separation of concerns.

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────────────┐
│   CySploit  │◄───────►│  msfrpcd     │◄───────►│  Metasploit         │
│   (Client)  │  msgpack│  (RPC Server)│         │  Framework          │
│             │  over   │              │         │  + PostgreSQL DB    │
│             │  TCP    │  Port 55553  │         │                     │
└─────────────┘         └──────────────┘         └─────────────────────┘
```

## Prerequisites

1. **Metasploit Framework** must be installed on your system
   - Installation instructions: https://docs.metasploit.com/docs/using-metasploit/getting-started/nightly-installers.html
   - Verify with: `msfconsole --version`

2. **PostgreSQL Database** for Metasploit
   - CySploit's docker-compose includes Metasploit database setup
   - Database name: `msf_db`
   - Default credentials: `msf_user` / `msf_password`

3. **Metasploit RPC Daemon** (`msfrpcd`)
   - Comes bundled with Metasploit Framework
   - Allows remote control of Metasploit via msgpack protocol

## Setting Up Metasploit RPC

### Step 1: Configure Metasploit Database

If you haven't already, initialize the Metasploit database:

```bash
# Start CySploit's PostgreSQL container
docker compose up -d

# Initialize Metasploit database configuration
msfdb init
```

**Or** configure Metasploit to use CySploit's PostgreSQL:

Create/edit `~/.msf4/database.yml`:

```yaml
production:
  adapter: postgresql
  database: msf_db
  username: msf_user
  password: msf_password
  host: localhost
  port: 5432
  pool: 5
  timeout: 5
```

Verify the connection:

```bash
msfconsole -q -x "db_status; exit"
```

### Step 2: Start Metasploit RPC Daemon

Start the RPC daemon with authentication:

```bash
msfrpcd -P <your-password> -S -a 127.0.0.1 -p 55553
```

Options explained:
- `-P <password>`: Set RPC password for authentication
- `-S`: Disable SSL (use for local connections)
- `-a 127.0.0.1`: Bind to localhost only (security)
- `-p 55553`: Port for RPC connections (default)

**For production use with SSL:**

```bash
msfrpcd -P <your-password> -a 127.0.0.1 -p 55553
```

### Step 3: Configure CySploit Connection

1. Start CySploit application
2. Navigate to **Settings** page
3. Configure Metasploit RPC connection:
   - **Host**: `127.0.0.1` (or `localhost`)
   - **Port**: `55553` (default RPC port)
   - **Username**: `msf` (default)
   - **Password**: The password you set with `-P` flag

4. Click **Test Connection** to verify

### Step 4: Verify Integration

1. Go to **Metasploit Console** page in CySploit
2. Try running a command: `version`
3. You should see Metasploit version information

## Starting msfrpcd Automatically

### Linux (systemd)

Create `/etc/systemd/system/msfrpcd.service`:

```ini
[Unit]
Description=Metasploit RPC Daemon
After=network.target postgresql.service

[Service]
Type=simple
User=<your-user>
ExecStart=/usr/bin/msfrpcd -P <your-password> -S -a 127.0.0.1 -p 55553
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable msfrpcd
sudo systemctl start msfrpcd
```

### macOS (launchd)

Create `~/Library/LaunchAgents/com.metasploit.msfrpcd.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.metasploit.msfrpcd</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/metasploit-framework/bin/msfrpcd</string>
        <string>-P</string>
        <string>your-password</string>
        <string>-S</string>
        <string>-a</string>
        <string>127.0.0.1</string>
        <string>-p</string>
        <string>55553</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```

Load the service:

```bash
launchctl load ~/Library/LaunchAgents/com.metasploit.msfrpcd.plist
```

## Troubleshooting

### Connection Refused

**Problem**: CySploit cannot connect to Metasploit RPC

**Solutions**:
1. Verify `msfrpcd` is running: `ps aux | grep msfrpcd`
2. Check if port is listening: `netstat -an | grep 55553`
3. Verify firewall isn't blocking port 55553
4. Check credentials match what you configured

### Database Connection Failed

**Problem**: Metasploit cannot connect to PostgreSQL

**Solutions**:
1. Verify PostgreSQL is running: `docker ps | grep postgres`
2. Check database credentials in `~/.msf4/database.yml`
3. Test connection: `psql -h localhost -U msf_user -d msf_db`
4. Review container logs: `docker logs cysploit-db-1`

### Authentication Failed

**Problem**: "Authentication failed" error in CySploit

**Solutions**:
1. Verify the password matches what you set with `-P` flag
2. Username should be `msf` (default)
3. Try restarting `msfrpcd` with correct password

### SSL Certificate Errors

**Problem**: SSL/TLS errors when connecting

**Solutions**:
1. For local connections, use `-S` flag to disable SSL
2. For remote connections, generate proper SSL certificates
3. Never disable SSL for remote/internet connections

## Security Considerations

1. **Never expose msfrpcd to the internet**
   - Always bind to `127.0.0.1` for local-only access
   - Use firewall rules to block external access to port 55553

2. **Use strong passwords**
   - RPC password should be complex and unique
   - Don't use default passwords in production

3. **Enable SSL for remote connections**
   - Only use `-S` (disable SSL) for localhost
   - Remote connections must use SSL/TLS

4. **Limit user permissions**
   - Run `msfrpcd` as a non-root user when possible
   - Use separate database credentials for Metasploit

## RPC API Reference

CySploit uses these Metasploit RPC methods:

- `auth.login` - Authenticate and get token
- `core.version` - Get Metasploit version
- `console.create` - Create a console session
- `console.write` - Send commands to console
- `console.read` - Read console output
- `db.hosts` - List discovered hosts
- `db.services` - List discovered services
- `db.vulns` - List discovered vulnerabilities
- `module.exploits` - List available exploits
- `module.auxiliary` - List auxiliary modules
- `session.list` - List active sessions

Full API documentation: https://docs.metasploit.com/docs/development/api/rpc.html

## Alternative: Embedded Metasploit (Not Recommended)

While it's technically possible to embed Metasploit directly into CySploit, this approach is **not recommended** because:

1. **Licensing concerns** - Metasploit Framework license may not permit embedding
2. **Size overhead** - Would significantly increase application size
3. **Maintenance burden** - Would need to update Metasploit independently
4. **Security risks** - Running exploitation tools in the same process as UI
5. **Resource management** - Harder to isolate and control resource usage

The RPC approach provides a clean, secure, and maintainable integration while keeping the tools separate.

## Support

If you encounter issues:

1. Check Metasploit logs: `~/.msf4/logs/`
2. Check CySploit logs in the browser console (F12)
3. Verify network connectivity: `telnet localhost 55553`
4. Review this documentation: [METASPLOIT_DATABASE_SETUP.md](METASPLOIT_DATABASE_SETUP.md)
5. Open an issue: https://github.com/webmaster-exit-1/CySploit/issues

---

**Last Updated**: 2025-02-06  
**Status**: RPC Integration (By Design)
