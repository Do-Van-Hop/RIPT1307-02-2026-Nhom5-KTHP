import React from 'react';
import { Card, Descriptions, Tag, Space, Image, Button } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import * as applicationService from '../../services/applicationService';

const statusMap: Record<string, { color: string; text: string }> = {
  DRAFT: { color: 'default', text: 'Nháp' },
  SUBMITTED: { color: 'blue', text: 'Đã nộp' },
  PENDING: { color: 'orange', text: 'Chờ duyệt' },
  APPROVED: { color: 'green', text: 'Đã duyệt' },
  REJECTED: { color: 'red', text: 'Từ chối' },
};

const ApplicationDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['application', Number(id)],
    queryFn: async () => {
      const res = await applicationService.getApplicationById(Number(id));
      return res.data;
    },
  });

  if (isLoading) return <div>Đang tải...</div>;
  if (!data) return <div>Không tìm thấy hồ sơ</div>;

  const statusInfo = statusMap[data.status] || { color: 'default', text: data.status };

  return (
    <Card
      title={`Hồ sơ #${data.id}`}
      extra={
        <Space>
          {data.status === 'DRAFT' && (
            <Button onClick={() => navigate(`/candidate/applications/${data.id}/edit`)}>Sửa</Button>
          )}
          <Button onClick={() => navigate('/candidate/applications')}>Quay lại</Button>
        </Space>
      }
    >
      <Descriptions bordered column={{ xs: 1, md: 2 }} style={{ marginBottom: 24 }}>
        <Descriptions.Item label="Họ tên">{data.full_name}</Descriptions.Item>
        <Descriptions.Item label="Số điện thoại">{data.phone}</Descriptions.Item>
        <Descriptions.Item label="Ngày sinh">{new Date(data.dob).toLocaleDateString('vi-VN')}</Descriptions.Item>
        <Descriptions.Item label="Số CCCD">{data.cccd_number}</Descriptions.Item>
        <Descriptions.Item label="Trường">{data.school?.name || `ID: ${data.school_id}`}</Descriptions.Item>
        <Descriptions.Item label="Ngành">{data.major?.name || `ID: ${data.major_id}`}</Descriptions.Item>
        <Descriptions.Item label="Tổ hợp">{data.subjectGroup?.name || `ID: ${data.subject_group_id}`}</Descriptions.Item>
        <Descriptions.Item label="Đối tượng ưu tiên">{data.priority}</Descriptions.Item>
        <Descriptions.Item label="Trạng thái">
          <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
        </Descriptions.Item>
        {data.submitted_at && (
          <Descriptions.Item label="Ngày nộp">{new Date(data.submitted_at).toLocaleDateString('vi-VN')}</Descriptions.Item>
        )}
        {data.scores && (
          <Descriptions.Item label="Điểm" span={2}>
            {Object.entries(data.scores).map(([subject, score]) => (
              <div key={subject}>
                {subject}: {score as number}
              </div>
            ))}
          </Descriptions.Item>
        )}
        {data.reject_reason && (
          <Descriptions.Item label="Lý do từ chối" span={2}>
            {data.reject_reason}
          </Descriptions.Item>
        )}
      </Descriptions>

      {data.files && data.files.length > 0 && (
        <>
          <h4>Minh chứng đính kèm</h4>
          <Space wrap>
            {data.files.map((file: any, idx: number) => (
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
    </Card>
  );
};

export default ApplicationDetail;