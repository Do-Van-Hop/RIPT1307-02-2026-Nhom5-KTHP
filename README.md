# HỆ THỐNG TUYỂN SINH ĐẠI HỌC TRỰC TUYẾN (ADMISSION SYSTEM)

# I. GIỚI THIỆU DỰ ÁN

Dự án được xây dựng nhằm tối ưu hóa quy trình quản lý và nộp hồ sơ xét tuyển đại học trực tuyến. Hệ thống hỗ trợ hai đối tượng người dùng chính với các phân hệ chức năng riêng biệt:

- Thí sinh (Candidate): Đăng ký tài khoản, tạo hồ sơ, chọn trường/ngành học/tổ hợp môn, tải lên các minh chứng cá nhân (học bạ, CCCD) và theo dõi trạng thái xét tuyển.

- Quản trị viên (Admin): Xem bảng điều khiển thống kê số liệu, duyệt hoặc từ chối hồ sơ kèm lý do chi tiết, quản lý danh mục trường học và ngành học.

Deploy Netlify: Có thể xem trực tiếp demo thông qua
https://tuyensinh.netlify.app/login

# II. KIẾN TRÚC HỆ THỐNG & CÔNG NGHỆ SỬ DỤNG

**1. Phân hệ Backend (/app)**

- Ngôn ngữ & Framework: Python 3.13+, FastAPI (hiệu năng cao, tự động đồng bộ tài liệu API chuẩn OpenAPI).

- Cơ sở dữ liệu & ORM: MySQL kết hợp thư viện SQLAlchemy để quản lý truy vấn.

- Bảo mật & Xác thực: Cơ chế mã hóa JWT (JSON Web Tokens) thuật toán HS256, mật khẩu được băm an toàn bằng bcrypt.

- Lưu trữ đám mây: Tích hợp trực tiếp với Cloudinary API để lưu trữ học bạ và ảnh thẻ dạng URL.

- Hệ thống thông báo: Gửi mail tự động thông qua giao thức SMTP (Gmail App Password) để cập nhật trạng thái hồ sơ về hòm thư của thí sinh.

**2. Phân hệ Frontend (/fontend)**

- Công nghệ cốt lõi: React (v18/v19), TypeScript, công cụ build Vite giúp tối ưu tốc độ phản hồi.

- Giao diện & UI: Thư viện Ant Design (Antd) kết hợp tùy chỉnh linh hoạt từ Tailwind CSS.

- Quản lý trạng thái: Sử dụng Zustand cho Global State (Auth/Token) và React Query (@tanstack/react-query) nhằm đồng bộ và cache dữ liệu từ API.

# III. CẤU TRÚC THƯ MỤC CHÍNH

├── app/ # Mã nguồn Backend (FastAPI)

    │   ├── core/                 # Cấu hình bảo mật, Cloudinary, Env Dependencies

    │   ├── db/                   # Thiết lập kết nối cơ sở dữ liệu (SQLAlchemy)

    │   ├── models/               # Các thực thể dữ liệu (Users, Applications, Schools, Majors,...)

    │   ├── routers/              # Định tuyến API endpoints (Auth, Applications, Catalog, Stats,...)

    │   └── schemas/              # Pydantic Schemas định nghĩa cấu trúc dữ liệu Input/Output

├── database/ # Thư mục lưu trữ database script

    │   ├── schema.sql            # File khởi tạo cấu trúc các bảng dữ liệu

    │   └── Example.sql           # Dữ liệu mẫu (Seed Data) để chạy kiểm thử

└── fontend/ # Mã nguồn Frontend (React + Vite + TS)

    ├── src/

    │   ├── components/       # Các Component dùng chung (ProtectedRoute, Cascader,...)

    │   ├── layouts/          # Layout phân quyền (AdminLayout, CandidateLayout)

    │   ├── pages/            # Các trang giao diện (Đăng ký, Đăng nhập, Dashboard, Hồ sơ,...)

    │   ├── services/         # Tầng gọi API kết nối đến Backend

    │   └── store/            # Quản lý Session/Token bằng Zustand

# IV. QUY TRÌNH CÀI ĐẶT CHI TIẾT (DEPLOYMENT GUIDE)

**Bước 1: Khởi tạo Cơ Sở Dữ Liệu (MySQL)**

- Truy cập vào hệ quản trị MySQL của bạn (Workbench, Navicat hoặc CMD).

- Tạo một cơ sở dữ liệu trống có tên là admission_system.

- Import lần lượt 2 file script theo đúng thứ tự để tránh lỗi ràng buộc khóa ngoại:
  - File 1: database/schema.sql (Khởi tạo cấu trúc bảng)

  - File 2: database/Example.sql (Nạp dữ liệu kiểm thử hệ thống)

**Bước 2: Cấu hình và Chạy Phân Hệ Backend**

- Di chuyển Terminal vào thư mục app/ hoặc thư mục gốc chứa file cấu hình.

