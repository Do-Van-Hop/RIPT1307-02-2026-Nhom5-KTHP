import tsrequest from './tsrequest';

export const getSchools = () => tsrequest.get('/schools');

export const getSchoolById = (id: number) => tsrequest.get(`/schools/${id}`);

export const createSchool = (data: { name: string; code?: string }) =>
  tsrequest.post('/schools', data);

export const updateSchool = (id: number, data: { name?: string; code?: string }) =>
  tsrequest.put(`/schools/${id}`, data);

export const deleteSchool = (id: number) => tsrequest.delete(`/schools/${id}`);

export const getMajorsBySchool = (schoolId: number) =>
  tsrequest.get(`/majors?schoolId=${schoolId}`);

export const createMajor = (data: { name: string; code?: string; schoolId: number; subjectGroupIds?: number[] }) =>
  tsrequest.post('/majors', data);

export const updateMajor = (id: number, data: { name?: string; code?: string; subjectGroupIds?: number[] }) =>
  tsrequest.put(`/majors/${id}`, data);

export const deleteMajor = (id: number) => tsrequest.delete(`/majors/${id}`);

export const getSubjectGroups = () => tsrequest.get('/subject-groups');

export const createSubjectGroup = (data: { name: string; subjects: string[] }) =>
  tsrequest.post('/subject-groups', data);

export const updateSubjectGroup = (id: number, data: { name?: string; subjects?: string[] }) =>
  tsrequest.put(`/subject-groups/${id}`, data);
export const getSubjectGroupById = (id: number) => tsrequest.get(`/subject-groups/${id}`);

export const deleteSubjectGroup = (id: number) => tsrequest.delete(`/subject-groups/${id}`);