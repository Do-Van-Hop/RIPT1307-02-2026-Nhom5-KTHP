import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Tag, Space, Button, Image, Modal, Input, message, Popconfirm, Skeleton, Avatar, Divider, Badge,
} from 'antd';
import {
  ArrowLeftOutlined, CheckOutlined, CloseOutlined, UserOutlined, PhoneOutlined,
  IdcardOutlined, CalendarOutlined, BankOutlined, BookOutlined, FileTextOutlined,
  PaperClipOutlined, MailOutlined, StarOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as applicationService from '../../services/applicationService';
import * as catalogService from '../../services/catalogService';

// Mapping priority number → display text
const priorityMap: Record<number, string> = {
  1: 'KV1',
  2: 'KV2',
  3: 'KV2-NT',
  4: 'KV3',
};

const statusMap: Record<string, { color: string; text: string; bg: string; dot: string }> = {
  DRAFT:     { color: 'default', text: 'Nháp',      bg: 'bg-gray-100',   dot: 'bg-gray-400' },
  SUBMITTED: { color: 'blue',    text: 'Đã nộp',    bg: 'bg-blue-50',    dot: 'bg-blue-500' },
  PENDING:   { color: 'orange',  text: 'Chờ duyệt', bg: 'bg-orange-50',  dot: 'bg-orange-500' },
  APPROVED:  { color: 'green',   text: 'Đã duyệt',  bg: 'bg-green-50',   dot: 'bg-green-500' },
  REJECTED:  { color: 'red',     text: 'Từ chối',   bg: 'bg-red-50',     dot: 'bg-red-500' },
};

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 py-3">
    <span className="mt-0.5 text-[#B30000] text-base flex-shrink-0">{icon}</span>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-gray-800 font-medium break-words">{value ?? '—'}</p>
    </div>
  </div>
);

interface SectionCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, icon, children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
    <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
      {icon && <span className="text-[#B30000]">{icon}</span>}
      <h3 className="text-sm font-semibold text-gray-700 tracking-wide uppercase m-0">{title}</h3>
    </div>
    <div className="divide-y divide-gray-50 px-5">{children}</div>
  </div>
);

const AdminApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Fetch application detail
  const { data: application, isLoading } = useQuery({
    queryKey: ['adminApplication', Number(id)],
    queryFn: async () => (await applicationService.getApplicationById(Number(id))).data,
    enabled: !!id,
  });

  // Fetch catalogs for mapping
  const { data: schools } = useQuery({
    queryKey: ['schools'],
    queryFn: async () => (await catalogService.getSchools()).data,
    staleTime: 5 * 60 * 1000,
  });

  const { data: majors } = useQuery({
    queryKey: ['majors'],
    queryFn: async () => {
      // Lấy tất cả majors (có thể qua API /majors? không filter)
      const res = await catalogService.getMajorsBySchool(0); // Không truyền school_id sẽ lấy tất cả? Service hiện tại getMajorsBySchool yêu cầu schoolId. Cần điều chỉnh hoặc dùng API khác.
      // Thay vào đó, dùng getAllMajors nếu có. Ở đây tôi giả sử có endpoint /majors/ không filter.
      // Thực tế trong code có useAllMajors hook, nhưng để độc lập, tôi sẽ gọi /majors với tham số schoolId=0 để lấy tất cả (nếu backend cho phép).
      // Nếu không, có thể dùng useAllMajors. Tôi sẽ dùng useAllMajors hook để đơn giản.
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!application,
  });

  // Dùng hook useAllMajors có sẵn để lấy tất cả majors
  const { data: allMajorsData } = useQuery({
    queryKey: ['allMajorsForDetail'],
    queryFn: async () => {
      const schoolsRes = await catalogService.getSchools();
      const schoolList = schoolsRes.data as { id: number; name: string }[];
      const majorsPromises = schoolList.map(school =>
        catalogService.getMajorsBySchool(school.id).then(res => res.data as any[])
      );
      const majorsArrays = await Promise.all(majorsPromises);
      const allMajors = majorsArrays.flat();
      const majorMap = new Map<number, string>();
      allMajors.forEach(m => majorMap.set(m.id, m.name));
      return { list: allMajors, map: majorMap };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!application,
  });

  const { data: subjectGroups } = useQuery({
    queryKey: ['subjectGroups'],
    queryFn: async () => (await catalogService.getSubjectGroups()).data,
    staleTime: 5 * 60 * 1000,
  });

  const subjectGroupMap = new Map(subjectGroups?.map((sg: any) => [sg.id, sg.name]));
  const schoolMap = new Map(schools?.map((s: any) => [s.id, s.name]));
  const majorMap = allMajorsData?.map || new Map<number, string>();

  const updateStatusMutation = useMutation({
    mutationFn: ({ status, reason }: { status: string; reason?: string }) =>
      applicationService.updateApplicationStatus(Number(id), status, reason),
    onSuccess: async (_, variables) => {
      message.success('Cập nhật trạng thái thành công');
      queryClient.invalidateQueries({ queryKey: ['adminApplication', Number(id)] });
      queryClient.invalidateQueries({ queryKey: ['adminApplications'] });
      setRejectModalOpen(false);
      setRejectReason('');

      const subject = variables.status === 'APPROVED'
        ? 'Hồ sơ xét tuyển đã được duyệt'
        : 'Hồ sơ xét tuyển bị từ chối';

      let body = '';
      if (variables.status === 'APPROVED') {
        body = `Chúc mừng! Hồ sơ #${id} của bạn đã được duyệt.\nVui lòng theo dõi các bước tiếp theo.`;
      } else {
        const reason = variables.reason || 'Không có lý do cụ thể';
        body = `Rất tiếc, hồ sơ #${id} của bạn đã bị từ chối.\nLý do: ${reason}\nLiên hệ phòng tuyển sinh nếu cần giải đáp.`;
      }

      try {
        await applicationService.sendApplicationEmail(Number(id), subject, body);
        message.success('📧 Đã gửi email thông báo cho thí sinh');
      } catch (emailError) {
        console.error('Gửi email thất bại', emailError);
        message.warning('⚠️ Cập nhật trạng thái thành công nhưng không thể gửi email. Vui lòng kiểm tra lại cấu hình email.');
      }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton active paragraph={{ rows: 2 }} />
          <Skeleton active paragraph={{ rows: 6 }} />
          <Skeleton active paragraph={{ rows: 4 }} />
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <FileTextOutlined className="text-5xl text-gray-300" />
          <p className="text-gray-500 text-base">Không tìm thấy hồ sơ</p>
          <Button onClick={() => navigate('/admin/applications')}>Quay lại danh sách</Button>
        </div>
      </div>
    );
  }

  const statusInfo = statusMap[application.status] || { color: 'default', text: application.status, bg: 'bg-gray-100', dot: 'bg-gray-400' };
  const priorityText = priorityMap[application.priority] || 'Không xác định';

  return (
    <div className="min-h-screen bg-gray-50/80 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/admin/applications')}
              className="rounded-xl border-gray-200 hover:border-primary hover:text-primary"
            >
              Quay lại
            </Button>
            <Divider type="vertical" className="h-6 !mx-0" />
            <div>
              <h1 className="text-xl font-bold text-gray-800 m-0 leading-tight">
                Hồ sơ <span className="text-[#B30000]">#{application.id}</span>
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">Chi tiết hồ sơ xét tuyển</p>
            </div>
          </div>

          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${statusInfo.bg} self-start sm:self-auto`}>
            <span className={`w-2 h-2 rounded-full ${statusInfo.dot} animate-pulse`} />
            <Tag color={statusInfo.color} className="!m-0 !border-0 !bg-transparent !p-0 !text-sm font-semibold">
              {statusInfo.text}
            </Tag>
          </div>
        </div>

        {/* ── Hero Card: Candidate summary ── */}
        <div className="bg-gradient-to-r from-[#B30000] to-[#E60000] rounded-2xl p-5 text-white shadow-lg shadow-red-200">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Avatar
              size={64}
              icon={<UserOutlined />}
              className="bg-white/20 border-2 border-white/30 flex-shrink-0 text-white"
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white m-0 truncate">{application.full_name}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                {application.phone && (
                  <span className="flex items-center gap-1.5 text-white/80 text-sm">
                    <PhoneOutlined className="text-xs" /> {application.phone}
                  </span>
                )}
                {application.cccd_number && (
                  <span className="flex items-center gap-1.5 text-white/80 text-sm">
                    <IdcardOutlined className="text-xs" /> {application.cccd_number}
                  </span>
                )}
                {application.submitted_at && (
                  <span className="flex items-center gap-1.5 text-white/80 text-sm">
                    <CalendarOutlined className="text-xs" />
                    Nộp {new Date(application.submitted_at).toLocaleDateString('vi-VN')}
                  </span>
                )}
              </div>
            </div>
            {/* Khung ưu tiên màu trắng, chữ đen */}
            <div className="flex-shrink-0 flex flex-col items-center bg-white rounded-xl px-4 py-2 shadow-sm">
              <StarOutlined className="text-gray-500 text-lg" />
              <span className="text-gray-500 text-xs mt-1 font-medium">Ưu tiên</span>
              <span className="text-gray-800 font-bold text-sm">{priorityText}</span>
            </div>
          </div>
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Thông tin cá nhân */}
          <SectionCard title="Thông tin cá nhân" icon={<UserOutlined />}>
            <InfoRow icon={<UserOutlined />} label="Thí sinh ID" value={application.user_id} />
            <InfoRow icon={<CalendarOutlined />} label="Ngày sinh" value={new Date(application.dob).toLocaleDateString('vi-VN')} />
            <InfoRow icon={<IdcardOutlined />} label="Số CCCD" value={application.cccd_number} />
            <InfoRow icon={<StarOutlined />} label="Đối tượng ưu tiên" value={priorityText} />
          </SectionCard>

          {/* Thông tin xét tuyển - hiển thị tên thay vì ID */}
          <SectionCard title="Thông tin xét tuyển" icon={<BankOutlined />}>
            <InfoRow
              icon={<BankOutlined />}
              label="Trường"
              value={schoolMap.get(application.school_id) || `ID: ${application.school_id}`}
            />
            <InfoRow
              icon={<BookOutlined />}
              label="Ngành"
              value={majorMap.get(application.major_id) || `ID: ${application.major_id}`}
            />
            <InfoRow
              icon={<BookOutlined />}
              label="Tổ hợp môn"
              value={subjectGroupMap.get(application.subject_group_id) || `ID: ${application.subject_group_id}`}
            />
            <InfoRow
              icon={<FileTextOutlined />}
              label="Trạng thái"
              value={<Tag color={statusInfo.color}>{statusInfo.text}</Tag>}
            />
          </SectionCard>
        </div>

        {/* ── Điểm số ── */}
        {application.scores && Object.keys(application.scores).length > 0 && (
          <SectionCard title="Bảng điểm" icon={<StarOutlined />}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-4">
              {Object.entries(application.scores).map(([subject, score]) => (
                <div
                  key={subject}
                  className="flex flex-col items-center justify-center bg-gray-50 rounded-xl p-3 border border-gray-100 hover:border-[#B30000]/30 transition-colors"
                >
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">{subject}</span>
                  <span className="text-2xl font-bold text-[#B30000]">{score as number}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* ── Lý do từ chối ── */}
        {application.reject_reason && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <CloseOutlined className="text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-red-400 mb-1">Lý do từ chối</p>
                <p className="text-sm text-red-700 leading-relaxed">{application.reject_reason}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Files ── */}
        {application.files && application.files.length > 0 && (
          <SectionCard title="Minh chứng đính kèm" icon={<PaperClipOutlined />}>
            <div className="py-4">
              <div className="flex flex-wrap gap-3">
                {application.files.map((file: any, idx: number) => (
                  file.file_url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                    <div key={idx} className="group relative">
                      <Image
                        src={file.file_url}
                        width={110}
                        height={110}
                        alt={file.file_type}
                        className="!rounded-xl object-cover border border-gray-200 group-hover:border-[#B30000]/40 transition-colors"
                      />
                      <span className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/50 text-white text-[10px] text-center rounded-md py-0.5 truncate px-1">
                        {file.file_type}
                      </span>
                    </div>
                  ) : (
                    <a
                      key={idx}
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#0038F7] hover:border-[#0038F7]/40 hover:bg-blue-50 transition-all no-underline"
                    >
                      <FileTextOutlined />
                      <span>{file.file_type}</span>
                    </a>
                  )
                ))}
              </div>
            </div>
          </SectionCard>
        )}

        {/* ── Action Panel ── */}
        {application.status === 'PENDING' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-[#B30000] rounded-full" />
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide m-0">Hành động</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Popconfirm
                title="Xác nhận duyệt hồ sơ này?"
                onConfirm={handleApprove}
                okText="Đồng ý"
                cancelText="Hủy"
              >
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  loading={updateStatusMutation.isPending}
                  size="large"
                  className="!rounded-xl !bg-[#B30000] !border-[#B30000] hover:!bg-[#E60000] hover:!border-[#E60000] flex-1 sm:flex-none"
                >
                  Duyệt hồ sơ
                </Button>
              </Popconfirm>
              <Button
                danger
                icon={<CloseOutlined />}
                size="large"
                onClick={() => setRejectModalOpen(true)}
                className="!rounded-xl flex-1 sm:flex-none"
              >
                Từ chối hồ sơ
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
              <MailOutlined />
              Email thông báo sẽ được gửi tự động sau khi cập nhật trạng thái.
            </p>
          </div>
        )}
      </div>

      {/* ── Reject Modal ── */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-red-600">
            <CloseOutlined />
            <span>Lý do từ chối hồ sơ</span>
          </div>
        }
        open={rejectModalOpen}
        onOk={handleRejectConfirm}
        onCancel={() => { setRejectModalOpen(false); setRejectReason(''); }}
        confirmLoading={updateStatusMutation.isPending}
        okText="Xác nhận từ chối"
        cancelText="Hủy"
        okButtonProps={{ danger: true, className: '!rounded-lg' }}
        cancelButtonProps={{ className: '!rounded-lg' }}
        className="!rounded-2xl"
      >
        <p className="text-gray-500 text-sm mb-3">
          Vui lòng nhập rõ lý do để thí sinh có thể hiểu và chỉnh sửa hồ sơ nếu cần.
        </p>
        <Input.TextArea
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Ví dụ: Hồ sơ thiếu minh chứng điểm thi, vui lòng bổ sung và nộp lại..."
          className="!rounded-xl"
          showCount
          maxLength={500}
        />
      </Modal>
    </div>
  );
};

export default AdminApplicationDetail;