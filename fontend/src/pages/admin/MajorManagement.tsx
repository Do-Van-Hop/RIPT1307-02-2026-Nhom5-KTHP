import React, { useState } from 'react';
import { Select, Table, Button, Space, Modal, Form, Input, message, Popconfirm, Tag, Transfer } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as catalogService from '../../services/catalogService';

interface Major {
  id: number;
  name: string;
  code: string;
  subjectGroups?: { id: number; name: string }[];
}

const MajorManagement: React.FC = () => {
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMajor, setEditingMajor] = useState<Major | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: schools } = useQuery({
    queryKey: ['schools'],
    queryFn: async () => {
      const res = await catalogService.getSchools();
      return res.data;
    },
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
    queryFn: async () => {
      const res = await catalogService.getSubjectGroups();
      return res.data;
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: catalogService.createMajor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['majors', selectedSchoolId] });
      message.success('Thêm ngành thành công');
      setIsModalOpen(false);
      form.resetFields();
    },
    onError: (err: any) => message.error(err.response?.data?.message || 'Lỗi'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => catalogService.updateMajor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['majors', selectedSchoolId] });
      message.success('Cập nhật ngành thành công');
      setIsModalOpen(false);
      setEditingMajor(null);
      form.resetFields();
    },
    onError: (err: any) => message.error(err.response?.data?.message || 'Lỗi'),
  });

  const deleteMutation = useMutation({
    mutationFn: catalogService.deleteMajor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['majors', selectedSchoolId] });
      message.success('Xóa ngành thành công');
    },
    onError: (err: any) => message.error(err.response?.data?.message || 'Lỗi'),
  });

  const handleAdd = () => {
    setEditingMajor(null);
    form.resetFields();
    form.setFieldsValue({ subjectGroupIds: [] });
    setIsModalOpen(true);
  };

  const handleEdit = (record: Major) => {
    setEditingMajor(record);
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      subjectGroupIds: record.subjectGroups?.map((sg) => sg.id) || [],
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        name: values.name,
        code: values.code,
        schoolId: selectedSchoolId!,
        subjectGroupIds: values.subjectGroupIds,
      };
      if (editingMajor) {
        updateMutation.mutate({ id: editingMajor.id, data: payload });
      } else {
        createMutation.mutate(payload);
      }
    } catch (err) {
    }
  };

  const columns = [
    { title: 'Mã ngành', dataIndex: 'code', key: 'code' },
    { title: 'Tên ngành', dataIndex: 'name', key: 'name' },
    {
      title: 'Tổ hợp xét tuyển',
      dataIndex: 'subjectGroups',
      key: 'subjectGroups',
      render: (sgs: { id: number; name: string }[] | undefined) => (
        <>
          {sgs?.map((sg) => <Tag key={sg.id}>{sg.name}</Tag>)}
        </>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: Major) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Xác nhận xóa ngành này?"
            onConfirm={() => deleteMutation.mutate(record.id)}
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

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>Quản lý Ngành theo Trường</h2>
        <div style={{ display: 'flex', gap: 16 }}>
          <Select
            style={{ width: 300 }}
            placeholder="Chọn trường"
            options={schools?.map((s: any) => ({ value: s.id, label: s.name }))}
            onChange={(value) => setSelectedSchoolId(value)}
            value={selectedSchoolId}
            allowClear
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            disabled={!selectedSchoolId}
          >
            Thêm ngành
          </Button>
        </div>
      </div>

      <Table
        dataSource={majors}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingMajor ? 'Sửa ngành' : 'Thêm ngành mới'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={createMutation.isLoading || updateMutation.isLoading}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="code"
            label="Mã ngành"
            rules={[{ required: true, message: 'Vui lòng nhập mã ngành' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="name"
            label="Tên ngành"
            rules={[{ required: true, message: 'Vui lòng nhập tên ngành' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="subjectGroupIds"
            label="Tổ hợp xét tuyển"
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất một tổ hợp' }]}
          >
            <Select
              mode="multiple"
              placeholder="Chọn tổ hợp"
              options={subjectGroups?.map((sg: any) => ({ value: sg.id, label: sg.name }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MajorManagement;