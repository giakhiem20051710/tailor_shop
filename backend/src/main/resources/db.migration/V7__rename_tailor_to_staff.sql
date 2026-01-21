-- Migrate appointment & working slot ownership from tailor_id -> staff_id

-- 1) Appointments: add staff_id, copy data, drop old column and FK
ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS staff_id BIGINT NULL;

UPDATE appointments
SET staff_id = tailor_id
WHERE staff_id IS NULL;

-- Drop old FK if exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_appointments_tailor_id'
    ) THEN
        ALTER TABLE appointments DROP CONSTRAINT fk_appointments_tailor_id;
    END IF;
EXCEPTION WHEN undefined_table THEN
    NULL;
END $$;

ALTER TABLE appointments
    DROP COLUMN IF EXISTS tailor_id;

ALTER TABLE appointments
    ADD CONSTRAINT fk_appointments_staff_id FOREIGN KEY (staff_id) REFERENCES users(id);

-- 2) Working slots: add staff_id NOT NULL, copy data, drop old column and FK
ALTER TABLE working_slots
    ADD COLUMN IF NOT EXISTS staff_id BIGINT NULL;

UPDATE working_slots
SET staff_id = tailor_id
WHERE staff_id IS NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_working_slots_tailor_id'
    ) THEN
        ALTER TABLE working_slots DROP CONSTRAINT fk_working_slots_tailor_id;
    END IF;
EXCEPTION WHEN undefined_table THEN
    NULL;
END $$;

ALTER TABLE working_slots
    DROP COLUMN IF EXISTS tailor_id;

ALTER TABLE working_slots
    ALTER COLUMN staff_id SET NOT NULL;

ALTER TABLE working_slots
    ADD CONSTRAINT fk_working_slots_staff_id FOREIGN KEY (staff_id) REFERENCES users(id);

