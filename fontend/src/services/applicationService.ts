import tsrequest from './tsrequest';

export interface Application {
  id: number;
  schoolId: number;
  majorId: number;
  subjectGroupId: number;
  scores: Record<string, number>;
  priority: string;
  status: 'DRAFT' | 'SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  documents: { url: string; name: string }[];
  school?: { name: string };
  major?: { name: string };
  subjectGroup?: { name: string };
}

export const getMyApplications = () => tsrequest.get('/applications/my');

export const getApplicationById = (id: number) => tsrequest.get(`/applications/${id}`);

export const createApplication = (data: unknown) => tsrequest.post('/applications', data);

export const updateApplication = (id: number, data: unknown) => tsrequest.put(`/applications/${id}`, data);

export const deleteApplication = (id: number) => tsrequest.delete(`/applications/${id}`);

// Upload file
export const uploadFile = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return tsrequest.post('/file/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getAllApplications = (params?: {
  schoolId?: number;
  majorId?: number;
  status?: string;
  page?: number;
  limit?: number;
}) => tsrequest.get('/applications', { params });

export const updateApplicationStatus = (id: number, status: string, reason?: string) =>
  tsrequest.patch(`/applications/${id}/status`, { status, reason });
// Gửi email thủ công cho thí sinh
export const sendCustomEmail = (applicationId: number, data: { subject: string; body: string }) =>
  tsrequest.post(`/applications/${applicationId}/send-email`, data);

// Lấy dữ liệu thống kê
export const getStatistics = () => tsrequest.get('/stats');