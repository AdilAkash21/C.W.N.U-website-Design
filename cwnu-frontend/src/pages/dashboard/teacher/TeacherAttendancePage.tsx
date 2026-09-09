import { Navigate, useSearchParams } from 'react-router-dom';

export function TeacherAttendancePage() {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId');

  if (!courseId) {
    return <Navigate to="/dashboard/teacher" replace />;
  }

  return <Navigate to={`/dashboard/courses/${courseId}#attendance`} replace />;
}
