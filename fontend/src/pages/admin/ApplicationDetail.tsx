import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Descriptions, Tag, Space, Button, Image, Modal, Input, message, Popconfirm,
} from 'antd';
import { ArrowLeftOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
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
      message.error(err.response?.data?.detail || 'Lỗi cập nhật');
    },
  });

  const handleApprove = () => updateStatusMutation.mutate({ status: 'APPROVED' });
  const handleRejectConfirm = () => {
    if (!rejectReason.trim()) {
      message.warning('Vui lòng nhập lý do từ chối');
      return;
    }
    updateStatusMutation.mutate({ status: 'REJECTED', reason: rejectReason });
  };

  if (isLoading) return <div style={{ textAlign: 'center', padding: 50 }}>Đang tải...</div>;
  if (!application) return <div style={{ textAlign: 'center', padding: 50 }}>Không tìm thấy hồ sơ</div>;

  const statusInfo = statusMap[application.status] || { color: 'default', text: application.status };

  return (
    <Card
      title={`Chi tiết hồ sơ #${application.id}`}
      extra={<Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/applications')}>Quay lại</Button>}
    >
      <Descriptions bordered column={{ xs: 1, sm: 2 }} style={{ marginBottom: 24 }}>
        <Descriptions.Item label="Thí sinh ID">{application.user_id}</Descriptions.Item>
        <Descriptions.Item label="Họ tên">{application.full_name}</Descriptions.Item>
        <Descriptions.Item label="Số điện thoại">{application.phone}</Descriptions.Item>
        <Descriptions.Item label="Ngày sinh">{new Date(application.dob).toLocaleDateString('vi-VN')}</Descriptions.Item>
        <Descriptions.Item label="CCCD">{application.cccd_number}</Descriptions.Item>
        <Descriptions.Item label="Trường ID">{application.school_id}</Descriptions.Item>
        <Descriptions.Item label="Ngành ID">{application.major_id}</Descriptions.Item>
        <Descriptions.Item label="Tổ hợp ID">{application.subject_group_id}</Descriptions.Item>
        <Descriptions.Item label="Trạng thái">
          <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Đối tượng ưu tiên">{application.priority}</Descriptions.Item>
        {application.submitted_at && (
          <Descriptions.Item label="Ngày nộp">{new Date(application.submitted_at).toLocaleDateString('vi-VN')}</Descriptions.Item>
        )}
        {application.scores && (
          <Descriptions.Item label="Điểm" span={2}>
            {Object.entries(application.scores).map(([subject, score]) => (
              <div key={subject}>{subject}: {score as number}</div>
            ))}
          </Descriptions.Item>
        )}
        {application.reject_reason && (
          <Descriptions.Item label="Lý do từ chối" span={2}>{application.reject_reason}</Descriptions.Item>
        )}
      </Descriptions>

      {application.files && application.files.length > 0 && (
        <>
          <h4>Minh chứng đính kèm</h4>
          <Space wrap>
            {application.files.map((file: any, idx: number) => (
              <div key={idx}>
                {file.file_url.match(/\.(jpeg|jpg|gif|png)$/) ? (
                  <Image src={file.file_url} width={120} alt={file.file_type} />
                ) : (
                  <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                    {file.file_type} - Xem file
                  </a>
                )}
              </div>
            ))}
          </Space>
        </>
      )}

      {application.status === 'PENDING' && (
        <div style={{ marginTop: 24 }}>
          <Space size="middle">
            <Popconfirm title="Xác nhận duyệt hồ sơ này?" onConfirm={handleApprove} okText="Đồng ý" cancelText="Hủy">
              <Button type="primary" icon={<CheckOutlined />} loading={updateStatusMutation.isPending}>
                Duyệt hồ sơ
              </Button>
            </Popconfirm>
            <Button danger icon={<CloseOutlined />} onClick={() => setRejectModalOpen(true)}>
              Từ chối
            </Button>
          </Space>
          <Modal
            title="Lý do từ chối"
            open={rejectModalOpen}
            onOk={handleRejectConfirm}
            onCancel={() => { setRejectModalOpen(false); setRejectReason(''); }}
            confirmLoading={updateStatusMutation.isPending}
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
    </Card>
  );
};

export default AdminApplicationDetail;