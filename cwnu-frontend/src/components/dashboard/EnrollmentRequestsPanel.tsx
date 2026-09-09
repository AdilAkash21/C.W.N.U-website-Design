import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { api } from '../../services/api';

type EnrollmentRequestsPanelProps = {
  requests: any[];
  queryKey: string;
};

export function EnrollmentRequestsPanel({ requests, queryKey }: EnrollmentRequestsPanelProps) {
  const queryClient = useQueryClient();
  const reviewMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) => api.updateEnrollment(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['staff-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['student-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800 sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-400">Action queue</p>
          <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">Enrollment requests</h2>
        </div>
        <Badge variant={requests.length ? 'warning' : 'success'}>{requests.length} pending</Badge>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {requests.length ? requests.map((request) => (
          <div key={request.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{request.student?.firstName} {request.student?.lastName}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{request.course?.code} · {request.course?.name}</p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{request.student?.email}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" disabled={reviewMutation.isPending} isLoading={reviewMutation.isPending} onClick={() => reviewMutation.mutate({ id: request.id, status: 'APPROVED' })}>Accept</Button>
              <Button size="sm" variant="secondary" disabled={reviewMutation.isPending} onClick={() => reviewMutation.mutate({ id: request.id, status: 'REJECTED' })}>Reject</Button>
            </div>
          </div>
        )) : <p className="p-6 text-sm text-gray-500 dark:text-gray-400">No enrollment requests waiting for review.</p>}
      </div>
    </Card>
  );
}
