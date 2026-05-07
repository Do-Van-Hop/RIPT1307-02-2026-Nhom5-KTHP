import React, { useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as catalogService from '../../services/catalogService';

interface School {
  id: number;
  name: string;
  code: string;
}

const SchoolManagement: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['schools'],
    queryFn: async () => {
      const res = await catalogService.getSchools();
      return res.data as School[];
    },
  });

  const createMutation = useMutation({
    mutationFn: catalogService.createSchool,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      message.success('Thêm trường thành công');
      setIsModalOpen(false);
      form.resetFields();
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Lỗi'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: unknown }) => catalogService.updateSchool(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      message.success('Cập nhật trường thành công');
      setIsModalOpen(false);
      setEditingSchool(null);
      form.resetFields();
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Lỗi'),
  });

  const deleteMutation = useMutation({
    mutationFn: catalogService.deleteSchool,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      message.success('Xóa trường thành công');
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Lỗi'),
  });

  const handleAdd = () => {
    setEditingSchool(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: School) => {
    setEditingSchool(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingSchool) {
        updateMutation.mutate({ id: editingSchool.id, data: values });
      } else {
        createMutation.mutate(values);
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      // validation failed
    }
  };

  const columns = [
    { title: 'Mã trường', dataIndex: 'code', key: 'code' },
    { title: 'Tên trường', dataIndex: 'name', key: 'name' },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: unknown, record: School) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Xác nhận xóa trường này?"
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
        <h2>Quản lý Trường</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Thêm trường
        </Button>
      </div>

      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingSchool ? 'Sửa trường' : 'Thêm trường mới'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="code"
            label="Mã trường"
            rules={[{ required: true, message: 'Vui lòng nhập mã trường' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="name"
            label="Tên trường"
            rules={[{ required: true, message: 'Vui lòng nhập tên trường' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SchoolManagement;