export type CourseSession = {
  id: string;
  weekNumber: number;
  monthNumber: number;
  day: string;
  startTime: string;
  endTime: string;
  title: string;
  topic: string;
  objectives: string[];
  status: 'upcoming' | 'in-progress' | 'completed';
  attendanceRequired: boolean;
};

type WeekPlan = {
  theme: string;
  sessions: [string, string, string];
  assignment: string;
};

const weekPlans: WeekPlan[] = [
  { theme: 'UI/UX Fundamentals', sessions: ['Introduction to UI and UX', 'The UX design process', 'UX case study analysis'], assignment: 'Analyze an existing product and identify five UX problems.' },
  { theme: 'Design Thinking', sessions: ['Design thinking fundamentals', 'User-centered design', 'Problem statements and How Might We questions'], assignment: 'Create a problem statement and three to five How Might We questions.' },
  { theme: 'User Research', sessions: ['Research fundamentals', 'User personas', 'Persona workshop'], assignment: 'Create one or two detailed user personas.' },
  { theme: 'Journey Mapping', sessions: ['User journey maps', 'Friction and opportunity mapping', 'Final project definition'], assignment: 'Define the target audience, core problem, and project goals.' },
  { theme: 'Information Architecture', sessions: ['Content organization', 'Card sorting', 'Sitemaps'], assignment: 'Create a sitemap for the project.' },
  { theme: 'User Flows', sessions: ['Flow fundamentals', 'Task flows', 'User flow workshop'], assignment: 'Map the primary user flow for the project.' },
  { theme: 'Wireframing', sessions: ['Low-fidelity wireframes', 'Layout and hierarchy', 'Wireframe critique'], assignment: 'Produce low-fidelity wireframes for the key screens.' },
  { theme: 'Interaction Design', sessions: ['Interaction patterns', 'Forms and feedback', 'Interaction critique'], assignment: 'Document interaction states for one key task.' },
  { theme: 'Visual Design', sessions: ['Visual hierarchy', 'Color theory', 'Typography for interfaces'], assignment: 'Create a visual direction board.' },
  { theme: 'Design Systems', sessions: ['Design system foundations', 'Tokens and components', 'Component audit'], assignment: 'Start a reusable component library in Figma.' },
  { theme: 'Figma Foundations', sessions: ['Figma workspace and files', 'Frames, grids, and constraints', 'Auto layout'], assignment: 'Rebuild a reference interface using Figma.' },
  { theme: 'Figma Prototyping', sessions: ['Prototype connections', 'Variables and components', 'Prototype walkthrough'], assignment: 'Create a clickable prototype for the core flow.' },
  { theme: 'Responsive Design', sessions: ['Responsive principles', 'Breakpoints and grids', 'Mobile-first workshop'], assignment: 'Adapt the project for mobile and desktop.' },
  { theme: 'Accessibility', sessions: ['Inclusive design', 'Contrast and readable type', 'Accessible interaction patterns'], assignment: 'Run an accessibility review and document improvements.' },
  { theme: 'Usability Testing', sessions: ['Testing fundamentals', 'Test plans and scripts', 'Moderating sessions'], assignment: 'Write a usability test plan with five tasks.' },
  { theme: 'Research Synthesis', sessions: ['Analyzing observations', 'Affinity mapping', 'Prioritizing findings'], assignment: 'Synthesize test findings into prioritized insights.' },
  { theme: 'Iteration', sessions: ['Turning feedback into changes', 'Design critique', 'Iteration workshop'], assignment: 'Revise the prototype based on test findings.' },
  { theme: 'Portfolio Case Studies', sessions: ['Case study structure', 'Storytelling with process', 'Portfolio critique'], assignment: 'Draft the project case study narrative.' },
  { theme: 'Product Thinking', sessions: ['Product goals and metrics', 'Trade-offs and prioritization', 'Designing for outcomes'], assignment: 'Connect design decisions to measurable outcomes.' },
  { theme: 'Advanced Prototyping', sessions: ['Prototype fidelity', 'Micro-interactions', 'Motion and transitions'], assignment: 'Add meaningful micro-interactions to the prototype.' },
  { theme: 'Final Project Studio', sessions: ['Project studio review', 'Design refinement', 'Presentation rehearsal'], assignment: 'Complete the final project prototype and presentation.' },
  { theme: 'Final Project Testing', sessions: ['Final usability test', 'Last-mile improvements', 'Project validation'], assignment: 'Document final test results and design changes.' },
  { theme: 'Presentation and Portfolio', sessions: ['Portfolio polish', 'Presenting design decisions', 'Peer review'], assignment: 'Publish the final case study draft.' },
  { theme: 'Course Showcase', sessions: ['Final project showcase', 'Reflection and next steps', 'Portfolio presentation'], assignment: 'Submit the completed UI/UX Design portfolio project.' },
];

const classDays = ['Monday', 'Wednesday', 'Friday'];

export const uiUxSchedule: CourseSession[] = weekPlans.flatMap((week, weekIndex) =>
  week.sessions.map((title, sessionIndex) => ({
    id: `uiux-week-${weekIndex + 1}-session-${sessionIndex + 1}`,
    weekNumber: weekIndex + 1,
    monthNumber: Math.ceil((weekIndex + 1) / 4),
    day: classDays[sessionIndex],
    startTime: '18:00',
    endTime: '20:00',
    title,
    topic: week.theme,
    objectives: [`Understand ${title.toLowerCase()}`, `Apply ${week.theme.toLowerCase()} principles in Figma`],
    status: 'upcoming',
    attendanceRequired: true,
  })),
);

export const uiUxWeeks = weekPlans.map((week, index) => ({
  weekNumber: index + 1,
  monthNumber: Math.ceil((index + 1) / 4),
  theme: week.theme,
  assignment: week.assignment,
  sessions: uiUxSchedule.filter((session) => session.weekNumber === index + 1),
}));
