import React, { useState, useEffect } from 'react';
import {
  Table, Button, Space, Modal, Form, Input, Select, Popconfirm, message,
  Tag, Card, Row, Col, Badge, Tooltip, Empty
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, BankOutlined,
  BookOutlined, AppstoreOutlined, InfoCircleOutlined, RightOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as catalogService from '../../services/catalogService';
import { useAllMajors } from '../../hooks/useAllMajors';
import type { TablePaginationPosition } from 'antd/lib/table/interface';


interface School {
  id: number;
  name: string;
}

interface Major {
  id: number;
  name: string;
  school_id: number;
}

interface SubjectGroup {
  id: number;
  name: string;
  subjects: string[];
}

// ── Màu nhãn tổ hợp môn ──
const subjectTagColor: Record<string, string> = {
  'Toán': 'blue', 'Lý': 'geekblue', 'Hóa': 'purple', 'Sinh': 'green',
  'Văn': 'volcano', 'Sử': 'orange', 'Địa': 'cyan', 'Anh': 'gold',
  'GDCD': 'lime', 'Tin': 'magenta',
};
const getSubjectColor = (s: string) =>
  subjectTagColor[s] || 'default';

const UnifiedManagement: React.FC = () => {
  const queryClient = useQueryClient();

  // ---------- State ----------
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [schoolForm] = Form.useForm();

  const [isMajorModalOpen, setIsMajorModalOpen] = useState(false);
  const [editingMajor, setEditingMajor] = useState<Major | null>(null);
  const [majorForm] = Form.useForm();
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);

  const [isSubjectGroupModalOpen, setIsSubjectGroupModalOpen] = useState(false);
  const [editingSubjectGroup, setEditingSubjectGroup] = useState<SubjectGroup | null>(null);
  const [subjectGroupForm] = Form.useForm();

  // ---------- Queries ----------
  const { data: schools, isLoading: loadingSchools } = useQuery({
    queryKey: ['schools'],
    queryFn: async () => (await catalogService.getSchools()).data as School[],
  });

  const { data: allMajorsData, refetch: refetchAllMajors } = useAllMajors();
  const allMajors = allMajorsData?.list || [];
  const majorCountBySchool = allMajors.reduce((acc, major) => {
    acc[major.school_id] = (acc[major.school_id] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const { data: majors, isLoading: loadingMajors, refetch: refetchMajors } = useQuery({
    queryKey: ['majors', selectedSchoolId],
    queryFn: async () => {
      if (!selectedSchoolId) return [];
      const res = await catalogService.getMajorsBySchool(selectedSchoolId);
      return res.data as Major[];
    },
    enabled: !!selectedSchoolId,
  });

  const { data: subjectGroups, isLoading: loadingSubjectGroups } = useQuery({
    queryKey: ['subjectGroups'],
    queryFn: async () => (await catalogService.getSubjectGroups()).data as SubjectGroup[],
  });

  const { data: currentGroups, refetch: refetchCurrentGroups } = useQuery({
    queryKey: ['majorSubjectGroups', editingMajor?.id],
    queryFn: async () => {
      if (!editingMajor) return [];
      const res = await catalogService.getSubjectGroupsByMajor(editingMajor.id);
      return res.data as SubjectGroup[];
    },
    enabled: !!editingMajor,
  });

  useEffect(() => {
    if (currentGroups) {
      setSelectedGroupIds(currentGroups.map(g => g.id));
    } else if (!editingMajor) {
      setSelectedGroupIds([]);
    }
  }, [currentGroups, editingMajor]);

  const selectedSchoolName = schools?.find(s => s.id === selectedSchoolId)?.name;

  // ---------- Mutations (Schools) ----------
  const createSchoolMutation = useMutation({
    mutationFn: catalogService.createSchool,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      message.success('Thêm trường thành công');
      setIsSchoolModalOpen(false);
      schoolForm.resetFields();
    },
    onError: (err: any) => message.error(err.response?.data?.detail || 'Lỗi khi thêm trường'),
  });

  const updateSchoolMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string } }) =>
      catalogService.updateSchool(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      message.success('Cập nhật trường thành công');
      setIsSchoolModalOpen(false);
      setEditingSchool(null);
      schoolForm.resetFields();
    },
    onError: (err: any) => message.error(err.response?.data?.detail || 'Lỗi cập nhật'),
  });

  const deleteSchoolMutation = useMutation({
    mutationFn: catalogService.deleteSchool,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      if (selectedSchoolId) setSelectedSchoolId(null);
      message.success('Xóa trường thành công');
    },
    onError: (err: any) => message.error(err.response?.data?.detail || 'Lỗi xóa trường'),
  });

  // ---------- Mutations (Majors) ----------
  const createMajorMutation = useMutation({
    mutationFn: catalogService.createMajor,
    onSuccess: async (newMajor) => {
      const groupIds = majorForm.getFieldValue('subjectGroupIds') || [];
      if (groupIds.length === 0) {
        await refetchMajors();
        await refetchAllMajors();
        message.success('Thêm ngành thành công (chưa gán tổ hợp)');
        setIsMajorModalOpen(false);
        majorForm.resetFields();
        return;
      }
      try {
        await Promise.all(
          groupIds.map((groupId: number) =>
            catalogService.assignSubjectGroupToMajor(newMajor.data.id, groupId)
          )
        );
        await refetchMajors();
        await refetchAllMajors();
        message.success('Thêm ngành và gán tổ hợp thành công');
        setIsMajorModalOpen(false);
        majorForm.resetFields();
      } catch (err) {
        message.error('Lỗi khi gán tổ hợp, vui lòng thử lại');
      }
    },
    onError: (err: any) => message.error(err.response?.data?.detail || 'Lỗi khi tạo ngành'),
  });

  const updateMajorMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; school_id: number } }) =>
      catalogService.updateMajor(id, data),
    onSuccess: () => {
      refetchMajors();
      refetchAllMajors();
      message.success('Cập nhật thông tin ngành thành công');
    },
    onError: (err: any) => message.error(err.response?.data?.detail || 'Lỗi khi sửa ngành'),
  });

  const deleteMajorMutation = useMutation({
    mutationFn: catalogService.deleteMajor,
    onSuccess: () => {
      refetchMajors();
      refetchAllMajors();
      message.success('Xoá ngành thành công');
    },
    onError: (err: any) => message.error(err.response?.data?.detail || 'Lỗi xoá ngành'),
  });

  const assignGroupMutation = useMutation({
    mutationFn: ({ majorId, groupId }: { majorId: number; groupId: number }) =>
      catalogService.assignSubjectGroupToMajor(majorId, groupId),
    onSuccess: () => {
      refetchCurrentGroups();
      message.success('Đã thêm tổ hợp vào ngành');
    },
    onError: (err: any) => message.error(err.response?.data?.detail || 'Thêm tổ hợp thất bại'),
  });

  const removeGroupMutation = useMutation({
    mutationFn: ({ majorId, groupId }: { majorId: number; groupId: number }) =>
      catalogService.removeSubjectGroupFromMajor(majorId, groupId),
    onSuccess: () => {
      refetchCurrentGroups();
      message.success('Đã xoá tổ hợp khỏi ngành');
    },
    onError: (err: any) => {
      if (err.response?.status === 404) {
        message.error('Backend chưa hỗ trợ xoá tổ hợp khỏi ngành. Vui lòng liên hệ developer.');
      } else {
        message.error(err.response?.data?.detail || 'Xoá tổ hợp thất bại');
      }
    },
  });

  // ---------- Mutations (Subject Groups) ----------
  const createSubjectGroupMutation = useMutation({
    mutationFn: catalogService.createSubjectGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjectGroups'] });
      message.success('Thêm tổ hợp môn thành công');
      setIsSubjectGroupModalOpen(false);
      subjectGroupForm.resetFields();
    },
    onError: (err: any) => message.error(err.response?.data?.detail || 'Lỗi khi thêm tổ hợp'),
  });

  const updateSubjectGroupMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; subjects: string[] } }) =>
      catalogService.updateSubjectGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjectGroups'] });
      message.success('Cập nhật tổ hợp môn thành công');
      setIsSubjectGroupModalOpen(false);
      setEditingSubjectGroup(null);
      subjectGroupForm.resetFields();
    },
    onError: (err: any) => message.error(err.response?.data?.detail || 'Lỗi cập nhật'),
  });

  const deleteSubjectGroupMutation = useMutation({
    mutationFn: catalogService.deleteSubjectGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjectGroups'] });
      message.success('Xóa tổ hợp môn thành công');
    },
    onError: (err: any) => message.error(err.response?.data?.detail || 'Lỗi xóa tổ hợp'),
  });

  // ---------- Handlers ----------
  const handleAddSchool = () => {
    setEditingSchool(null);
    schoolForm.resetFields();
    setIsSchoolModalOpen(true);
  };

  const handleEditSchool = (record: School) => {
    setEditingSchool(record);
    schoolForm.setFieldsValue({ name: record.name });
    setIsSchoolModalOpen(true);
  };

  const handleSchoolSubmit = async () => {
    try {
      const values = await schoolForm.validateFields();
      if (editingSchool) {
        updateSchoolMutation.mutate({ id: editingSchool.id, data: { name: values.name } });
      } else {
        createSchoolMutation.mutate({ name: values.name });
      }
    } catch (err) {}
  };

  const handleAddMajor = () => {
    if (!selectedSchoolId) {
      message.warning('Vui lòng chọn trường trước khi thêm ngành');
      return;
    }
    setEditingMajor(null);
    majorForm.resetFields();
    majorForm.setFieldsValue({ schoolId: selectedSchoolId, subjectGroupIds: [] });
    setSelectedGroupIds([]);
    setIsMajorModalOpen(true);
  };

  const handleEditMajor = (record: Major) => {
    setEditingMajor(record);
    majorForm.setFieldsValue({
      name: record.name,
      schoolId: record.school_id,
    });
    setIsMajorModalOpen(true);
  };

  const handleMajorSubmit = async () => {
    try {
      const values = await majorForm.validateFields();
      if (editingMajor) {
        await updateMajorMutation.mutateAsync({
          id: editingMajor.id,
          data: { name: values.name, school_id: values.schoolId },
        });
        const currentIds = currentGroups?.map(g => g.id) || [];
        const added = selectedGroupIds.filter(id => !currentIds.includes(id));
        const removed = currentIds.filter(id => !selectedGroupIds.includes(id));
        await Promise.all([
          ...added.map(groupId => assignGroupMutation.mutateAsync({ majorId: editingMajor.id, groupId })),
          ...removed.map(groupId => removeGroupMutation.mutateAsync({ majorId: editingMajor.id, groupId })),
        ]);
        setIsMajorModalOpen(false);
        setEditingMajor(null);
        majorForm.resetFields();
      } else {
        await createMajorMutation.mutateAsync({
          name: values.name,
          school_id: values.schoolId,
        });
      }
    } catch (err) {}
  };

  const handleMajorGroupChange = (values: number[]) => {
    if (!editingMajor) {
      majorForm.setFieldsValue({ subjectGroupIds: values });
    } else {
      setSelectedGroupIds(values);
    }
  };

  const handleAddSubjectGroup = () => {
    setEditingSubjectGroup(null);
    subjectGroupForm.resetFields();
    setIsSubjectGroupModalOpen(true);
  };

  const handleEditSubjectGroup = (record: SubjectGroup) => {
    setEditingSubjectGroup(record);
    subjectGroupForm.setFieldsValue({
      name: record.name,
      subjects: record.subjects.join(', '),
    });
    setIsSubjectGroupModalOpen(true);
  };

  const handleSubjectGroupSubmit = async () => {
    try {
      const values = await subjectGroupForm.validateFields();
      const payload = {
        name: values.name,
        subjects: values.subjects.split(',').map((s: string) => s.trim()).filter(Boolean),
      };
      if (editingSubjectGroup) {
        updateSubjectGroupMutation.mutate({ id: editingSubjectGroup.id, data: payload });
      } else {
        createSubjectGroupMutation.mutate(payload);
      }
    } catch (err) {}
  };

  // ---------- Table Columns ----------
  const schoolColumns = [
    {
      title: <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">ID</span>,
      dataIndex: 'id',
      key: 'id',
      width: 64,
      render: (id: number) => (
        <span className="text-xs font-mono text-gray-400">#{id}</span>
      ),
    },
    {
      title: <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tên trường</span>,
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: School) => (
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: selectedSchoolId === record.id ? '#B30000' : '#f5f5f5',
              transition: 'background 0.2s',
            }}
          >
            <BankOutlined style={{ fontSize: 13, color: selectedSchoolId === record.id ? '#fff' : '#B30000' }} />
          </div>
          <span className="font-medium text-gray-800 text-sm">{name}</span>
        </div>
      ),
    },
    {
      title: <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Số ngành</span>,
      key: 'majorCount',
      width: 100,
      render: (_: any, record: School) => {
        const count = majorCountBySchool[record.id] || 0;
        return (
          <Badge
            count={count}
            showZero
            style={{ backgroundColor: count > 0 ? '#B30000' : '#d9d9d9', fontSize: 11 }}
          />
        );
      },
    },
    {
      title: <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Thao tác</span>,
      key: 'action',
      width: 140,
      render: (_: any, record: School) => (
        <Space size={6}>
          <Tooltip title="Chỉnh sửa">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={(e) => { e.stopPropagation(); handleEditSchool(record); }}
              className="border-0 shadow-none hover:bg-blue-50 hover:text-blue-600 text-gray-500"
            />
          </Tooltip>
          <Popconfirm
            title={
              <div className="max-w-xs">
                <p className="font-semibold text-gray-800 mb-1">Xóa trường này?</p>
                <p className="text-xs text-gray-500">Sẽ xóa tất cả ngành thuộc trường và hồ sơ liên quan.</p>
              </div>
            }
            onConfirm={(e) => { e?.stopPropagation(); deleteSchoolMutation.mutate(record.id); }}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            icon={<InfoCircleOutlined style={{ color: '#ff4d4f' }} />}
          >
            <Tooltip title="Xóa">
              <Button
                icon={<DeleteOutlined />}
                size="small"
                onClick={(e) => e.stopPropagation()}
                className="border-0 shadow-none hover:bg-red-50 hover:text-red-500 text-gray-400"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const majorColumns = [
    {
      title: <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">ID</span>,
      dataIndex: 'id',
      key: 'id',
      width: 64,
      render: (id: number) => (
        <span className="text-xs font-mono text-gray-400">#{id}</span>
      ),
    },
    {
      title: <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tên ngành</span>,
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <div className="flex items-center gap-2">
          <BookOutlined className="text-primary" style={{ color: '#B30000', fontSize: 13 }} />
          <span className="text-sm text-gray-700 font-medium">{name}</span>
        </div>
      ),
    },
    {
      title: <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Thao tác</span>,
      key: 'action',
      width: 120,
      render: (_: any, record: Major) => (
        <Space size={6}>
          <Tooltip title="Chỉnh sửa">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditMajor(record)}
              className="border-0 shadow-none hover:bg-blue-50 hover:text-blue-600 text-gray-500"
            />
          </Tooltip>
          <Popconfirm
            title={
              <div className="max-w-xs">
                <p className="font-semibold text-gray-800 mb-1">Xóa ngành này?</p>
                <p className="text-xs text-gray-500">Xóa tất cả mapping tổ hợp, không thể khôi phục.</p>
              </div>
            }
            onConfirm={() => deleteMajorMutation.mutate(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            icon={<InfoCircleOutlined style={{ color: '#ff4d4f' }} />}
          >
            <Tooltip title="Xóa">
              <Button
                icon={<DeleteOutlined />}
                size="small"
                className="border-0 shadow-none hover:bg-red-50 hover:text-red-500 text-gray-400"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const subjectGroupColumns = [
    {
      title: <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">ID</span>,
      dataIndex: 'id',
      key: 'id',
      width: 64,
      render: (id: number) => (
        <span className="text-xs font-mono text-gray-400">#{id}</span>
      ),
    },
    {
      title: <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tên tổ hợp</span>,
      dataIndex: 'name',
      key: 'name',
      width: 110,
      render: (name: string) => (
        <Tag
          className="font-bold text-sm px-2 py-0.5"
          style={{ background: '#fff1f0', borderColor: '#ffccc7', color: '#B30000', borderRadius: 6 }}
        >
          {name}
        </Tag>
      ),
    },
    {
      title: <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Môn thi</span>,
      dataIndex: 'subjects',
      key: 'subjects',
      render: (subjects: string[]) => (
        <div className="flex flex-wrap gap-1">
          {subjects?.map(subject => (
            <Tag key={subject} color={getSubjectColor(subject)} style={{ borderRadius: 4, fontSize: 11 }}>
              {subject}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Thao tác</span>,
      key: 'action',
      width: 120,
      render: (_: any, record: SubjectGroup) => (
        <Space size={6}>
          <Tooltip title="Chỉnh sửa">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditSubjectGroup(record)}
              className="border-0 shadow-none hover:bg-blue-50 hover:text-blue-600 text-gray-500"
            />
          </Tooltip>
          <Popconfirm
            title={
              <div className="max-w-xs">
                <p className="font-semibold text-gray-800 mb-1">Xóa tổ hợp môn?</p>
                <p className="text-xs text-gray-500">Sẽ ảnh hưởng đến các ngành và hồ sơ đã dùng.</p>
              </div>
            }
            onConfirm={() => deleteSubjectGroupMutation.mutate(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            icon={<InfoCircleOutlined style={{ color: '#ff4d4f' }} />}
          >
            <Tooltip title="Xóa">
              <Button
                icon={<DeleteOutlined />}
                size="small"
                className="border-0 shadow-none hover:bg-red-50 hover:text-red-500 text-gray-400"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const paginationConfig = {
    pageSize: 5,
    showSizeChanger: false,
    position: ['bottomCenter'] as TablePaginationPosition[],
    size: 'small' as const,
  };

  // ---------- Shared table props ----------
  const tableStyles: React.CSSProperties = {
    borderRadius: 8,
  };

  // ---------- Render ----------
  return (
    <div className="min-h-screen p-5 md:p-8" style={{ background: '#f7f8fa' }}>
      {/* ── Page Header ── */}
      <div className="flex items-center gap-3">
        <div className="w-1 h-7 bg-[#B30000] rounded-full" />
        <div>
          <h1 className="text-xl font-bold text-gray-800 m-0 leading-tight">Quản lý xét tuyển</h1>
          <p className="text-xs text-gray-400 mt-0.5">Trường - Ngành - Tổ hợp</p>
        </div>
      </div>
      {/* ── Section 1: Danh sách trường ── */}
      <Card
        bordered={false}
        className="shadow-sm mb-5"
        style={{ borderRadius: 12 }}
        styles={{ body: { padding: 0 } }}
      >
        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <BankOutlined style={{ color: '#B30000', fontSize: 16 }} />
            <span className="font-semibold text-gray-800 text-sm">Danh sách trường đại học</span>
            {schools?.length ? (
              <span className="ml-1 px-2 py-0.5 bg-red-50 text-red-600 text-xs font-semibold rounded-full border border-red-100">
                {schools.length}
              </span>
            ) : null}
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="small"
            onClick={handleAddSchool}
            style={{ background: '#B30000', borderColor: '#B30000', borderRadius: 7 }}
          >
            Thêm trường
          </Button>
        </div>

        <div className="px-1">
          <Table
            dataSource={schools}
            columns={schoolColumns}
            rowKey="id"
            loading={loadingSchools}
            pagination={{ pageSize: 10, showSizeChanger: false, size: 'small', position: ['bottomCenter'] }}
            style={tableStyles}
            size="middle"
            onRow={(record) => ({
              onClick: () => setSelectedSchoolId(record.id),
              style: {
                cursor: 'pointer',
                background: selectedSchoolId === record.id ? '#fff9f9' : 'transparent',
                borderLeft: selectedSchoolId === record.id ? '3px solid #B30000' : '3px solid transparent',
                transition: 'all 0.15s ease',
              },
            })}
            rowClassName={(record) =>
              selectedSchoolId === record.id ? 'ant-table-row-selected' : ''
            }
          />
        </div>
      </Card>

      {/* ── Section 2: Ngành + Tổ hợp ── */}
      <Row gutter={16} align="stretch">
        {/* Ngành */}
        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            className="shadow-sm h-full"
            style={{ borderRadius: 12 }}
            styles={{ body: { padding: 0 } }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2 min-w-0">
                <BookOutlined style={{ color: '#B30000', fontSize: 15, flexShrink: 0 }} />
                <span className="font-semibold text-gray-800 text-sm truncate">
                  Ngành học
                  {selectedSchoolName && (
                    <span className="text-gray-400 font-normal">
                      {' '}· <span className="text-gray-600">{selectedSchoolName}</span>
                    </span>
                  )}
                </span>
              </div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="small"
                onClick={handleAddMajor}
                disabled={!selectedSchoolId}
                style={{
                  background: selectedSchoolId ? '#B30000' : undefined,
                  borderColor: selectedSchoolId ? '#B30000' : undefined,
                  borderRadius: 7,
                  flexShrink: 0,
                }}
              >
                Thêm ngành
              </Button>
            </div>

            <div className="px-1">
              {!selectedSchoolId ? (
                <div className="py-14 flex flex-col items-center gap-3 text-center">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: '#fff1f0' }}
                  >
                    <RightOutlined style={{ color: '#B30000', fontSize: 18 }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-0.5">Chọn trường để xem ngành</p>
                    <p className="text-xs text-gray-400">Nhấp vào một hàng trong bảng trường ở trên</p>
                  </div>
                </div>
              ) : (
                <Table
                  dataSource={majors}
                  columns={majorColumns}
                  rowKey="id"
                  loading={loadingMajors}
                  pagination={paginationConfig}
                  scroll={{ y: 280 }}
                  style={tableStyles}
                  size="middle"
                  locale={{ emptyText: <Empty description="Chưa có ngành nào" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                />
              )}
            </div>
          </Card>
        </Col>

        {/* Tổ hợp môn */}
        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            className="shadow-sm h-full"
            style={{ borderRadius: 12 }}
            styles={{ body: { padding: 0 } }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <AppstoreOutlined style={{ color: '#B30000', fontSize: 15 }} />
                <span className="font-semibold text-gray-800 text-sm">Tổ hợp môn</span>
                {subjectGroups?.length ? (
                  <span className="ml-1 px-2 py-0.5 bg-red-50 text-red-600 text-xs font-semibold rounded-full border border-red-100">
                    {subjectGroups.length}
                  </span>
                ) : null}
              </div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="small"
                onClick={handleAddSubjectGroup}
                style={{ background: '#B30000', borderColor: '#B30000', borderRadius: 7 }}
              >
                Thêm tổ hợp
              </Button>
            </div>

            <div className="px-1">
              <Table
                dataSource={subjectGroups}
                columns={subjectGroupColumns}
                rowKey="id"
                loading={loadingSubjectGroups}
                pagination={paginationConfig}
                scroll={{ y: 280 }}
                style={tableStyles}
                size="middle"
                locale={{ emptyText: <Empty description="Chưa có tổ hợp nào" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* ── Modal: Trường ── */}
      <Modal
        title={
          <div className="flex items-center gap-2 pb-1">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: '#fff1f0' }}
            >
              <BankOutlined style={{ color: '#B30000', fontSize: 14 }} />
            </div>
            <span className="font-semibold text-gray-800">
              {editingSchool ? 'Chỉnh sửa trường' : 'Thêm trường mới'}
            </span>
          </div>
        }
        open={isSchoolModalOpen}
        onOk={handleSchoolSubmit}
        onCancel={() => setIsSchoolModalOpen(false)}
        confirmLoading={createSchoolMutation.isPending || updateSchoolMutation.isPending}
        okText={editingSchool ? 'Lưu thay đổi' : 'Thêm trường'}
        cancelText="Hủy"
        okButtonProps={{ style: { background: '#B30000', borderColor: '#B30000' } }}
        width={440}
        styles={{ header: { borderBottom: '1px solid #f0f0f0', paddingBottom: 12, marginBottom: 0 } }}
      >
        <div className="pt-4">
          <Form form={schoolForm} layout="vertical" requiredMark={false}>
            <Form.Item
              name="name"
              label={<span className="text-sm font-medium text-gray-700">Tên trường</span>}
              rules={[{ required: true, message: 'Vui lòng nhập tên trường' }]}
            >
              <Input
                placeholder="VD: Đại học Bách Khoa Hà Nội"
                size="large"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
          </Form>
        </div>
      </Modal>

      {/* ── Modal: Ngành ── */}
      <Modal
        title={
          <div className="flex items-center gap-2 pb-1">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: '#fff1f0' }}
            >
              <BookOutlined style={{ color: '#B30000', fontSize: 14 }} />
            </div>
            <span className="font-semibold text-gray-800">
              {editingMajor ? 'Chỉnh sửa ngành' : 'Thêm ngành mới'}
            </span>
          </div>
        }
        open={isMajorModalOpen}
        onOk={handleMajorSubmit}
        onCancel={() => {
          setIsMajorModalOpen(false);
          setEditingMajor(null);
          majorForm.resetFields();
          setSelectedGroupIds([]);
        }}
        confirmLoading={createMajorMutation.isPending || updateMajorMutation.isPending}
        okText={editingMajor ? 'Lưu thay đổi' : 'Thêm ngành'}
        cancelText="Hủy"
        okButtonProps={{ style: { background: '#B30000', borderColor: '#B30000' } }}
        width={560}
        styles={{ header: { borderBottom: '1px solid #f0f0f0', paddingBottom: 12, marginBottom: 0 } }}
      >
        <div className="pt-4">
          <Form form={majorForm} layout="vertical" requiredMark={false} initialValues={{ subjectGroupIds: [] }}>
            <Form.Item
              name="name"
              label={<span className="text-sm font-medium text-gray-700">Tên ngành</span>}
              rules={[{ required: true, message: 'Vui lòng nhập tên ngành' }]}
            >
              <Input
                placeholder="VD: Kỹ thuật phần mềm"
                size="large"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
            <Form.Item
              name="schoolId"
              label={<span className="text-sm font-medium text-gray-700">Trường</span>}
              rules={[{ required: true, message: 'Vui lòng chọn trường' }]}
            >
              <Select
                options={schools?.map(s => ({ value: s.id, label: s.name }))}
                placeholder="Chọn trường"
                disabled={!!editingMajor}
                size="large"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
            <Form.Item
              name="subjectGroupIds"
              label={
                <span className="text-sm font-medium text-gray-700">
                  Tổ hợp xét tuyển
                  <span className="ml-1 text-xs text-gray-400 font-normal">(chọn nhiều)</span>
                </span>
              }
              rules={[{ required: !editingMajor, message: 'Chọn ít nhất một tổ hợp' }]}
            >
              <Select
                mode="multiple"
                placeholder="Chọn tổ hợp môn"
                onChange={handleMajorGroupChange}
                value={editingMajor ? selectedGroupIds : undefined}
                size="large"
                style={{ borderRadius: 8 }}
                options={subjectGroups?.map(sg => ({
                  value: sg.id,
                  label: `${sg.name} (${sg.subjects.join(', ')})`,
                }))}
              />
            </Form.Item>
          </Form>
        </div>
      </Modal>

      {/* ── Modal: Tổ hợp môn ── */}
      <Modal
        title={
          <div className="flex items-center gap-2 pb-1">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: '#fff1f0' }}
            >
              <AppstoreOutlined style={{ color: '#B30000', fontSize: 14 }} />
            </div>
            <span className="font-semibold text-gray-800">
              {editingSubjectGroup ? 'Chỉnh sửa tổ hợp môn' : 'Thêm tổ hợp môn mới'}
            </span>
          </div>
        }
        open={isSubjectGroupModalOpen}
        onOk={handleSubjectGroupSubmit}
        onCancel={() => setIsSubjectGroupModalOpen(false)}
        confirmLoading={createSubjectGroupMutation.isPending || updateSubjectGroupMutation.isPending}
        okText={editingSubjectGroup ? 'Lưu thay đổi' : 'Thêm tổ hợp'}
        cancelText="Hủy"
        okButtonProps={{ style: { background: '#B30000', borderColor: '#B30000' } }}
        width={440}
        styles={{ header: { borderBottom: '1px solid #f0f0f0', paddingBottom: 12, marginBottom: 0 } }}
      >
        <div className="pt-4">
          <Form form={subjectGroupForm} layout="vertical" requiredMark={false}>
            <Form.Item
              name="name"
              label={<span className="text-sm font-medium text-gray-700">Mã tổ hợp</span>}
              rules={[{ required: true, message: 'Vui lòng nhập tên tổ hợp' }]}
            >
              <Input
                placeholder="VD: A00, B00, D01..."
                size="large"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
            <Form.Item
              name="subjects"
              label={
                <span className="text-sm font-medium text-gray-700">
                  Môn thi
                  <span className="ml-1 text-xs text-gray-400 font-normal">(cách nhau bởi dấu phẩy)</span>
                </span>
              }
              rules={[{ required: true, message: 'Vui lòng nhập ít nhất một môn' }]}
            >
              <Input
                placeholder="VD: Toán, Lý, Hóa"
                size="large"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default UnifiedManagement;