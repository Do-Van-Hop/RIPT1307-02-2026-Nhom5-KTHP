import { useQuery } from '@tanstack/react-query';
import * as catalogService from '../services/catalogService';

interface Major {
  id: number;
  name: string;
  school_id: number;
}

export const useAllMajors = () => {
  return useQuery({
    queryKey: ['allMajors'],
    queryFn: async () => {
      const schoolsRes = await catalogService.getSchools();
      const schools = schoolsRes.data as { id: number; name: string }[];

      const majorsPromises = schools.map(school =>
        catalogService.getMajorsBySchool(school.id).then(res => res.data as Major[])
      );
      const majorsArrays = await Promise.all(majorsPromises);
      const allMajors = majorsArrays.flat();
      const majorMap = new Map<number, string>();
      allMajors.forEach(m => majorMap.set(m.id, m.name));
      return { list: allMajors, map: majorMap };
    },
    staleTime: 5 * 60 * 1000, 
  });
};