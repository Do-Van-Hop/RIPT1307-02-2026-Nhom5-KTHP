import tsrequest from './tsrequest';

export const getSchools = () => tsrequest.get('/schools/');

export const getSchoolById = (id: number) => tsrequest.get(`/schools/${id}`);

export const createSchool = (data: { name: string }) => tsrequest.post('/schools/', data);

export const updateSchool = (id: number, data: { name: string }) =>
  tsrequest.put(`/schools/${id}`, data);

export const deleteSchool = (id: number) => tsrequest.delete(`/schools/${id}`);

export const getMajorsBySchool = (schoolId: number) =>
  tsrequest.get(`/majors/by-school/${schoolId}`);

export const getMajorById = (id: number) => tsrequest.get(`/majors/${id}`);

export const createMajor = (data: { name: string; school_id: number }) =>
  tsrequest.post('/majors/', data);

export const updateMajor = (id: number, data: { name: string; school_id: number }) =>
  tsrequest.put(`/majors/${id}`, data);

export const deleteMajor = (id: number) => tsrequest.delete(`/majors/${id}`);

export const assignSubjectGroupToMajor = (majorId: number, groupId: number) =>
  tsrequest.post(`/majors/${majorId}/assign-group/${groupId}`);

export const getSubjectGroupsByMajor = (majorId: number) =>
  tsrequest.get(`/majors/${majorId}/subject-groups`);
export const removeSubjectGroupFromMajor = (majorId: number, groupId: number) =>
  tsrequest.delete(`/majors/${majorId}/remove-group/${groupId}`);
export const getSubjectGroups = () => tsrequest.get('/subject-groups/');

export const getSubjectGroupById = (id: number) => tsrequest.get(`/subject-groups/${id}`);

export const createSubjectGroup = (data: { name: string; subjects: string[] }) =>
  tsrequest.post('/subject-groups/', data);

export const updateSubjectGroup = (id: number, data: { name: string; subjects: string[] }) =>
  tsrequest.put(`/subject-groups/${id}`, data);

export const deleteSubjectGroup = (id: number) => tsrequest.delete(`/subject-groups/${id}`);