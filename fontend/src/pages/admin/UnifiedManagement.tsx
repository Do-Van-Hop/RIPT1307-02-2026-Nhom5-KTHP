import React, { useState, useEffect } from 'react';
import {
  Table, Button, Space, Modal, Form, Input, Select, Popconfirm, message, Tag, Card, Row, Col,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as catalogService from '../../services/catalogService';
import { useAllMajors } from '../../hooks/useAllMajors';

const { Option } = Select;

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

  // Cập nhật selectedGroupIds khi mở modal sửa
  useEffect(() => {
    if (currentGroups) {
      setSelectedGroupIds(currentGroups.map(g => g.id));
    } else if (!editingMajor) {
      setSelectedGroupIds([]);
    }
  }, [currentGroups, editingMajor]);

  // Lấy tên trường hiện tại
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
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Tên trường', dataIndex: 'name', key: 'name' },
    {
      title: 'Số ngành',
      key: 'majorCount',
      render: (_: any, record: School) => majorCountBySchool[record.id] || 0,
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: School) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEditSchool(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Xóa trường sẽ xóa tất cả ngành thuộc trường và các hồ sơ liên quan (nếu có). Tiếp tục?"
            onConfirm={() => deleteSchoolMutation.mutate(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button icon={<DeleteOutlined />} size="small" danger>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const majorColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Tên ngành', dataIndex: 'name', key: 'name' },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: Major) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEditMajor(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Xóa ngành sẽ xóa tất cả mapping tổ hợp và không thể khôi phục. Tiếp tục?"
            onConfirm={() => deleteMajorMutation.mutate(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button icon={<DeleteOutlined />} size="small" danger>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const subjectGroupColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Tên tổ hợp', dataIndex: 'name', key: 'name' },
    {
      title: 'Môn thi',
      dataIndex: 'subjects',
      key: 'subjects',
      render: (subjects: string[]) => (
        <>
          {subjects?.map(subject => (
            <Tag key={subject}>{subject}</Tag>
          ))}
        </>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: SubjectGroup) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEditSubjectGroup(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Xóa tổ hợp môn sẽ ảnh hưởng đến các ngành và hồ sơ đã dùng. Tiếp tục?"
            onConfirm={() => deleteSubjectGroupMutation.mutate(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button icon={<DeleteOutlined />} size="small" danger>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ---------- Render ----------
  const paginationConfig = {
    pageSize: 5,
    showSizeChanger: false,
    position: ['bottomCenter'] as const,
  };

  return (
    <div>
      {/* Phần trên: Danh sách trường */}
      <Card title="Danh sách trường đại học" style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16, textAlign: 'right' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSchool}>
            Thêm trường
          </Button>
        </div>
        <Table
          dataSource={schools}
          columns={schoolColumns}
          rowKey="id"
          loading={loadingSchools}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          onRow={(record) => ({
            onClick: () => setSelectedSchoolId(record.id),
            style: { cursor: 'pointer', backgroundColor: selectedSchoolId === record.id ? '#e6f7ff' : 'transparent' },
          })}
        />
      </Card>

      {/* Phần dưới chia đôi */}
      <Row gutter={16} align="stretch">
        <Col span={12}>
          <Card
            title={
              <div style={{ textAlign: 'left' }}>
                Quản lý ngành{selectedSchoolName ? `: ${selectedSchoolName}` : ''}
              </div>
            }
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddMajor}
                disabled={!selectedSchoolId}
              >
                Thêm ngành
              </Button>
            }
            style={{ height: '100%' }}
          >
            {!selectedSchoolId ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                Vui lòng chọn một trường ở trên để quản lý ngành
              </div>
            ) : (
              <Table
                dataSource={majors}
                columns={majorColumns}
                rowKey="id"
                loading={loadingMajors}
                pagination={paginationConfig}
                scroll={{ y: 300 }}
              />
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title={<div style={{ textAlign: 'left' }}>Quản lý tổ hợp môn</div>}
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSubjectGroup}>
                Thêm tổ hợp
              </Button>
            }
            style={{ height: '100%' }}
          >
            <Table
              dataSource={subjectGroups}
              columns={subjectGroupColumns}
              rowKey="id"
              loading={loadingSubjectGroups}
              pagination={paginationConfig}
              scroll={{ y: 300 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Modal Thêm/Sửa Trường */}
      <Modal
        title={editingSchool ? 'Sửa trường' : 'Thêm trường mới'}
        open={isSchoolModalOpen}
        onOk={handleSchoolSubmit}
        onCancel={() => setIsSchoolModalOpen(false)}
        confirmLoading={createSchoolMutation.isPending || updateSchoolMutation.isPending}
      >
        <Form form={schoolForm} layout="vertical">
          <Form.Item name="name" label="Tên trường" rules={[{ required: true, message: 'Vui lòng nhập tên trường' }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Thêm/Sửa Ngành */}
      <Modal
        title={editingMajor ? 'Sửa ngành' : 'Thêm ngành mới'}
        open={isMajorModalOpen}
        onOk={handleMajorSubmit}
        onCancel={() => {
          setIsMajorModalOpen(false);
          setEditingMajor(null);
          majorForm.resetFields();
          setSelectedGroupIds([]);
        }}
        confirmLoading={createMajorMutation.isPending || updateMajorMutation.isPending}
        width={600}
      >
        <Form form={majorForm} layout="vertical" initialValues={{ subjectGroupIds: [] }}>
          <Form.Item name="name" label="Tên ngành" rules={[{ required: true, message: 'Vui lòng nhập tên ngành' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="schoolId" label="Trường" rules={[{ required: true }]}>
            <Select
              options={schools?.map(s => ({ value: s.id, label: s.name }))}
              placeholder="Chọn trường"
              disabled={!!editingMajor}
            />
          </Form.Item>
          <Form.Item
            name="subjectGroupIds"
            label="Tổ hợp xét tuyển (chọn nhiều)"
            rules={[{ required: editingMajor ? false : true, message: 'Chọn ít nhất một tổ hợp' }]}
          >
            <Select
              mode="multiple"
              placeholder="Chọn tổ hợp môn"
              onChange={handleMajorGroupChange}
              value={editingMajor ? selectedGroupIds : undefined}
              options={subjectGroups?.map(sg => ({
                value: sg.id,
                label: `${sg.name} (${sg.subjects.join(', ')})`,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Thêm/Sửa Tổ hợp môn */}
      <Modal
        title={editingSubjectGroup ? 'Sửa tổ hợp môn' : 'Thêm tổ hợp môn mới'}
        open={isSubjectGroupModalOpen}
        onOk={handleSubjectGroupSubmit}
        onCancel={() => setIsSubjectGroupModalOpen(false)}
        confirmLoading={createSubjectGroupMutation.isPending || updateSubjectGroupMutation.isPending}
      >
        <Form form={subjectGroupForm} layout="vertical">
          <Form.Item name="name" label="Tên tổ hợp" rules={[{ required: true, message: 'Vui lòng nhập tên tổ hợp' }]}>
            <Input placeholder="Ví dụ: A00" />
          </Form.Item>
          <Form.Item name="subjects" label="Danh sách môn (cách nhau bởi dấu phẩy)" rules={[{ required: true, message: 'Vui lòng nhập ít nhất một môn' }]}>
            <Input placeholder="Toán, Lý, Hóa" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UnifiedManagement;