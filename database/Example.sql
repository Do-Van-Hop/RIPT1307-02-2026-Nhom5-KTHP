USE admission_system;

-- 1. Người dùng (1 admin + 10 thí sinh)
-- Mật khẩu 'password' được mã hóa bằng bcrypt (hash: $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi)
INSERT INTO users (email, password_hash, role) VALUES
('admin@example.com', '$2b$12$OKHx4OhB6BMQrS8Jq.3Nq.Vtv94aWsTEv6m4gCAKB48mBdMSyeVyy', 'admin'),
('candidate1@example.com', '$2b$12$OKHx4OhB6BMQrS8Jq.3Nq.Vtv94aWsTEv6m4gCAKB48mBdMSyeVyy', 'candidate'),
('candidate2@example.com', '$2b$12$OKHx4OhB6BMQrS8Jq.3Nq.Vtv94aWsTEv6m4gCAKB48mBdMSyeVyy', 'candidate'),
('candidate3@example.com', '$2b$12$OKHx4OhB6BMQrS8Jq.3Nq.Vtv94aWsTEv6m4gCAKB48mBdMSyeVyy', 'candidate'),
('candidate4@example.com', '$2b$12$OKHx4OhB6BMQrS8Jq.3Nq.Vtv94aWsTEv6m4gCAKB48mBdMSyeVyy', 'candidate'),
('candidate5@example.com', '$2b$12$OKHx4OhB6BMQrS8Jq.3Nq.Vtv94aWsTEv6m4gCAKB48mBdMSyeVyy', 'candidate'),
('candidate6@example.com', '$2b$12$OKHx4OhB6BMQrS8Jq.3Nq.Vtv94aWsTEv6m4gCAKB48mBdMSyeVyy', 'candidate'),
('candidate7@example.com', '$2b$12$OKHx4OhB6BMQrS8Jq.3Nq.Vtv94aWsTEv6m4gCAKB48mBdMSyeVyy', 'candidate'),
('candidate8@example.com', '$2b$12$OKHx4OhB6BMQrS8Jq.3Nq.Vtv94aWsTEv6m4gCAKB48mBdMSyeVyy', 'candidate'),
('candidate9@example.com', '$2b$12$OKHx4OhB6BMQrS8Jq.3Nq.Vtv94aWsTEv6m4gCAKB48mBdMSyeVyy', 'candidate'),
('candidate10@example.com', '$2b$12$OKHx4OhB6BMQrS8Jq.3Nq.Vtv94aWsTEv6m4gCAKB48mBdMSyeVyy', 'candidate');

-- 2. Tổ hợp môn (subject_groups)
INSERT INTO subject_groups (name, subjects) VALUES
('A00', JSON_ARRAY('Toán', 'Vật lý', 'Hóa học')),
('A01', JSON_ARRAY('Toán', 'Vật lý', 'Tiếng Anh')),
('B00', JSON_ARRAY('Toán', 'Hóa học', 'Sinh học')),
('C00', JSON_ARRAY('Ngữ văn', 'Lịch sử', 'Địa lý')),
('D01', JSON_ARRAY('Toán', 'Ngữ văn', 'Tiếng Anh')),
('D07', JSON_ARRAY('Toán', 'Hóa học', 'Tiếng Anh')),
('D08', JSON_ARRAY('Toán', 'Sinh học', 'Tiếng Anh')),
('D14', JSON_ARRAY('Ngữ văn', 'Lịch sử', 'Tiếng Anh')),
('D15', JSON_ARRAY('Ngữ văn', 'Địa lý', 'Tiếng Anh'));

-- 3. Trường đại học (schools)
INSERT INTO schools (name) VALUES
('Đại học Bách Khoa Hà Nội'),
('Đại học Quốc gia Hà Nội'),
('Đại học Kinh tế TP. Hồ Chí Minh'),
('Đại học Sư phạm Hà Nội'),
('Đại học Y Hà Nội'),
('Đại học Ngoại thương'),
('Đại học Công nghệ Thông tin - ĐHQG TP.HCM');

