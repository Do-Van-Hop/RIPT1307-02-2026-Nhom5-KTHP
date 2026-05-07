import React, { useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as catalogService from '../../services/catalogService';

interface SubjectGroup {
  id: number;
  name: string;
  subjects: string[];
}

const SubjectGroupManagement: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SubjectGroup | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['subjectGroups'],
    queryFn: async () => {
      const res = await catalogService.getSubjectGroups();
      return res.data as SubjectGroup[];
    },
  });

  const createMutation = useMutation({
    mutationFn: catalogService.createSubjectGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjectGroups'] });
      message.success('Thêm tổ hợp thành công');
      setIsModalOpen(false);
      form.resetFields();
    },
    onError: (err: any) => message.error(err.response?.data?.message || 'Lỗi'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => catalogService.updateSubjectGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjectGroups'] });
      message.success('Cập nhật tổ hợp thành công');
      setIsModalOpen(false);
      setEditingGroup(null);
      form.resetFields();
    },
    onError: (err: any) => message.error(err.response?.data?.message || 'Lỗi'),
  });

  const deleteMutation = useMutation({
    mutationFn: catalogService.deleteSubjectGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjectGroups'] });
      message.success('Xóa tổ hợp thành công');
    },
    onError: (err: any) => message.error(err.response?.data?.message || 'Lỗi'),
  });

  const handleAdd = () => {
    setEditingGroup(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: SubjectGroup) => {
    setEditingGroup(record);
    form.setFieldsValue({
      name: record.name,
      subjects: record.subjects.join(', '),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        name: values.name,
        subjects: values.subjects.split(',').map((s: string) => s.trim()).filter(Boolean),
      };
      if (editingGroup) {
        updateMutation.mutate({ id: editingGroup.id, data: payload });
      } else {
        createMutation.mutate(payload);
      }
    } catch (err) {
      // validation errors
    }
  };

  const columns = [
    { title: 'Tên tổ hợp', dataIndex: 'name', key: 'name' },
    {
      title: 'Môn thi',
      dataIndex: 'subjects',
      key: 'subjects',
      render: (subjects: string[]) => (
        <>
          {subjects?.map((subject) => <Tag key={subject}>{subject}</Tag>)}
        </>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: SubjectGroup) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Xác nhận xóa tổ hợp này?"
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
        <h2>Quản lý Tổ hợp môn</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Thêm tổ hợp
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
        title={editingGroup ? 'Sửa tổ hợp' : 'Thêm tổ hợp mới'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={createMutation.isLoading || updateMutation.isLoading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Tên tổ hợp"
            rules={[{ required: true, message: 'Vui lòng nhập tên tổ hợp' }]}
          >
            <Input placeholder="Ví dụ: A00" />
          </Form.Item>
          <Form.Item
            name="subjects"
            label="Danh sách môn (cách nhau bởi dấu phẩy)"
            rules={[{ required: true, message: 'Vui lòng nhập ít nhất một môn' }]}
          >
            <Input placeholder="Toán, Lý, Hóa" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SubjectGroupManagement;