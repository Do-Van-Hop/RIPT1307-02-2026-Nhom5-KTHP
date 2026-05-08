import React, { useState } from 'react';
import { Select, Space, Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import * as catalogService from '../services/catalogService';

interface Props {
  onSelect: (schoolId: number, majorId: number, subjectGroupId: number) => void;
}

const CandidateCascader: React.FC<Props> = ({ onSelect }) => {
  const [selectedSchool, setSelectedSchool] = useState<number | null>(null);
  const [selectedMajor, setSelectedMajor] = useState<number | null>(null);

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

  const { data: majorDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['majorDetail', selectedMajor],
    queryFn: async () => {
      if (!selectedMajor) return null;
      const res = await tsrequest.get(`/majors/${selectedMajor}`); // cần tạo thêm service nếu chưa có
      return res.data;
    },
    enabled: !!selectedMajor,
  });

  const subjectGroups = majorDetail?.subjectGroups || [];

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

  return (
    <Space wrap>
      <Select
        placeholder="Chọn trường"
        style={{ width: 200 }}
        options={schools?.map((s: any) => ({ value: s.id, label: s.name }))}
        onChange={handleSchoolChange}
        value={selectedSchool}
        loading={loadingSchools}
      />
      <Select
        placeholder="Chọn ngành"
        style={{ width: 200 }}
        options={majors?.map((m: any) => ({ value: m.id, label: m.name }))}
        onChange={handleMajorChange}
        value={selectedMajor}
        disabled={!selectedSchool}
        loading={loadingMajors}
      />
      <Select
        placeholder="Chọn tổ hợp"
        style={{ width: 200 }}
        options={subjectGroups?.map((sg: any) => ({ value: sg.id, label: sg.name }))}
        onChange={handleSubjectGroupChange}
        disabled={!selectedMajor}
        loading={loadingDetail}
      />
    </Space>
  );
};

export default CandidateCascader;