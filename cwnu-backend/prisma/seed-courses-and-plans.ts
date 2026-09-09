import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type MonthPlan = {
  title: string;
  topics: string[];
  practicalWork: string;
  assignment: string;
  assessment: string;
};

type CourseSeed = {
  code: string;
  name: string;
  description: string;
  credits: number;
  department: { code: string; name: string };
  semester: string;
  year: number;
  maxStudents: number;
  plan: {
    objectives: string[];
    outcomes: string[];
    resources: string[];
    months: MonthPlan[];
  };
};

const catalogue: CourseSeed[] = [
  {
    code: 'CS101',
    name: 'Introduction to Web Development',
    description: 'Learn HTML, CSS, JavaScript, and responsive web development.',
    credits: 3,
    department: { code: 'CS', name: 'Computer Science' },
    semester: 'Fall',
    year: 2026,
    maxStudents: 30,
    plan: {
      objectives: [
        'Understand how websites are structured, styled, and made interactive.',
        'Build responsive web pages with semantic HTML and modern CSS layout patterns.',
        'Use JavaScript to create interactive user experiences and validate forms.',
        'Publish and present a complete website project professionally.'
      ],
      outcomes: [
        'Explain how browsers, HTML, CSS, and JavaScript work together.',
        'Create accessible and responsive web pages from scratch.',
        'Apply front-end logic to interactive user interfaces and browser-based features.',
        'Demonstrate a complete website project in a portfolio-ready format.'
      ],
      resources: ['HTML reference notes', 'CSS layout guides', 'JavaScript exercises', 'Browser developer tools'],
      months: [
        { title: 'Web Fundamentals and HTML', topics: ['Internet and web basics', 'HTML document structure', 'Semantic markup', 'Forms and accessibility', 'Media and linking'], practicalWork: 'Students build a personal profile page and learn to structure content correctly using semantic HTML elements.', assignment: 'Create a one-page personal portfolio using semantic HTML.', assessment: 'HTML practical assignment and a month-end quiz.' },
        { title: 'CSS and Responsive Design', topics: ['CSS selectors and styling', 'Box model and spacing', 'Typography and colors', 'Flexbox and Grid', 'Responsive design and media queries'], practicalWork: 'Students style a landing page and build responsive sections that adapt across different screen sizes.', assignment: 'Design a responsive multi-section business landing page.', assessment: 'Responsive design practical and CSS challenge test.' },
        { title: 'JavaScript Fundamentals', topics: ['Variables and data types', 'Control flow and functions', 'Arrays and objects', 'Loops and conditionals', 'Scope and debugging'], practicalWork: 'Students practice JavaScript logic through small interactive examples and browser calculations.', assignment: 'Build a small interactive calculator or quiz app.', assessment: 'JavaScript coding quiz and practical exercise.' },
        { title: 'DOM, Events, and Forms', topics: ['DOM selection', 'Event listeners', 'Form validation', 'Dynamic content updates', 'Local storage'], practicalWork: 'Students create interactive forms and interface features that respond to user input.', assignment: 'Develop a task manager or student registration form with validation.', assessment: 'Practical coding assignment and debugging exercise.' },
        { title: 'APIs, Git, and Deployment', topics: ['HTTP basics', 'JSON and fetch API', 'Asynchronous behavior', 'Git workflow', 'Website deployment'], practicalWork: 'Students fetch public data and publish a website to a live hosting environment.', assignment: 'Build a website that displays data from a public API and deploy it.', assessment: 'API integration project, Git workflow check, and deployment exercise.' },
        { title: 'Final Website Project', topics: ['Project planning', 'UI refinement', 'Responsive testing', 'Accessibility review', 'Documentation and presentation'], practicalWork: 'Students combine all learned skills to create a complete, polished personal project with interactive features.', assignment: 'Develop and deploy a final responsive website project.', assessment: 'Final project quality review, technical evaluation, and presentation.' }
      ]
    }
  },
  {
    code: 'CS201',
    name: 'Data Structures & Algorithms',
    description: 'Master essential data structures and algorithms for efficient problem solving.',
    credits: 4,
    department: { code: 'CS', name: 'Computer Science' },
    semester: 'Fall',
    year: 2026,
    maxStudents: 25,
    plan: {
      objectives: [
        'Analyze computational problems and design efficient solutions.',
        'Select the right data structure for different problem contexts.',
        'Understand algorithmic complexity and optimize performance.',
        'Solve real programming challenges through structured practice and final project work.'
      ],
      outcomes: [
        'Describe the trade-offs between common data structures and algorithms.',
        'Implement stacks, queues, trees, graphs, and hash-based structures.',
        'Use sorting, searching, recursion, and graph traversal effectively.',
        'Present and justify algorithmic decisions in technical documentation.'
      ],
      resources: ['Algorithm guide notes', 'Coding challenge sets', 'Complexity worksheets', 'Programming lab exercises'],
      months: [
        { title: 'Algorithmic Thinking and Complexity', topics: ['Problem-solving methods', 'Big-O analysis', 'Arrays and strings', 'Two-pointer logic', 'Search techniques'], practicalWork: 'Students solve structured programming problems and compare the efficiency of multiple approaches.', assignment: 'Create solutions for array and string challenges with complexity explanations.', assessment: 'Weekly coding problems and a month-end complexity test.' },
        { title: 'Linear Data Structures', topics: ['Linked lists', 'Stacks and queues', 'Deques', 'Circular structures', 'Applications'], practicalWork: 'Students implement and test stack, queue, and linked-list operations in coding labs.', assignment: 'Build a custom linked-list, stack, and queue library.', assessment: 'Implementation assignment and coding examination.' },
        { title: 'Trees, Hashing, and Recursion', topics: ['Hash tables', 'Trees and binary search trees', 'Tree traversal', 'Heaps and priority queues', 'Recursion'], practicalWork: 'Students construct tree-based structures and solve recursive problems with guided practice.', assignment: 'Implement a binary search tree or heap-based application.', assessment: 'Tree implementation project and technical quiz.' },
        { title: 'Searching, Sorting, and Divide-and-Conquer', topics: ['Linear and binary search', 'Insertion, merge, and quick sort', 'Divide-and-conquer', 'Recursive strategies', 'Optimization techniques'], practicalWork: 'Students evaluate sorting algorithms and compare performance across sample data sets.', assignment: 'Compare algorithmic runtimes and document the best approach for different inputs.', assessment: 'Algorithm assessment and performance comparison report.' },
        { title: 'Graph Algorithms and Optimization', topics: ['Graph representations', 'DFS and BFS', 'Dijkstra’s algorithm', 'Topological sorting', 'Greedy strategies'], practicalWork: 'Students model and solve route, network, and scheduling problems using graph techniques.', assignment: 'Develop a graph-based route or network analysis solution.', assessment: 'Graph programming project and practical examination.' },
        { title: 'Advanced Problem Solving and Final Project', topics: ['Backtracking', 'Dynamic programming', 'Memoization', 'Interview-style challenges', 'Final solution design'], practicalWork: 'Students combine algorithmic strategies to solve a comprehensive computational challenge.', assignment: 'Create a final algorithm-focused application or real-world problem-solving project.', assessment: 'Final project, documentation, and presentation.' }
      ]
    }
  },
  {
    code: 'DS101',
    name: 'Introduction to Data Science',
    description: 'Explore data analysis, visualization, and machine learning fundamentals with Python.',
    credits: 3,
    department: { code: 'DS', name: 'Data Science' },
    semester: 'Fall',
    year: 2026,
    maxStudents: 30,
    plan: {
      objectives: [
        'Understand the end-to-end data science workflow from collection to insight.',
        'Use Python as a practical tool for manipulating and exploring datasets.',
        'Clean, analyze, and visualize data in a meaningful and accurate way.',
        'Present analytical findings clearly and professionally.'
      ],
      outcomes: [
        'Work with structured datasets and basic Python tooling.',
        'Interpret descriptive statistics and visualize trends effectively.',
        'Prepare and clean real-world data for analysis.',
        'Develop a final data-analysis project supported by evidence.'
      ],
      resources: ['Python notebook exercises', 'Dataset practice files', 'Visualization examples', 'Statistics notes'],
      months: [
        { title: 'Python and Data Fundamentals', topics: ['Data science workflow', 'Python basics', 'Variables and data types', 'Loops and functions', 'File handling'], practicalWork: 'Students write short Python scripts to explore small datasets and summarize observations.', assignment: 'Analyze a small dataset with Python and explain its key patterns.', assessment: 'Python exercise set and month-end coding test.' },
        { title: 'Data Cleaning and Pandas', topics: ['NumPy basics', 'Pandas DataFrames', 'Filtering and sorting', 'Missing values', 'Grouping and transformation'], practicalWork: 'Students clean a messy dataset and prepare it for analysis with real-world examples.', assignment: 'Prepare a dataset for analysis and document the cleaning process.', assessment: 'Data-cleaning practical assignment.' },
        { title: 'Exploratory Data Analysis', topics: ['Summary statistics', 'Mean, median, and mode', 'Variance and deviation', 'Correlation', 'Outlier detection'], practicalWork: 'Students analyze data distributions and produce an insight report using a sample dataset.', assignment: 'Complete an EDA report with findings and supporting evidence.', assessment: 'EDA practical and written analysis test.' },
        { title: 'Visualization and Storytelling', topics: ['Chart design', 'Bar and line charts', 'Scatter plots', 'Color and readability', 'Insight communication'], practicalWork: 'Students create visual reports that explain patterns, comparisons, and business insights.', assignment: 'Create a multi-chart visualization report with written analysis.', assessment: 'Visualization project and presentation.' },
        { title: 'SQL and Data Collection', topics: ['SQL basics', 'SELECT and filtering', 'Grouping and aggregation', 'JOIN concepts', 'Working with external datasets'], practicalWork: 'Students combine SQL and Python to analyze structured data from a database or dataset source.', assignment: 'Analyze a small relational dataset and summarize the results.', assessment: 'SQL practical test and analysis assignment.' },
        { title: 'Final Data Science Project', topics: ['Problem definition', 'Dataset selection', 'Cleaning and analysis', 'Visualization', 'Presenting findings'], practicalWork: 'Students complete a final end-to-end data analysis project using a real or realistic dataset.', assignment: 'Select a dataset, analyze it, and present a full professional report.', assessment: 'Final project, report quality, and presentation.' }
      ]
    }
  },
  {
    code: 'DS201',
    name: 'Machine Learning Fundamentals',
    description: 'Build and evaluate supervised and unsupervised machine learning models.',
    credits: 4,
    department: { code: 'DS', name: 'Data Science' },
    semester: 'Spring',
    year: 2027,
    maxStudents: 20,
    plan: {
      objectives: [
        'Understand the machine learning lifecycle and its practical workflow.',
        'Build and evaluate classification and regression models using real datasets.',
        'Apply model optimization strategies to improve performance and interpretability.',
        'Develop an end-to-end machine learning application with evaluation.'
      ],
      outcomes: [
        'Prepare data pipelines for model training and evaluation.',
        'Train and compare regression and classification models.',
        'Apply clustering and feature engineering methods appropriately.',
        'Explain model performance and present final project results clearly.'
      ],
      resources: ['ML workbook', 'Python notebooks', 'Model evaluation notes', 'Feature engineering exercises'],
      months: [
        { title: 'Foundations of Machine Learning', topics: ['What is machine learning?', 'Supervised and unsupervised learning', 'Features and targets', 'Training and validation splits', 'Bias and variance'], practicalWork: 'Students prepare a dataset, perform preprocessing, and understand how model training works in practice.', assignment: 'Prepare a realistic dataset for a model-building workflow.', assessment: 'Theory test and preprocessing practical.' },
        { title: 'Regression and Prediction Models', topics: ['Linear regression', 'Multiple regression', 'Gradient descent', 'Regularization', 'Evaluation metrics'], practicalWork: 'Students develop and compare prediction models for quantitative outcomes.', assignment: 'Create a regression model for a real-world prediction problem.', assessment: 'Model implementation report and analysis review.' },
        { title: 'Classification Models', topics: ['Logistic regression', 'Decision trees', 'Random forests', 'Accuracy and confusion matrix', 'Precision, recall, and F1 score'], practicalWork: 'Students train and compare multiple classification models on the same dataset.', assignment: 'Compare several classification models and explain the outcome.', assessment: 'Practical machine learning examination.' },
        { title: 'Unsupervised Learning and Dimensionality Reduction', topics: ['Clustering', 'K-means', 'PCA', 'Feature selection', 'Cluster evaluation'], practicalWork: 'Students analyze unstructured or unlabeled data and reduce dimensionality for interpretation.', assignment: 'Build a clustering-based analysis project.', assessment: 'Project report and practical evaluation.' },
        { title: 'Model Optimization and Advanced Practice', topics: ['Cross-validation', 'Hyperparameter tuning', 'Grid search', 'Ensemble learning', 'Regularization and evaluation'], practicalWork: 'Students improve existing models using tuning approaches and better feature design.', assignment: 'Optimize and document a predictive model for a real use case.', assessment: 'Optimization report and technical presentation.' },
        { title: 'Applied Machine Learning Project', topics: ['Project planning', 'Dataset evaluation', 'Pipeline design', 'Error analysis', 'Model interpretation'], practicalWork: 'Students build a complete end-to-end machine-learning solution for a realistic problem.', assignment: 'Develop and present a final ML solution based on an actual problem statement.', assessment: 'Final project, presentation, and practical evaluation.' }
      ]
    }
  },
  {
    code: 'GD101',
    name: 'Graphic Design Principles',
    description: 'Learn design theory, typography, color theory, and composition.',
    credits: 3,
    department: { code: 'DES', name: 'Design' },
    semester: 'Fall',
    year: 2026,
    maxStudents: 25,
    plan: {
      objectives: [
        'Understand the fundamentals of visual communication and design composition.',
        'Use typography and color to create clear, effective visual hierarchy.',
        'Create balanced and professional design work across digital and print formats.',
        'Build a portfolio of design exercises and presentation-ready pieces.'
      ],
      outcomes: [
        'Explain the core principles of design and visual hierarchy.',
        'Apply typography, contrast, and color theory to visual compositions.',
        'Present polished design work for academic and entry-level creative contexts.',
        'Create a brand and campaign-focused design project with consistency.'
      ],
      resources: ['Design theory notes', 'Color palette guides', 'Typography references', 'Layout inspiration boards'],
      months: [
        { title: 'Foundations of Graphic Design', topics: ['Elements of design', 'Balance and alignment', 'Contrast and repetition', 'Hierarchy', 'Composition principles'], practicalWork: 'Students analyze existing layouts and recreate compositions to understand effective visual balance.', assignment: 'Recreate a set of design layouts and explain the principles used.', assessment: 'Design exercise and visual analysis test.' },
        { title: 'Color and Typography', topics: ['Color theory', 'Contrast and harmony', 'Typography basics', 'Font pairing', 'Readability'], practicalWork: 'Students build type-driven compositions and experiment with palette structure.', assignment: 'Create a poster using a defined color palette and a clear typographic hierarchy.', assessment: 'Poster design assignment and design critique.' },
        { title: 'Layout and Digital Composition', topics: ['Grid systems', 'Spacing and alignment', 'Poster and social layouts', 'Image placement', 'Print versus digital design'], practicalWork: 'Students create a coordinated set of graphics for a digital campaign or event.', assignment: 'Design a campaign set of promotional graphics.', assessment: 'Multi-format design assignment and practical review.' },
        { title: 'Branding and Identity', topics: ['Brand identity', 'Logo concepts', 'Brand consistency', 'Typography in branding', 'Color systems'], practicalWork: 'Students develop a simple visual identity for a fictional brand or product.', assignment: 'Create a brand kit with logo, palette, and sample materials.', assessment: 'Brand identity presentation and review.' },
        { title: 'Practical Design Projects', topics: ['Poster design', 'Presentation slides', 'Infographics', 'Social content', 'Export workflow'], practicalWork: 'Students produce multiple design outputs with a consistent visual language and presentation quality.', assignment: 'Develop a mini design campaign with several linked assets.', assessment: 'Project review and practical evaluation.' },
        { title: 'Portfolio Development', topics: ['Selecting strong work', 'Refining designs', 'Portfolio structure', 'Presenting concepts', 'Professional review'], practicalWork: 'Students refine their strongest pieces and organize them into a portfolio-ready collection.', assignment: 'Produce a final portfolio of completed designs with written rationale.', assessment: 'Portfolio evaluation and final presentation.' }
      ]
    }
  },
  {
    code: 'GD201',
    name: 'UI/UX Design',
    description: 'Study user research, wireframing, prototyping, and usability testing.',
    credits: 3,
    department: { code: 'DES', name: 'Design' },
    semester: 'Spring',
    year: 2027,
    maxStudents: 20,
    plan: {
      objectives: [
        'Understand how user needs shape digital product design decisions.',
        'Research users and transform insights into product requirements.',
        'Design interfaces using wireframes, flows, and interactive prototypes.',
        'Validate design choices through usability testing and iteration.'
      ],
      outcomes: [
        'Create user personas and journey maps from documented research.',
        'Map information architecture and design task flows effectively.',
        'Translate concepts into high-fidelity interfaces and interactive prototypes.',
        'Present final product design decisions using a structured case-study approach.'
      ],
      resources: ['UX research templates', 'Wireframing templates', 'Prototype guides', 'Usability testing checklists'],
      months: [
        { title: 'Introduction to UX and User Research', topics: ['UI vs. UX', 'Human-centered design', 'Design thinking', 'User interviews', 'Personas and journeys'], practicalWork: 'Students conduct small research exercises and create user personas representing real problems and behaviors.', assignment: 'Run a mini user-research activity and present a user persona profile.', assessment: 'Research report and presentation.' },
        { title: 'Information Architecture and User Flows', topics: ['Information architecture', 'Content organization', 'Navigation systems', 'User flows', 'Task analysis'], practicalWork: 'Students map digital experiences and organize content into intuitive navigation patterns.', assignment: 'Design the information architecture and user-flow map for a digital product.', assessment: 'User-flow practical and design critique.' },
        { title: 'Wireframing and Interaction Design', topics: ['Low-fidelity wireframes', 'High-fidelity wireframes', 'Layout planning', 'Forms and navigation', 'Empty and error states'], practicalWork: 'Students create structured wireframes for mobile or web experiences and refine interaction patterns.', assignment: 'Develop a complete wireframe system for a digital product.', assessment: 'Wireframe project and practical evaluation.' },
        { title: 'Visual UI Design', topics: ['Visual hierarchy', 'Typography systems', 'Color usage', 'Spacing and grids', 'Responsive interface design'], practicalWork: 'Students turn approved wireframes into polished, consistent interfaces with accessible visual cues.', assignment: 'Convert wireframes into a high-fidelity UI design for a complete product page or screen flow.', assessment: 'UI design project and design critique.' },
        { title: 'Prototyping and Usability Testing', topics: ['Interactive prototypes', 'Micro-interactions', 'Prototype testing', 'User observation', 'Iteration'], practicalWork: 'Students build clickable prototypes and observe how users navigate them to identify friction points.', assignment: 'Create an interactive prototype and conduct a usability test.', assessment: 'Prototype demonstration and usability report.' },
        { title: 'Complete Product Design Project', topics: ['Research synthesis', 'Feature definition', 'Design systems', 'Prototype refinement', 'Final presentation'], practicalWork: 'Students complete a full product design case study from user research to interactive prototype and final presentation.', assignment: 'Develop a complete product design project with research, interface design, prototype, and evaluation.', assessment: 'Final project presentation and case-study review.' }
      ]
    }
  }
];

