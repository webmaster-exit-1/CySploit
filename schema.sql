CREATE TABLE scans (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL, -- e.g., 'nmap', 'metasploit', 'nessus'
    command TEXT, -- Command used for the scan, if applicable
    target TEXT NOT NULL, -- Target of the scan (e.g., IP, CIDR, domain)
    start_time TIMESTAMP DEFAULT NOW(),
    end_time TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'running', -- e.g., 'running', 'completed', 'error', 'pending'
    raw_output TEXT, -- Raw text output from the scan tool
    xml_output TEXT, -- XML output, if available (e.g., from nmap -oX)
    json_output JSONB -- JSON output, if available
);

CREATE TABLE hosts (
    id SERIAL PRIMARY KEY,
    scan_id INT REFERENCES scans(id) ON DELETE CASCADE, -- Link to the specific scan
    ip_address TEXT NOT NULL UNIQUE, -- Consider making IP unique or unique per scan
    hostname TEXT,
    state TEXT DEFAULT 'unknown', -- e.g., 'up', 'down', 'unknown'
    last_seen TIMESTAMP DEFAULT NOW(),
    os_details JSONB, -- Store OS detection results (e.g., name, version, CPE)
    mac_address TEXT,
    vendor TEXT -- MAC address vendor
);

CREATE TABLE ports (
    id SERIAL PRIMARY KEY,
    host_id INT REFERENCES hosts(id) ON DELETE CASCADE,
    port_number INT NOT NULL,
    protocol TEXT NOT NULL, -- e.g., 'tcp', 'udp'
    state TEXT NOT NULL, -- e.g., 'open', 'closed', 'filtered'
    service TEXT, -- Service name (e.g., 'http', 'ssh')
    product TEXT, -- Product running on the service (e.g., 'Apache httpd')
    version TEXT, -- Version of the product
    extra_info TEXT, -- Additional information from the scan
    CONSTRAINT unique_host_port_protocol UNIQUE (host_id, port_number, protocol)
);

CREATE TABLE vulnerabilities (
    id SERIAL PRIMARY KEY,
    host_id INT REFERENCES hosts(id) ON DELETE CASCADE,
    port_id INT REFERENCES ports(id) ON DELETE SET NULL, -- Vulnerability might not be port-specific
    cve_id TEXT, -- CVE identifier (e.g., 'CVE-2021-44228')
    cvss_score TEXT, -- CVSS score (e.g., '9.8')
    severity TEXT NOT NULL, -- e.g., 'Critical', 'High', 'Medium', 'Low', 'Informational'
    title TEXT NOT NULL,
    description TEXT,
    solution TEXT, -- Proposed solution or mitigation
    references TEXT, -- Array of URLs or reference IDs (e.g., stored as a comma-separated string or JSON array string)
    discovered_at TIMESTAMP DEFAULT NOW(),
    source TEXT -- e.g., 'nmap-vulners', 'nessus', 'manual'
);

CREATE TABLE shodan_searches (
    id SERIAL PRIMARY KEY,
    query TEXT NOT NULL,
    search_time TIMESTAMP DEFAULT NOW(),
    result_count INT DEFAULT 0,
    raw_results JSONB -- Store the full JSON response from Shodan
);

CREATE TABLE shodan_results (
    id SERIAL PRIMARY KEY,
    search_id INT REFERENCES shodan_searches(id) ON DELETE CASCADE,
    ip_address TEXT NOT NULL,
    port INT NOT NULL,
    hostnames TEXT[],
    country_name TEXT,
    city_name TEXT,
    organization TEXT,
    isp TEXT,
    os TEXT,
    timestamp TIMESTAMP, -- Timestamp of Shodan's data
    product TEXT,
    version TEXT,
    cpe TEXT[], -- Common Platform Enumeration
    tags TEXT[],
    vulnerabilities TEXT[], -- List of CVEs reported by Shodan
    raw_data JSONB -- Store individual host data from Shodan
);

-- Optional: Indexes for performance
CREATE INDEX idx_hosts_ip_address ON hosts(ip_address);
CREATE INDEX idx_ports_host_id ON ports(host_id);
CREATE INDEX idx_vulnerabilities_host_id ON vulnerabilities(host_id);
CREATE INDEX idx_vulnerabilities_cve_id ON vulnerabilities(cve_id);
CREATE INDEX idx_shodan_results_ip_address ON shodan_results(ip_address);
