CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(30) NOT NULL,
    avatar TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_profiles (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    uhid VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    dob DATE,
    age INTEGER,
    gender VARCHAR(30),
    blood_group VARCHAR(20),
    phone VARCHAR(50),
    email VARCHAR(255),
    emergency_contact VARCHAR(255),
    allergies JSONB NOT NULL DEFAULT '[]'::jsonb,
    chronic_conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
    emergency_access_allowed BOOLEAN NOT NULL DEFAULT FALSE,
    registered_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS doctor_profiles (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    specialization VARCHAR(255),
    hospital VARCHAR(255),
    license_number VARCHAR(255),
    consultation_fee NUMERIC(10,2),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS patient_consents (
    id VARCHAR(150) PRIMARY KEY,
    patient_id VARCHAR(100) NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    doctor_id VARCHAR(100) NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL,
    access_scope JSONB NOT NULL DEFAULT '[]'::jsonb,
    reason TEXT,
    duration VARCHAR(50),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(150) PRIMARY KEY,
    patient_id VARCHAR(100),
    patient_uhid VARCHAR(100),
    actor_id VARCHAR(100),
    actor_name VARCHAR(255),
    actor_role VARCHAR(50),
    action VARCHAR(100),
    resource TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address TEXT,
    reason TEXT,
    consent_id VARCHAR(150),
    access_granted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS app_state (
    id INTEGER PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_uhid
    ON patient_profiles(uhid);

CREATE INDEX IF NOT EXISTS idx_patient_user
    ON patient_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_consent_patient
    ON patient_consents(patient_id);

CREATE INDEX IF NOT EXISTS idx_consent_doctor
    ON patient_consents(doctor_id);

CREATE INDEX IF NOT EXISTS idx_audit_patient
    ON audit_logs(patient_id);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp
    ON audit_logs(timestamp);