-- 4. Ngành đào tạo (majors)
-- Lấy id của các trường vừa insert (giả sử id từ 1 đến 7)
INSERT INTO majors (name, school_id) VALUES
-- ĐH Bách Khoa Hà Nội (school_id = 1)
('Kỹ thuật máy tính', 1),
('Cơ khí', 1),
('Điện tử viễn thông', 1),
('Khoa học máy tính', 1),
('Kỹ thuật hóa học', 1),
-- ĐH Quốc gia Hà Nội (2)
('Quản trị kinh doanh', 2),
('Luật', 2),
('Quan hệ quốc tế', 2),
('Khoa học máy tính', 2),
('Ngôn ngữ Anh', 2),
-- ĐH Kinh tế TP.HCM (3)
('Kinh doanh quốc tế', 3),
('Kế toán', 3),
('Tài chính ngân hàng', 3),
('Marketing', 3),
('Hệ thống thông tin quản lý', 3),
-- ĐH Sư phạm Hà Nội (4)
('Sư phạm Toán', 4),
('Sư phạm Văn', 4),
('Sư phạm Tiếng Anh', 4),
('Tâm lý học', 4),
-- ĐH Y Hà Nội (5)
('Y khoa', 5),
('Dược học', 5),
('Răng Hàm Mặt', 5),
('Y tế công cộng', 5),
-- ĐH Ngoại thương (6)
('Kinh tế đối ngoại', 6),
('Thương mại quốc tế', 6),
('Tài chính quốc tế', 6),
('Ngôn ngữ thương mại (Anh)', 6),
-- ĐH Công nghệ Thông tin - ĐHQG TP.HCM (7)
('Công nghệ thông tin', 7),
('Kỹ thuật phần mềm', 7),
('Hệ thống thông tin', 7),
('Trí tuệ nhân tạo', 7);

-- 5. Liên kết ngành - tổ hợp (major_subject_groups)
-- Mỗi ngành nhận 1-3 tổ hợp xét tuyển phù hợp
-- Lấy id các majors vừa tạo (giả sử từ 1 đến 31) và id các subject_groups (1..9)
INSERT INTO major_subject_groups (major_id, subject_group_id) VALUES
-- Kỹ thuật máy tính (1) -> A00, A01
(1, 1), (1, 2),
-- Cơ khí (2) -> A00
(2, 1),
-- Điện tử viễn thông (3) -> A00, A01
(3, 1), (3, 2),
-- Khoa học máy tính (4) -> A00, A01
(4, 1), (4, 2),
-- Kỹ thuật hóa học (5) -> A00, B00
(5, 1), (5, 3),
-- Quản trị kinh doanh (6) -> A01, D01
(6, 2), (6, 5),
-- Luật (7) -> C00, D01
(7, 4), (7, 5),
-- Quan hệ quốc tế (8) -> C00, D01, D14
(8, 4), (8, 5), (8, 8),
-- Khoa học máy tính (9) -> A00, A01
(9, 1), (9, 2),
-- Ngôn ngữ Anh (10) -> D01, D14, D15
(10, 5), (10, 8), (10, 9),
-- Kinh doanh quốc tế (11) -> A01, D01, D07
(11, 2), (11, 5), (11, 6),
-- Kế toán (12) -> A00, A01, D01
(12, 1), (12, 2), (12, 5),
-- Tài chính ngân hàng (13) -> A00, A01, D01
(13, 1), (13, 2), (13, 5),
-- Marketing (14) -> A01, D01
(14, 2), (14, 5),
-- Hệ thống thông tin quản lý (15) -> A00, A01
(15, 1), (15, 2),
-- Sư phạm Toán (16) -> A00, A01
(16, 1), (16, 2),
-- Sư phạm Văn (17) -> C00, D01
(17, 4), (17, 5),
-- Sư phạm Tiếng Anh (18) -> D01, D14, D15
(18, 5), (18, 8), (18, 9),
-- Tâm lý học (19) -> B00, C00
(19, 3), (19, 4),
-- Y khoa (20) -> B00
(20, 3),
-- Dược học (21) -> A00, B00
(21, 1), (21, 3),
-- Răng Hàm Mặt (22) -> B00
(22, 3),
-- Y tế công cộng (23) -> B00, A00
(23, 3), (23, 1),
-- Kinh tế đối ngoại (24) -> A01, D01, D07
(24, 2), (24, 5), (24, 6),
-- Thương mại quốc tế (25) -> A01, D01, D07
(25, 2), (25, 5), (25, 6),
-- Tài chính quốc tế (26) -> A01, D01, D07
(26, 2), (26, 5), (26, 6),
-- Ngôn ngữ thương mại (Anh) (27) -> D01, D14, D15
(27, 5), (27, 8), (27, 9),
-- Công nghệ thông tin (28) -> A00, A01
(28, 1), (28, 2),
-- Kỹ thuật phần mềm (29) -> A00, A01
(29, 1), (29, 2),
-- Hệ thống thông tin (30) -> A00, A01
(30, 1), (30, 2),
-- Trí tuệ nhân tạo (31) -> A00, A01
(31, 1), (31, 2);

