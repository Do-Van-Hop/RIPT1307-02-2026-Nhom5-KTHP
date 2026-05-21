import tsrequest from './tsrequest';

export interface Application {
  id: number;
  user_id: number;
  school_id: number;
  major_id: number;
  subject_group_id: number;
  full_name: string;
  dob: string;
  phone: string;
  cccd_number: string;
  score: number;
  scores: Record<string, number>;
  priority: number;
  status: 'DRAFT' | 'SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  submitted_at: string | null;
  reject_reason: string | null;
  files: {
    id: number;
    file_url: string;
    file_type: string;
    file_size: number | null;
  }[];
}

export const getMyApplications = () => tsrequest.get('/applications/my');

export const getApplicationById = (id: number) => tsrequest.get(`/applications/${id}`);

export const createApplication = (data: unknown) => tsrequest.post('/applications/', data);

export const updateApplication = (id: number, data: unknown) =>
  tsrequest.put(`/applications/${id}`, data);
export const sendApplicationEmail = (id: number, subject: string, body: string) =>
  tsrequest.post(`/applications/${id}/send-email`, { subject, body });

export const deleteApplication = (id: number) => tsrequest.delete(`/applications/${id}`);

export const submitApplication = (id: number) => tsrequest.put(`/applications/${id}/submit`);

export const uploadFile = (file: File, fileType: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('file_type', fileType);
  return tsrequest.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getAllApplications = (params?: {
  school_id?: number;      // đã sửa
  major_id?: number;       // đã sửa
  status?: string;
  page?: number;
  limit?: number;
}) => tsrequest.get('/applications/', { params });

export const updateApplicationStatus = (id: number, status: string, reason?: string) =>
  tsrequest.patch(`/applications/admin/${id}/status`, { status, reason });

export const getStatistics = () => tsrequest.get('/stats/');