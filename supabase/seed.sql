-- Optional sample portfolio. Run after 0001_init.sql.
-- Safe to run again: the sample is inserted only when its id is missing.
-- This person is fictional and is here so the Table Editor is not empty.

do $$
declare
  sample_id uuid := '11111111-1111-4111-8111-111111111111';
begin
  if exists (select 1 from public.portfolios where id = sample_id) then
    return;
  end if;

  insert into public.portfolios (
    id, full_name, email, contact_number, address, about_me, template_id
  ) values (
    sample_id,
    'Maya Ellison',
    'maya.ellison@example.com',
    '(415) 555-0148',
    '18 Harbor Street, Portland, Oregon',
    'I am a first-year computer science student who likes building small, useful websites. I care about clear writing, tidy code, and projects a real person can finish.',
    1
  );

  insert into public.education (
    portfolio_id, sort_order, school, degree, field_of_study, start_year, end_year, description
  ) values
    (
      sample_id, 0, 'Northwind University', 'Bachelor of Science', 'Computer Science',
      2026, 2030, 'First-year coursework in programming, discrete mathematics, and web development.'
    ),
    (
      sample_id, 1, 'Lincoln High School', 'High School Diploma', 'General Studies',
      2022, 2026, 'Robotics club and the student newspaper.'
    );

  insert into public.skills (portfolio_id, sort_order, name, level) values
    (sample_id, 0, 'JavaScript', 3),
    (sample_id, 1, 'HTML and CSS', 4),
    (sample_id, 2, 'Python', 2),
    (sample_id, 3, 'Git', 3);

  insert into public.projects (
    portfolio_id, sort_order, title, description, project_url, technologies
  ) values
    (
      sample_id, 0, 'Campus Event Board',
      'A simple page where student clubs can post weekly events.',
      'https://example.com/campus-events',
      'HTML, CSS, JavaScript'
    ),
    (
      sample_id, 1, 'Study Timer',
      'A focus timer with a short task list for exam weeks.',
      'https://example.com/study-timer',
      'Python'
    );

  insert into public.work_experience (
    portfolio_id, sort_order, company, position, start_date, end_date, is_current, description
  ) values
    (
      sample_id, 0, 'City Library', 'Shelving Assistant',
      date '2025-06-01', date '2025-08-15', false,
      'Kept shelves in order and helped visitors find titles.'
    ),
    (
      sample_id, 1, 'Neighborhood Tutoring', 'Math Tutor',
      date '2026-01-10', null, true,
      'Tutor middle-school students in pre-algebra on Saturday mornings.'
    );

  insert into public.social_links (portfolio_id, sort_order, platform, url) values
    (sample_id, 0, 'GitHub', 'https://github.com/maya-ellison'),
    (sample_id, 1, 'LinkedIn', 'https://www.linkedin.com/in/maya-ellison'),
    (sample_id, 2, 'Website', 'https://maya.example.com');
end $$;
