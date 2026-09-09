import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { courses } from '../public/CoursesPage';

type Application = {
  programme: string;
  previousSchool: string;
  statement: string;
  status: 'draft' | 'submitted';
};

export function AdmissionsApplicationPage() {
  const { user } = useAuth();
  const storageKey = `admissions-application-${user?.id || 'unknown'}`;
  const saved = localStorage.getItem(storageKey);
  const initial: Application = saved
    ? JSON.parse(saved)
    : { programme: '', previousSchool: '', statement: '', status: 'draft' };
  const [application, setApplication] = useState<Application>(initial);
  const [message, setMessage] = useState('');
  const selectedCourse = courses.find((course) => course.name === application.programme);

  const update = (field: keyof Omit<Application, 'status'>, value: string) => {
    setApplication((current) => ({ ...current, [field]: value }));
    setMessage('');
  };

  const saveDraft = () => {
    const draft = { ...application, status: 'draft' as const };
    localStorage.setItem(storageKey, JSON.stringify(draft));
    setApplication(draft);
    setMessage('Your application draft has been saved on this device.');
  };

  const submitApplication = (event: React.FormEvent) => {
    event.preventDefault();
    if (!application.programme || !application.previousSchool || !application.statement) {
      setMessage('Complete all application fields before submitting.');
      return;
    }
    const submitted = { ...application, status: 'submitted' as const };
    localStorage.setItem(storageKey, JSON.stringify(submitted));
    setApplication(submitted);
    setMessage('Application submitted successfully.');
  };

  if (application.status === 'submitted') {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Card className="p-8 text-center sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-400">Admissions</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Application submitted</h1>
          <p className="mx-auto mt-3 max-w-lg text-gray-600 dark:text-gray-400">Your application is being reviewed. You can return here later to check its status.</p>
          <Link to="/" className="mt-7 inline-block"><Button>Return home</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        to="/"
        className="group inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:text-primary-600 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-primary-500 dark:hover:text-primary-400"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 transition-colors group-hover:bg-primary-100 dark:bg-gray-800 dark:group-hover:bg-primary-900/30">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </span>
        Back home
      </Link>
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-academic-navy via-academic-navy-light to-academic-dark p-6 text-white shadow-elevated sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-300">CWNU Admissions</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Start your application</h1>
            <p className="mt-2 max-w-xl text-sm text-gray-300 sm:text-base">Tell us about your academic goals. Your progress is saved locally so you can return whenever you are ready.</p>
          </div>
          <div className="shrink-0 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-xs uppercase tracking-wide text-gray-300">Application status</p>
            <p className="mt-1 font-semibold">Draft in progress</p>
          </div>
        </div>
        <div className="mt-7">
          <div className="mb-2 flex justify-between text-xs text-gray-300"><span>Step 1 of 1</span><span>Basic information</span></div>
          <div className="h-2 rounded-full bg-white/15"><div className="h-full w-1/3 rounded-full bg-primary-400" /></div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)]">
        <aside className="space-y-4">
          <Card className="border-0 bg-gray-900 p-6 text-white dark:bg-gray-800">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600 text-white">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 19.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13" /></svg>
            </div>
            <h2 className="mt-5 text-lg font-bold text-white">Before you begin</h2>
            <ul className="mt-4 space-y-3 text-sm text-gray-300">
              <li className="flex gap-2"><span className="text-primary-600">✓</span> Choose the programme you want to study.</li>
              <li className="flex gap-2"><span className="text-primary-600">✓</span> Provide your previous institution.</li>
              <li className="flex gap-2"><span className="text-primary-600">✓</span> Explain your motivation clearly.</li>
            </ul>
          </Card>
          <Card className="p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Applicant</p>
            <p className="mt-2 font-semibold text-gray-900 dark:text-white">{user?.firstName} {user?.lastName}</p>
            <p className="mt-1 break-all text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
          </Card>
        </aside>

        <Card className="p-6 sm:p-8">
          <div className="mb-7 border-b border-gray-100 pb-5 dark:border-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Application details</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">All fields are required to submit your application.</p>
          </div>
          <form onSubmit={submitApplication} className="space-y-5">
            <Select
              label="Programme of interest"
              value={application.programme}
              onChange={(event) => update('programme', event.target.value)}
              options={courses.map((course) => ({
                value: course.name,
                label: `${course.code} — ${course.name}`,
              }))}
              placeholder="Select a course you would like to study"
            />
            {selectedCourse && (
              <div className="mt-3 rounded-xl border border-primary-100 bg-primary-50 p-3 dark:border-primary-900/40 dark:bg-primary-900/20">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-primary-800 dark:text-primary-200">{selectedCourse.code} · {selectedCourse.department}</p>
                  <span className="text-xs font-medium text-primary-700 dark:text-primary-300">{selectedCourse.credits} credits · {selectedCourse.level}</span>
                </div>
                <p className="mt-1 text-xs text-primary-700/80 dark:text-primary-300/80">{selectedCourse.description}</p>
              </div>
            )}
            <Input label="Previous school or institution" placeholder="Enter your previous institution" value={application.previousSchool} onChange={(event) => update('previousSchool', event.target.value)} />
            <Textarea label="Why do you want to study at CWNU?" rows={6} placeholder="Tell us about your goals and interests..." value={application.statement} onChange={(event) => update('statement', event.target.value)} />
            {message && <p className="rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300" role="status">{message}</p>}
            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end dark:border-gray-800">
              <Button type="button" variant="outline" onClick={saveDraft}>Save draft</Button>
              <Button type="submit">Submit application</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
