import type { Portfolio } from '../data/types.ts'

const stamp = '2026-01-01T00:00:00.000Z'

/** Short fictional data used only for the template thumbnails. */
export const SAMPLE_PORTFOLIO: Portfolio = {
  id: 'sample',
  full_name: 'Alex Rivera',
  email: 'alex.rivera@example.com',
  contact_number: '(503) 555-0199',
  address: 'Portland, Oregon',
  about_me: 'A computer science student who builds small websites and likes clear writing.',
  profile_picture_url: null,
  profile_picture_path: null,
  template_id: 1,
  created_at: stamp,
  updated_at: stamp,
  education: [
    {
      id: 'edu-1',
      portfolio_id: 'sample',
      sort_order: 0,
      school: 'Northwind University',
      degree: 'B.S. Computer Science',
      field_of_study: 'Computer Science',
      start_year: 2026,
      end_year: 2030,
      description: null,
      created_at: stamp,
    },
  ],
  skills: [
    { id: 'sk-1', portfolio_id: 'sample', sort_order: 0, name: 'JavaScript', level: 3, created_at: stamp },
    { id: 'sk-2', portfolio_id: 'sample', sort_order: 1, name: 'HTML and CSS', level: 4, created_at: stamp },
    { id: 'sk-3', portfolio_id: 'sample', sort_order: 2, name: 'Python', level: 2, created_at: stamp },
  ],
  projects: [
    {
      id: 'pr-1',
      portfolio_id: 'sample',
      sort_order: 0,
      title: 'Campus Event Board',
      description: 'A page where clubs post weekly events.',
      project_url: 'https://example.com/events',
      technologies: 'HTML, CSS, JavaScript',
      created_at: stamp,
    },
    {
      id: 'pr-2',
      portfolio_id: 'sample',
      sort_order: 1,
      title: 'Study Timer',
      description: 'A focus timer for exam weeks.',
      project_url: 'https://example.com/timer',
      technologies: 'Python',
      created_at: stamp,
    },
  ],
  work_experience: [
    {
      id: 'wk-1',
      portfolio_id: 'sample',
      sort_order: 0,
      company: 'City Library',
      position: 'Shelving Assistant',
      start_date: '2025-06-01',
      end_date: '2025-08-15',
      is_current: false,
      description: 'Helped visitors find titles.',
      created_at: stamp,
    },
  ],
  social_links: [
    { id: 'ln-1', portfolio_id: 'sample', sort_order: 0, platform: 'GitHub', url: 'https://github.com/example', created_at: stamp },
  ],
}
