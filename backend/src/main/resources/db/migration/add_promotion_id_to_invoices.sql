-- Add promotion_id column to invoices table
-- This column stores the promotion ID that was applied to the invoice
-- Usage will only be tracked when invoice is fully paid (status = 'paid')

ALTER TABLE invoices 
ADD COLUMN promotion_id BIGINT NULL;

-- Add index for better query performance
CREATE INDEX idx_invoices_promotion_id ON invoices(promotion_id);

-- Add foreign key constraint (optional, can be removed if you want to keep promotions even after deletion)
-- ALTER TABLE invoices 
-- ADD CONSTRAINT fk_invoices_promotion 
-- FOREIGN KEY (promotion_id) REFERENCES promotions(id);

