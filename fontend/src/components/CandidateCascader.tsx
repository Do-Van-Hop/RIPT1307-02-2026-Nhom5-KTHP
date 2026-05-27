import React, { useState, useEffect } from 'react';
import { Select, Space } from 'antd';
import { useQuery } from '@tanstack/react-query';
import * as catalogService from '../services/catalogService';

interface Props {
  onSelect: (schoolId: number, majorId: number, subjectGroupId: number) => void;
  initialSchoolId?: number;
  initialMajorId?: number;
  initialSubjectGroupId?: number;
}

const CandidateCascader: React.FC<Props> = ({
  onSelect,
  initialSchoolId,
  initialMajorId,
  initialSubjectGroupId,
}) => {
  const [selectedSchool, setSelectedSchool] = useState<number | null>(initialSchoolId || null);
  const [selectedMajor, setSelectedMajor] = useState<number | null>(initialMajorId || null);

  useEffect(() => {
    if (initialSchoolId) setSelectedSchool(initialSchoolId);
    if (initialMajorId) setSelectedMajor(initialMajorId);
  }, [initialSchoolId, initialMajorId]);

  const { data: schools, isLoading: loadingSchools } = useQuery({
    queryKey: ['schools'],
    queryFn: async () => {
      const res = await catalogService.getSchools();
      return res.data;
    },
  });

  const { data: majors, isLoading: loadingMajors } = useQuery({
    queryKey: ['majors', selectedSchool],
    queryFn: async () => {
      if (!selectedSchool) return [];
      const res = await catalogService.getMajorsBySchool(selectedSchool);
      return res.data;
    },
    enabled: !!selectedSchool,
  });

  const { data: subjectGroups, isLoading: loadingSubjectGroups } = useQuery({
    queryKey: ['subjectGroupsByMajor', selectedMajor],
    queryFn: async () => {
      if (!selectedMajor) return [];
      const res = await catalogService.getSubjectGroupsByMajor(selectedMajor);
      return res.data;
    },
    enabled: !!selectedMajor,
  });

  const handleSchoolChange = (value: number) => {
    setSelectedSchool(value);
    setSelectedMajor(null);
  };

  const handleMajorChange = (value: number) => {
    setSelectedMajor(value);
  };

  const handleSubjectGroupChange = (value: number) => {
    if (selectedSchool && selectedMajor && value) {
      onSelect(selectedSchool, selectedMajor, value);
    }
  };

  const subjectGroupValue = initialSubjectGroupId && subjectGroups?.some((sg: any) => sg.id === initialSubjectGroupId)
    ? initialSubjectGroupId
    : undefined;

  return (
    <Space wrap>
      <Select
        placeholder="Chọn trường"
        style={{ width: 220 }}
        options={schools?.map((s: any) => ({ value: s.id, label: s.name }))}
        onChange={handleSchoolChange}
        value={selectedSchool}
        loading={loadingSchools}
        allowClear
      />
      <Select
        placeholder="Chọn ngành"
        style={{ width: 220 }}
        options={majors?.map((m: any) => ({ value: m.id, label: m.name }))}
        onChange={handleMajorChange}
        value={selectedMajor}
        disabled={!selectedSchool}
        loading={loadingMajors}
        allowClear
      />
      <Select
        placeholder="Chọn tổ hợp"
        style={{ width: 220 }}
        options={subjectGroups?.map((sg: any) => ({ value: sg.id, label: sg.name }))}
        onChange={handleSubjectGroupChange}
        disabled={!selectedMajor}
        loading={loadingSubjectGroups}
        allowClear
        value={subjectGroupValue}
      />
    </Space>
  );
};

export default CandidateCascader;