- Tạo file cấu hình môi trường thực tế .env từ file mẫu .env.example
- Cập nhật các thông số môi trường trong file .env mới tạo:
  - DATABASE_URL: Thay đổi thông tin user/password MySQL tương ứng của máy bạn.

  - SECRET_KEY: Chuỗi ký tự bất kỳ để mã hóa token.

  - CLOUD_NAME, CLOUD_API_KEY, CLOUD_API_SECRET: Thông tin API từ tài khoản Cloudinary của bạn để lưu file.

  - EMAIL_USER, EMAIL_PASSWORD: Tài khoản Gmail và Mật khẩu ứng dụng (App Password) dùng để kích hoạt tính năng gửi mail tự động.

- Kích hoạt môi trường ảo Python và tiến hành cài đặt thư viện phụ thuộc:
  - python -m venv venv

  **Trên Windows:**
  - .\venv\Scripts\activate

  **Trên macOS/Linux:**
  - source venv/bin/activate

  **Tiến hành cài đặt gói cài đặt cần thiết**
  - pip install fastapi uvicorn sqlalchemy pymysql bcrypt python-jose python-dotenv cloudinary
  - pip install "pydantic[email]"
  - pip install python-multipart

- Khởi chạy máy chủ Backend: uvicorn app.main:app --reload --port 8006
  - Địa chỉ cổng API cục bộ: http://127.0.0.1:8000
  - Hệ thống kiểm thử Swagger UI: http://127.0.0.1:8000/docs

**Bước 3: Cấu hình và Chạy Phân Hệ Frontend**

- Mở một cửa sổ Terminal mới và di chuyển vào thư mục giao diện: cd fontend
- Tạo file cấu hình .env cho Frontend: (Kiểm tra biến VITE_API_URL bên trong file để chắc chắn nó đang trỏ đúng về địa chỉ cổng Backend http://localhost:8000)
- Tiến hành cài đặt các gói thư viện:
  - npm install
  - npm install antd @ant-design/icons axios react-router-dom zustand @tanstack/react-query
  - npm install -D @types/node
  - npm install @ant-design/charts
  - npm install dayjs
  - npm install -D tailwindcss@^3 postcss@^8 autoprefixer@^10

- Khởi chạy giao diện ở môi trường phát triển: npm run dev

# V. KỊCH BẢN KIỂM THỬ TÍNH NĂNG (TESTING FLOWS)

Để thầy cô hoặc người kiểm thử đánh giá dự án một cách nhanh nhất, hãy thực hiện kiểm tra theo hai luồng nghiệp vụ sau:

**1. Luồng Nghiệp Vụ Thí Sinh (Candidate Flow)**

- Tài khoản sử dụng: Tiến hành đăng ký tài khoản mới ngay trên giao diện (hệ thống tự động phân vai trò candidate) hoặc sử dụng tài khoản có sẵn trong tập dữ liệu mẫu.
- Các bước kiểm thử:
  - Đăng nhập hệ thống $\rightarrow$ Cập nhật thông tin tại trang Hồ sơ cá nhân.
  - Truy cập chức năng Tạo Hồ Sơ Xét Tuyển: Chọn trường mong muốn, hệ thống sẽ tự động hiển thị các ngành học tương ứng của trường đó nhờ bộ lọc động (Cascader). Chọn tổ hợp môn phù hợp.
  - Tiến hành đính kèm file ảnh học bạ/CCCD lên hệ thống (Dữ liệu lập tức đẩy lên Cloudinary và trả về URL hiển thị trực quan).
  - Lựa chọn lưu trạng thái Nháp (DRAFT) nếu muốn chỉnh sửa sau, hoặc nhấn Nộp Hồ Sơ (Submit) để gửi lên hội đồng tuyển sinh.
  - Ngay khi nộp, hồ sơ chuyển trạng thái sang Chờ duyệt (PENDING) và một email tự động sẽ được gửi về hòm thư của thí sinh để xác nhận.

**2. Luồng Nghiệp Vụ Quản Trị Viên (Admin Flow)**

- Tài khoản sử dụng: Sử dụng tài khoản có quyền quản trị được chỉ định trong cơ sở dữ liệu mẫu (bảng users có trường role = 'admin').

- Các bước kiểm thử:
  - Đăng nhập tài khoản Admin $\rightarrow$ Hệ thống tự động chuyển hướng vào Bảng điều khiển quản trị (Admin Dashboard). Tại đây có biểu đồ thống kê trực quan số lượng hồ sơ của từng trường học.
  - Đi tới danh sách Quản lý hồ sơ: Sử dụng các thanh công cụ bộ lọc (Filter) theo Trường, Ngành học, hoặc trạng thái xử lý để lọc nhanh danh sách.
  - Click chi tiết vào một hồ sơ để kiểm tra toàn bộ thông tin kê khai kèm minh chứng file đính kèm dạng hình ảnh.
  - Thực hiện các thao tác xử lý: Duyệt, Từ chối.
