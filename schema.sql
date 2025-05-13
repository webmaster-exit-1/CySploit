CREATE TABLE metasploit_scans (
    id SERIAL PRIMARY KEY,
    command TEXT NOT NULL,
    target TEXT NOT NULL,
    start_time TIMESTAMP DEFAULT NOW(),
    end_time TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'running',
    raw_output TEXT,
    xml_output TEXT
);

CREATE TABLE hosts (
    id SERIAL PRIMARY KEY,
    scan_id INT REFERENCES metasploit_scans(id) ON DELETE CASCADE,
    ip_address TEXT NOT NULL,
    hostname TEXT,
    state TEXT DEFAULT 'unknown',
    last_seen TIMESTAMP DEFAULT NOW(),
    os_details JSONB,
    mac_address TEXT,
    vendor TEXT
);

CREATE TABLE ports (
    id SERIAL PRIMARY KEY,
    host_id INT REFERENCES hosts(id) ON DELETE CASCADE,
    port_number INT NOT NULL,
    protocol TEXT NOT NULL,
    state TEXT NOT NULL,
    service TEXT,
    product TEXT,
    version TEXT,
    extra_info TEXT
);

CREATE TABLE vulnerabilities (
    id SERIAL PRIMARY KEY,
    host_id INT REFERENCES hosts(id) ON DELETE CASCADE,
    port_id INT REFERENCES ports(id),
    cve_id TEXT,
    cvss_score TEXT,
    severity TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    discovered_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE shodan_searches (
    id SERIAL PRIMARY KEY,
    query TEXT NOT NULL,
    search_time TIMESTAMP DEFAULT NOW(),
    result_count INT DEFAULT 0,
    raw_results JSONB
);

CREATE TABLE shodan_results (
    id SERIAL PRIMARY KEY,
    search_id INT REFERENCES shodan_searches(id) ON DELETE CASCADE,
    ip_address TEXT NOT NULL,
    port INT NOT NULL,
    hostnames TEXT[],
    country_name TEXT,
    organization TEXT,
    isp TEXT,
    os TEXT,
    timestamp TIMESTAMP,
    product TEXT,
    version TEXT,
    vulnerabilities TEXT[]
);
