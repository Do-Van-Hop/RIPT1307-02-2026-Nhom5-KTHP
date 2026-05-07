import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Tag,
  Space,
  Button,
  Image,
  Modal,
  Input,
  message,
  Popconfirm,
  Form,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as applicationService from '../../services/applicationService';

const statusMap: Record<string, { color: string; text: string }> = {
  DRAFT: { color: 'default', text: 'Nháp' },
  SUBMITTED: { color: 'blue', text: 'Đã nộp' },
  PENDING: { color: 'orange', text: 'Chờ duyệt' },
  APPROVED: { color: 'green', text: 'Đã duyệt' },
  REJECTED: { color: 'red', text: 'Từ chối' },
};

const AdminApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailForm] = Form.useForm();

  const { data: application, isLoading } = useQuery({
    queryKey: ['adminApplication', Number(id)],
    queryFn: async () => (await applicationService.getApplicationById(Number(id))).data,
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ status, reason }: { status: string; reason?: string }) =>
      applicationService.updateApplicationStatus(Number(id), status, reason),
    onSuccess: () => {
      message.success('Cập nhật trạng thái thành công');
      queryClient.invalidateQueries({ queryKey: ['adminApplication', Number(id)] });
      queryClient.invalidateQueries({ queryKey: ['adminApplications'] });
      setRejectModalOpen(false);
      setRejectReason('');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Lỗi cập nhật');
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: (values: { subject: string; body: string }) =>
      applicationService.sendCustomEmail(Number(id), values),
    onSuccess: () => {
      message.success('Đã gửi email thông báo');
      setEmailModalOpen(false);
      emailForm.resetFields();
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Lỗi gửi email');
    },
  });

  const handleApprove = () => {
    updateStatusMutation.mutate({ status: 'APPROVED' });
  };

  const handleRejectConfirm = () => {
    if (!rejectReason.trim()) {
      message.warning('Vui lòng nhập lý do từ chối');
      return;
    }
    updateStatusMutation.mutate({ status: 'REJECTED', reason: rejectReason });
  };

  const handleSendEmail = async () => {
    try {
      const values = await emailForm.validateFields();
      sendEmailMutation.mutate(values);
    } catch (error) {
    }
  };

  if (isLoading) return <div style={{ textAlign: 'center', padding: 50 }}>Đang tải...</div>;
  if (!application) return <div style={{ textAlign: 'center', padding: 50 }}>Không tìm thấy hồ sơ</div>;

  const statusInfo = statusMap[application.status] || { color: 'default', text: application.status };

  return (
    <Card
      title={`Chi tiết hồ sơ #${application.id}`}
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/applications')}>
          Quay lại danh sách
        </Button>
      }
    >
      <Descriptions bordered column={{ xs: 1, sm: 2 }} style={{ marginBottom: 24 }}>
        <Descriptions.Item label="Thí sinh">{application.user?.email || 'N/A'}</Descriptions.Item>
        <Descriptions.Item label="Trường">{application.school?.name}</Descriptions.Item>
        <Descriptions.Item label="Ngành">{application.major?.name}</Descriptions.Item>
        <Descriptions.Item label="Tổ hợp">{application.subjectGroup?.name}</Descriptions.Item>
        <Descriptions.Item label="Trạng thái">
          <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Đối tượng ưu tiên">{application.priority}</Descriptions.Item>
        {application.submittedAt && (
          <Descriptions.Item label="Ngày nộp">
            {new Date(application.submittedAt).toLocaleDateString('vi-VN')}
          </Descriptions.Item>
        )}
        {application.scores && (
          <Descriptions.Item label="Điểm" span={2}>
            {Object.entries(application.scores).map(([subject, score]) => (
              <div key={subject}>
                {subject}: {score as number}
              </div>
            ))}
          </Descriptions.Item>
        )}
        {application.rejectReason && (
          <Descriptions.Item label="Lý do từ chối" span={2}>
            {application.rejectReason}
          </Descriptions.Item>
        )}
      </Descriptions>

      {application.documents?.length > 0 && (
        <>
          <h4>Minh chứng</h4>
          <Space wrap>
            {application.documents.map((doc: any, idx: number) => (
              <div key={idx}>
                {doc.url.match(/\.(jpeg|jpg|gif|png)$/) ? (
                  <Image src={doc.url} width={120} />
                ) : (
                  <a href={doc.url} target="_blank" rel="noopener noreferrer">
                    <Button>Xem PDF</Button>
                  </a>
                )}
              </div>
            ))}
          </Space>
        </>
      )}

      {/* Hành động chỉ hiển thị nếu trạng thái PENDING */}
      {application.status === 'PENDING' && (
        <div style={{ marginTop: 24 }}>
          <Space size="middle">
            <Popconfirm
              title="Xác nhận duyệt hồ sơ này?"
              onConfirm={handleApprove}
              okText="Đồng ý"
              cancelText="Hủy"
            >
              <Button type="primary" icon={<CheckOutlined />} loading={updateStatusMutation.isLoading}>
                Duyệt hồ sơ
              </Button>
            </Popconfirm>

            <Button
              danger
              icon={<CloseOutlined />}
              onClick={() => setRejectModalOpen(true)}
            >
              Từ chối
            </Button>
          </Space>

          <Modal
            title="Lý do từ chối"
            open={rejectModalOpen}
            onOk={handleRejectConfirm}
            onCancel={() => {
              setRejectModalOpen(false);
              setRejectReason('');
            }}
            confirmLoading={updateStatusMutation.isLoading}
            okText="Xác nhận từ chối"
            cancelText="Hủy"
          >
            <Input.TextArea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối hồ sơ..."
            />
          </Modal>
        </div>
      )}

      {/* Nút gửi email thủ công (luôn hiển thị) */}
      <div style={{ marginTop: 24 }}>
        <Button icon={<MailOutlined />} onClick={() => setEmailModalOpen(true)}>
          Gửi email thông báo
        </Button>
      </div>

      {/* Modal gửi email thủ công */}
      <Modal
        title="Gửi email cho thí sinh"
        open={emailModalOpen}
        onOk={handleSendEmail}
        onCancel={() => {
          setEmailModalOpen(false);
          emailForm.resetFields();
        }}
        confirmLoading={sendEmailMutation.isLoading}
        okText="Gửi"
        cancelText="Hủy"
      >
        <Form form={emailForm} layout="vertical">
          <Form.Item
            name="subject"
            label="Tiêu đề"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề email' }]}
          >
            <Input placeholder="Thông báo kết quả xét tuyển..." />
          </Form.Item>
          <Form.Item
            name="body"
            label="Nội dung"
            rules={[{ required: true, message: 'Vui lòng nhập nội dung email' }]}
          >
            <Input.TextArea rows={6} placeholder="Nhập nội dung email..." />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default AdminApplicationDetail;