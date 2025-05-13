# Security Policy

## Supported Versions

CySploit is currently under active development. We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of CySploit seriously. If you believe you've found a security vulnerability, please follow these steps:

### For Critical Vulnerabilities

For vulnerabilities that could lead to remote code execution, exposure of sensitive user data, or other high-severity issues:

1. **Do not** disclose the vulnerability publicly or to any third parties
2. Email details of the vulnerability to security@example.com
3. Include as much information as possible, including:
   - A detailed description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact
   - Any suggested mitigations (if known)

We will acknowledge receipt of your report within 48 hours and provide an estimated timeline for a fix.

### For Less Critical Vulnerabilities

For lower severity issues (UI glitches with security implications, non-critical information disclosure, etc.):

1. File an issue on GitHub using the Security Vulnerability template
2. Label the issue as "security"
3. Our team will triage and address these issues according to their severity

## Security Measures

CySploit implements the following security measures:

1. **API Key Protection**: We ensure API keys (like Shodan API keys) are never stored in version control or bundled with releases
2. **Secure Local Storage**: Sensitive credentials are stored securely in the system's keychain/credential manager where available
3. **Automatic Updates**: The desktop application includes an auto-update mechanism to deliver security patches
4. **Dependency Scanning**: Regular automated scanning of dependencies for known vulnerabilities
5. **Code Scanning**: Static code analysis to identify potential security issues

## Disclosure Policy

When security vulnerabilities are reported, we follow this disclosure process:

1. Confirm the vulnerability and identify affected versions
2. Develop and test a fix
3. Release patches for all supported versions
4. Notify users via release notes
5. After users have had sufficient time to update (typically 30 days), publish a security advisory with details of the vulnerability

## Security Requirements

CySploit is a security tool, and as such, may require elevated permissions to perform certain operations, especially in the desktop version. We are committed to requesting only the minimum permissions necessary for each feature to function correctly.