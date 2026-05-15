import React, { useState } from 'react';
import { Select, Table, Button, Space, Modal, Form, Input, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as catalogService from '../../services/catalogService';

interface Major {
  id: number;
  name: string;
  school_id: number;
}

const MajorManagement: React.FC = () => {
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMajor, setEditingMajor] = useState<Major | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: schools } = useQuery({
    queryKey: ['schools'],
    queryFn: async () => (await catalogService.getSchools()).data,
  });

  const { data: majors, isLoading } = useQuery({
    queryKey: ['majors', selectedSchoolId],
    queryFn: async () => {
      if (!selectedSchoolId) return [];
      const res = await catalogService.getMajorsBySchool(selectedSchoolId);
      return res.data as Major[];
    },
    enabled: !!selectedSchoolId,
  });

  const { data: subjectGroups } = useQuery({
    queryKey: ['subjectGroups'],
    queryFn: async () => (await catalogService.getSubjectGroups()).data,
  });

  const createMutation = useMutation({
    mutationFn: catalogService.createMajor,
    onSuccess: (newMajor) => {
      const subjectGroupIds = form.getFieldValue('subjectGroupIds') || [];
      if (subjectGroupIds.length === 0) {
        queryClient.invalidateQueries({ queryKey: ['majors', selectedSchoolId] });
        message.success('Thêm ngành thành công (chưa gán tổ hợp)');
        setIsModalOpen(false);
        form.resetFields();
        return;
      }
      const assignPromises = subjectGroupIds.map((groupId: number) =>
        catalogService.assignSubjectGroupToMajor(newMajor.data.id, groupId)
      );
      Promise.all(assignPromises)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['majors', selectedSchoolId] });
          message.success('Thêm ngành và gán tổ hợp thành công');
          setIsModalOpen(false);
          form.resetFields();
        })
        .catch(() => message.error('Lỗi khi gán tổ hợp, vui lòng thử lại'));
    },
    onError: (err: any) => message.error(err.response?.data?.detail || 'Lỗi khi tạo ngành'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; schoolId: number } }) =>
      catalogService.updateMajor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['majors', selectedSchoolId] });
      message.success('Cập nhật ngành thành công');
      setIsModalOpen(false);
      setEditingMajor(null);
      form.resetFields();
    },
    onError: (err: any) => message.error(err.response?.data?.detail || 'Lỗi cập nhật'),
  });

  const deleteMutation = useMutation({
    mutationFn: catalogService.deleteMajor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['majors', selectedSchoolId] });
      message.success('Xóa ngành thành công');
    },
    onError: (err: any) => message.error(err.response?.data?.detail || 'Lỗi xóa ngành'),
  });

  const handleAdd = () => {
    setEditingMajor(null);
    form.resetFields();
    form.setFieldsValue({ subjectGroupIds: [] });
    setIsModalOpen(true);
  };

  const handleEdit = (record: Major) => {
    setEditingMajor(record);
    form.setFieldsValue({ name: record.name, schoolId: record.school_id });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingMajor) {
        await updateMutation.mutateAsync({ id: editingMajor.id, data: { name: values.name, schoolId: values.schoolId } });
      } else {
        await createMutation.mutateAsync({ name: values.name, schoolId: selectedSchoolId! });
      }
    } catch (err) {
      // validation error or mutation error
    }
  };

  const columns = [
    { title: 'Tên ngành', dataIndex: 'name', key: 'name' },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: Major) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>Sửa</Button>
          <Popconfirm
            title="Xóa ngành này sẽ xóa tất cả mapping tổ hợp và không thể khôi phục. Tiếp tục?"
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button icon={<DeleteOutlined />} size="small" danger>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>Quản lý Ngành</h2>
        <div style={{ display: 'flex', gap: 16 }}>
          <Select
            style={{ width: 300 }}
            placeholder="Chọn trường"
            options={schools?.map((s: any) => ({ value: s.id, label: s.name }))}
            onChange={(value) => setSelectedSchoolId(value)}
            value={selectedSchoolId}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} disabled={!selectedSchoolId}>
            Thêm ngành
          </Button>
        </div>
      </div>
      <Table dataSource={majors} columns={columns} rowKey="id" loading={isLoading} pagination={{ pageSize: 10 }} />
      <Modal
        title={editingMajor ? 'Sửa ngành' : 'Thêm ngành mới'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên ngành" rules={[{ required: true, message: 'Vui lòng nhập tên ngành' }]}>
            <Input />
          </Form.Item>
          {editingMajor ? (
            <Form.Item name="schoolId" label="Trường" rules={[{ required: true }]}>
              <Select
                options={schools?.map((s: any) => ({ value: s.id, label: s.name }))}
                placeholder="Chọn trường"
              />
            </Form.Item>
          ) : (
            <Form.Item name="subjectGroupIds" label="Tổ hợp xét tuyển (chọn nhiều)" rules={[{ required: true, message: 'Chọn ít nhất một tổ hợp' }]}>
              <Select mode="multiple" placeholder="Chọn tổ hợp" options={subjectGroups?.map((sg: any) => ({ value: sg.id, label: sg.name }))} />
            </Form.Item>
          )}
          {editingMajor && (
            <div style={{ color: 'gray', marginTop: 8 }}>
              Lưu ý: Để thay đổi tổ hợp môn, hãy xóa ngành và tạo lại hoặc dùng tính năng gán tổ hợp riêng (chưa có trên UI).
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default MajorManagement;