function buildEntries(course: CourseSeed) {
  return course.plan.months.flatMap((month, monthIndex) =>
    month.topics.map((topic, weekIndex) => ({
      month: monthIndex + 1,
      week: weekIndex + 1,
      topic,
      lesson: `Week ${weekIndex + 1}: guided instruction on ${topic.toLowerCase()} and classroom examples.`,
      activity: weekIndex === month.topics.length - 1 ? 'Monthly review, feedback session, and guided practice.' : 'In-class practice, discussion, and collaborative exercises.',
      assignment: weekIndex === Math.min(2, month.topics.length - 1) ? month.assignment : 'Weekly class exercise and problem-solving task.',
      project: monthIndex === 5 && weekIndex === month.topics.length - 1 ? 'Final course project and presentation milestone.' : null,
      assessment: weekIndex === month.topics.length - 1 ? month.assessment : 'Class participation, short exercise, and progress check.',
      milestone: weekIndex === month.topics.length - 1 ? `Review and complete the ${month.title.toLowerCase()} learning outcome.` : `Complete the week ${weekIndex + 1} learning objective for ${topic.toLowerCase()}.`,
      resource: 'Instructor notes, workshop materials, and course reading pack.',
      completionDate: null,
    }))
  );
}

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) throw new Error('Create an Admin account before seeding courses and teaching plans.');
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 6);

  for (const item of catalogue) {
    const department = await prisma.department.upsert({
      where: { code: item.department.code },
      update: { name: item.department.name, isActive: true },
      create: { code: item.department.code, name: item.department.name, isActive: true },
    });

    const course = await prisma.course.upsert({
      where: { code: item.code },
      update: {
        name: item.name,
        description: item.description,
        credits: item.credits,
        departmentId: department.id,
        semester: item.semester,
        year: item.year,
        maxStudents: item.maxStudents,
        isActive: true,
      },
      create: {
        code: item.code,
        name: item.name,
        description: item.description,
        credits: item.credits,
        departmentId: department.id,
        semester: item.semester,
        year: item.year,
        maxStudents: item.maxStudents,
        prerequisites: [],
        isActive: true,
      },
    });

    const entries = buildEntries(item);
    const planData = {
      objectives: item.plan.objectives,
      outcomes: item.plan.outcomes,
      resources: item.plan.resources,
      startDate,
      endDate,
      completionDate: endDate,
      updatedById: admin.id,
    };

    const existingPlan = await prisma.teachingPlan.findUnique({ where: { courseId: course.id }, select: { id: true } });
    if (existingPlan) {
      await prisma.$transaction(async (tx) => {
        await tx.teachingPlan.update({ where: { id: existingPlan.id }, data: planData });
        await tx.teachingPlanEntry.deleteMany({ where: { planId: existingPlan.id } });
        await tx.teachingPlanEntry.createMany({
          data: entries.map((entry) => ({ ...entry, planId: existingPlan.id })),
        });
      });
    } else {
      await prisma.teachingPlan.create({
        data: {
          courseId: course.id,
          ...planData,
          createdById: admin.id,
          entries: { create: entries },
        },
      });
    }
  }

  console.log(`Seeded ${catalogue.length} courses and detailed teaching plans.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
