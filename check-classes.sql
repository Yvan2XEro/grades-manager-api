-- Check classes for the academic year and institution
SELECT
  c.id,
  c.name,
  c.academic_year,
  c.program,
  c.institution_id,
  p.name as program_name,
  ay.name as academic_year_name
FROM classes c
LEFT JOIN programs p ON c.program = p.id
LEFT JOIN academic_years ay ON c.academic_year = ay.id
WHERE c.institution_id = 'db6d9fa2-bc65-48e3-a874-417ba5c21708'
ORDER BY c.name;

-- Check all academic years for this institution
SELECT id, name, start_date, end_date, is_active
FROM academic_years
WHERE institution_id = 'db6d9fa2-bc65-48e3-a874-417ba5c21708'
ORDER BY start_date DESC;

-- Check if any classes exist at all for the programs
SELECT
  c.id,
  c.name,
  c.academic_year,
  p.name as program_name
FROM classes c
LEFT JOIN programs p ON c.program = p.id
WHERE c.program IN (
  'fc5f170c-4911-4516-8dcb-a22b3263d9b1',
  'c66fda42-b784-4502-b511-48ba93d0d0ca'
)
ORDER BY c.name;