-- 6. Đơn đăng ký (applications) – mỗi thí sinh 2-3 đơn, trạng thái đa dạng
-- Lấy user_id từ 2 đến 11 (candidate1..10), major_id, school_id, subject_group_id phù hợp
-- Thời gian tạo và nộp khác nhau
INSERT INTO applications (
    user_id, school_id, major_id, subject_group_id,
    full_name, dob, phone, score, priority,
    status, cccd_number, scores, submitted_at, reject_reason
) VALUES
-- Thí sinh 1 (candidate1@...) – 2 đơn
(2, 1, 1, 1, 'Nguyễn Văn A', '2005-08-15', '0912345678', 27.5, 1, 'APPROVED', '001123456789', '{"math":9.0,"physics":8.5,"chemistry":8.5}', '2025-03-10 10:30:00', NULL),
(2, 2, 6, 2, 'Nguyễn Văn A', '2005-08-15', '0912345678', 25.0, 0, 'REJECTED', '001123456789', '{"math":8.0,"physics":7.5,"english":8.0}', '2025-03-12 14:15:00', 'Không đủ điểm chuẩn'),
-- Thí sinh 2 (candidate2)
(3, 3, 11, 5, 'Trần Thị B', '2005-02-20', '0987654321', 28.0, 0, 'PENDING', '002987654321', '{"math":9.0,"literature":8.5,"english":9.0}', '2025-03-15 09:00:00', NULL),
(3, 6, 24, 5, 'Trần Thị B', '2005-02-20', '0987654321', 27.0, 0, 'SUBMITTED', '002987654321', '{"math":8.5,"literature":8.0,"english":9.0}', '2025-03-18 11:20:00', NULL),
-- Thí sinh 3 (candidate3)
(4, 4, 16, 1, 'Lê Văn C', '2005-12-01', '0977123456', 26.5, 1, 'DRAFT', '003456789123', NULL, NULL, NULL),
(4, 5, 20, 3, 'Lê Văn C', '2005-12-01', '0977123456', 28.0, 1, 'SUBMITTED', '003456789123', '{"math":9.0,"chemistry":8.5,"biology":9.0}', '2025-03-20 08:45:00', NULL),
-- Thí sinh 4 (candidate4)
(5, 7, 28, 1, 'Phạm Thị D', '2005-05-10', '0933222111', 29.0, 0, 'APPROVED', '004112233445', '{"math":9.5,"physics":9.0,"chemistry":9.0}', '2025-03-05 16:20:00', NULL),
(5, 1, 4, 2, 'Phạm Thị D', '2005-05-10', '0933222111', 28.0, 0, 'PENDING', '004112233445', '{"math":9.0,"physics":8.5,"english":9.0}', '2025-03-08 13:10:00', NULL),
-- Thí sinh 5 (candidate5)
(6, 2, 8, 5, 'Hoàng Văn E', '2005-09-18', '0965444333', 24.5, 2, 'REJECTED', '005667788990', '{"math":7.5,"literature":8.0,"english":8.0}', '2025-03-02 10:00:00', 'Hồ sơ không hợp lệ'),
(6, 3, 12, 1, 'Hoàng Văn E', '2005-09-18', '0965444333', 26.0, 2, 'SUBMITTED', '005667788990', '{"math":8.5,"physics":8.0,"chemistry":8.5}', '2025-03-04 14:30:00', NULL),
-- Thí sinh 6 (candidate6)
(7, 6, 26, 2, 'Ngô Thị F', '2005-07-22', '0900111222', 27.5, 0, 'APPROVED', '006998877665', '{"math":9.0,"physics":8.5,"english":8.5}', '2025-03-11 09:15:00', NULL),
(7, 7, 29, 1, 'Ngô Thị F', '2005-07-22', '0900111222', 28.5, 0, 'PENDING', '006998877665', '{"math":9.5,"physics":9.0,"chemistry":9.0}', '2025-03-13 15:40:00', NULL),
-- Thí sinh 7 (candidate7)
(8, 4, 18, 5, 'Đỗ Văn G', '2005-03-14', '0944556677', 26.0, 1, 'SUBMITTED', '007123456001', '{"math":7.5,"literature":8.5,"english":9.0}', '2025-03-19 12:00:00', NULL),
(8, 5, 21, 3, 'Đỗ Văn G', '2005-03-14', '0944556677', 27.5, 1, 'DRAFT', '007123456001', NULL, NULL, NULL),
-- Thí sinh 8 (candidate8)
(9, 1, 5, 1, 'Bùi Thị H', '2005-11-05', '0977888999', 25.5, 0, 'PENDING', '008554433221', '{"math":8.0,"physics":7.5,"chemistry":8.0}', '2025-03-16 08:30:00', NULL),
(9, 3, 14, 5, 'Bùi Thị H', '2005-11-05', '0977888999', 24.0, 0, 'SUBMITTED', '008554433221', '{"math":7.5,"literature":8.0,"english":8.0}', '2025-03-17 10:45:00', NULL),
-- Thí sinh 9 (candidate9)
(10, 2, 9, 1, 'Vũ Văn I', '2005-06-30', '0912349876', 28.0, 0, 'APPROVED', '009876543210', '{"math":9.0,"physics":9.0,"chemistry":9.0}', '2025-03-01 14:00:00', NULL),
(10, 7, 31, 2, 'Vũ Văn I', '2005-06-30', '0912349876', 27.0, 0, 'PENDING', '009876543210', '{"math":8.5,"physics":8.5,"english":8.5}', '2025-03-03 11:15:00', NULL),
-- Thí sinh 10 (candidate10)
(11, 6, 25, 6, 'Trịnh Thị K', '2005-04-12', '0922333444', 26.5, 0, 'SUBMITTED', '010112233445', '{"math":8.5,"chemistry":8.0,"english":9.0}', '2025-03-14 09:50:00', NULL),
(11, 5, 22, 3, 'Trịnh Thị K', '2005-04-12', '0922333444', 27.0, 0, 'REJECTED', '010112233445', '{"math":8.0,"chemistry":8.0,"biology":8.5}', '2025-03-15 16:20:00', 'Thiếu chứng chỉ ngoại ngữ');

