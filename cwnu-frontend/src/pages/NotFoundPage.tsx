import { Link, useNavigate } from 'react-router-dom';

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 dark:bg-gray-950">
      <section className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-gray-900">
        <p className="text-6xl font-black text-primary-600">404</p>
        <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">Page not found</h1>
        <p className="mt-3 text-gray-600 dark:text-gray-300">The page may have moved or the address may be incorrect.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button type="button" className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200" onClick={() => navigate(-1)}>Go back</button>
          <Link className="rounded-lg bg-primary-600 px-4 py-2 font-semibold text-white hover:bg-primary-700" to="/">Home</Link>
        </div>
      </section>
    </main>
  );
}
