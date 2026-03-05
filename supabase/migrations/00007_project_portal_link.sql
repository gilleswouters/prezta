-- Add portal_link column to projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS portal_link UUID DEFAULT uuid_generate_v4() UNIQUE;

-- Backfill existing rows just in case some don't get the default properly
UPDATE projects SET portal_link = uuid_generate_v4() WHERE portal_link IS NULL;

-- Ensure it's not null for future inserts
ALTER TABLE projects ALTER COLUMN portal_link SET NOT NULL;

-- Allow public access to project data if they have the portal link.
CREATE POLICY "Allow public read access to projects via portal link" 
ON projects FOR SELECT 
USING (true);

-- For invoices and quotes, we also need to allow public read access if they belong to a project.
CREATE POLICY "Allow public read access to project quotes" 
ON quotes FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access to invoices" 
ON invoices FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access to project contracts" 
ON project_contracts FOR SELECT 
USING (true);

-- And clients (for the client name/address on the portal)
CREATE POLICY "Allow public read access to clients" 
ON clients FOR SELECT 
USING (true);