-- 7. Tệp tin đính kèm (files) – một vài đơn đăng ký có file mẫu
INSERT INTO files (application_id, file_url, file_type, file_size) VALUES
-- Đơn ứng tuyển id = 1 (candidate1, approved) có 3 file
(1, '/uploads/transcript_nguyenvana.pdf', 'TRANSCRIPT', 204800),
(1, '/uploads/cccd_front_nguyenvana.jpg', 'CCCD_FRONT', 51200),
(1, '/uploads/cccd_back_nguyenvana.jpg', 'CCCD_BACK', 49800),
-- Đơn id = 2 (candidate1, rejected) có 1 file
(2, '/uploads/transcript_nguyenvana_2.pdf', 'TRANSCRIPT', 210000),
-- Đơn id = 3 (candidate2, pending) có file
(3, '/uploads/cccd_front_tranthib.jpg', 'CCCD_FRONT', 52300),
-- Đơn id = 6 (candidate4, approved) có file chứng chỉ
(6, '/uploads/certificate_phamthid.pdf', 'CERTIFICATE', 150000),
-- Đơn id = 9 (candidate5, rejected) có file
(9, '/uploads/transcript_hoangvane.pdf', 'TRANSCRIPT', 198000),
-- Đơn id = 14 (candidate9, approved) có đủ 3 loại
(14, '/uploads/transcript_vuvani.pdf', 'TRANSCRIPT', 215000),
(14, '/uploads/cccd_front_vuvani.jpg', 'CCCD_FRONT', 48700),
(14, '/uploads/cccd_back_vuvani.jpg', 'CCCD_BACK', 49100),
(14, '/uploads/certificate_ielts_vuvani.pdf', 'CERTIFICATE', 300000),
-- Đơn id = 19 (candidate10, rejected) có file
(19, '/uploads/transcript_trinhthik.pdf', 'TRANSCRIPT', 201000),
(19, '/uploads/cccd_front_trinhthik.jpg', 'CCCD_FRONT', 51000);