import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { api } from '../../services/api';

export function TeacherCourseRequestsPanel({ requests, queryKey }: { requests: any[]; queryKey: string }) {
  const queryClient = useQueryClient();
  const reviewMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACCEPTED' | 'REJECTED' }) => api.reviewCourseRequest(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: ['course-requests'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800 sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-400">Faculty queue</p>
          <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">Teacher course requests</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Review teachers requesting assignment to a course.</p>
        </div>
        <Badge variant={requests.length ? 'warning' : 'success'}>{requests.length} pending</Badge>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {requests.length ? requests.map((request) => (
          <div key={request.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{request.teacher?.firstName} {request.teacher?.lastName}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Requests <span className="font-medium text-gray-700 dark:text-gray-300">{request.course?.code} · {request.course?.name}</span></p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{request.teacher?.email}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" disabled={reviewMutation.isPending} isLoading={reviewMutation.isPending} onClick={() => reviewMutation.mutate({ id: request.id, status: 'ACCEPTED' })}>Accept</Button>
              <Button size="sm" variant="secondary" disabled={reviewMutation.isPending} onClick={() => reviewMutation.mutate({ id: request.id, status: 'REJECTED' })}>Reject</Button>
            </div>
          </div>
        )) : <p className="p-6 text-sm text-gray-500 dark:text-gray-400">No teacher course requests waiting for review.</p>}
      </div>
    </Card>
  );
}
