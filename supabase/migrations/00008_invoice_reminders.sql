-- Add last_reminder_date to invoices table to track manual reminder emails
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS last_reminder_date TIMESTAMP WITH TIME ZONE;

-- Add comment
COMMENT ON COLUMN invoices.last_reminder_date IS 'Date when the last reminder email was manually triggered by the user';
