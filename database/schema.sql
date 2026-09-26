-- PackIntel PostgreSQL schema (idempotent)

CREATE TABLE IF NOT EXISTS packaging_materials (
    id                        SERIAL PRIMARY KEY,
    material_name             VARCHAR(100) NOT NULL UNIQUE,
    material_category         VARCHAR(60)  NOT NULL,
    description               TEXT         NOT NULL,
    min_thickness             NUMERIC(8,2) NOT NULL CHECK (min_thickness > 0),
    max_thickness             NUMERIC(8,2) NOT NULL,
    otr_min                   NUMERIC(12,3) NOT NULL CHECK (otr_min >= 0),
    otr_max                   NUMERIC(12,3) NOT NULL,
    wvtr_min                  NUMERIC(10,3) NOT NULL CHECK (wvtr_min >= 0),
    wvtr_max                  NUMERIC(10,3) NOT NULL,
    sealability               SMALLINT NOT NULL CHECK (sealability BETWEEN 1 AND 5),
    mechanical_strength       SMALLINT NOT NULL CHECK (mechanical_strength BETWEEN 1 AND 5),
    gas_permeability          SMALLINT NOT NULL CHECK (gas_permeability BETWEEN 1 AND 5),
    moisture_barrier          SMALLINT NOT NULL CHECK (moisture_barrier BETWEEN 1 AND 5),
    oxygen_barrier            SMALLINT NOT NULL CHECK (oxygen_barrier BETWEEN 1 AND 5),
    map_suitability           SMALLINT NOT NULL CHECK (map_suitability BETWEEN 1 AND 5),
    recyclable                BOOLEAN NOT NULL,
    biodegradable             BOOLEAN NOT NULL,
    relative_cost             SMALLINT NOT NULL CHECK (relative_cost BETWEEN 1 AND 5),
    suitable_food_categories  TEXT[] NOT NULL,
    suitable_storage_types    TEXT[] NOT NULL,
    notes                     TEXT,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_thickness_range CHECK (max_thickness >= min_thickness),
    CONSTRAINT chk_otr_range CHECK (otr_max >= otr_min),
    CONSTRAINT chk_wvtr_range CHECK (wvtr_max >= wvtr_min)
);

CREATE INDEX IF NOT EXISTS idx_materials_category ON packaging_materials (material_category);
CREATE INDEX IF NOT EXISTS idx_materials_food_categories ON packaging_materials USING GIN (suitable_food_categories);

CREATE TABLE IF NOT EXISTS commodities (
    id                    SERIAL PRIMARY KEY,
    commodity_name        VARCHAR(80) NOT NULL UNIQUE,
    category              VARCHAR(40) NOT NULL,
    typical_moisture      NUMERIC(5,2) NOT NULL CHECK (typical_moisture BETWEEN 0 AND 100),
    typical_oil_content   NUMERIC(5,2) NOT NULL CHECK (typical_oil_content BETWEEN 0 AND 100),
    typical_ph            NUMERIC(4,2) NOT NULL CHECK (typical_ph BETWEEN 0 AND 14),
    respiration_level     VARCHAR(10) NOT NULL CHECK (respiration_level IN ('low', 'medium', 'high')),
    moisture_sensitivity  VARCHAR(10) NOT NULL CHECK (moisture_sensitivity IN ('low', 'medium', 'high')),
    oxygen_sensitivity    VARCHAR(10) NOT NULL CHECK (oxygen_sensitivity IN ('low', 'medium', 'high')),
    notes                 TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recommendation_requests (
    id                    SERIAL PRIMARY KEY,
    commodity             VARCHAR(80) NOT NULL,
    food_category         VARCHAR(40) NOT NULL,
    request_payload       JSONB NOT NULL,
    recommended_material  VARCHAR(100) NOT NULL,
    suitability_score     NUMERIC(5,1) NOT NULL,
    data_source           VARCHAR(40) NOT NULL,
    response_payload      JSONB,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE recommendation_requests ADD COLUMN IF NOT EXISTS response_payload JSONB;

CREATE INDEX IF NOT EXISTS idx_requests_created_at ON recommendation_requests (created_at DESC);

CREATE TABLE IF NOT EXISTS food_profiles (
    food_name VARCHAR(80) PRIMARY KEY,
    profile JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS food_images (
    id UUID PRIMARY KEY,
    expected_size INTEGER NOT NULL,
    original_filename TEXT NOT NULL,
    storage_path TEXT,
    identification JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'uploading',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
