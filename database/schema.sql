CREATE DATABASE IF NOT EXISTS admission_system;
USE admission_system;


CREATE TABLE users (
    id INT NOT NULL AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('candidate', 'admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id)
);


CREATE TABLE schools (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,

    PRIMARY KEY (id)
);


CREATE TABLE subject_groups (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,

    PRIMARY KEY (id)
);


CREATE TABLE majors (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    school_id INT,

    PRIMARY KEY (id),

    CONSTRAINT fk_major_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE CASCADE
);


CREATE TABLE major_subject_groups (
    id INT NOT NULL AUTO_INCREMENT,
    major_id INT,
    subject_group_id INT,

    PRIMARY KEY (id),

    CONSTRAINT fk_msg_major
        FOREIGN KEY (major_id)
        REFERENCES majors(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_msg_subject_group
        FOREIGN KEY (subject_group_id)
        REFERENCES subject_groups(id)
        ON DELETE CASCADE
);


CREATE TABLE applications (
    id INT NOT NULL AUTO_INCREMENT,

    user_id INT,
    school_id INT,
    major_id INT,
    subject_group_id INT,

    full_name VARCHAR(255),
    dob DATE,
    phone VARCHAR(20),

    score FLOAT,
    priority INT,

    status ENUM(
        'DRAFT',
        'SUBMITTED',
        'PENDING',
        'APPROVED',
        'REJECTED'
    ) DEFAULT 'DRAFT',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_application_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_application_school
        FOREIGN KEY (school_id)
        REFERENCES schools(id),

    CONSTRAINT fk_application_major
        FOREIGN KEY (major_id)
        REFERENCES majors(id),

    CONSTRAINT fk_application_subject_group
        FOREIGN KEY (subject_group_id)
        REFERENCES subject_groups(id)
);


CREATE TABLE files (
    id INT NOT NULL AUTO_INCREMENT,

    application_id INT,

    file_url TEXT,
    file_type VARCHAR(50),
    file_size INT,

    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_file_application
        FOREIGN KEY (application_id)
        REFERENCES applications(id)
        ON DELETE CASCADE
);

-- ============================================
-- CẬP NHẬT CÁC TRƯỜNG CÒN THIẾU
-- ============================================

-- 1. Thêm cột subjects (JSON) vào bảng subject_groups
ALTER TABLE subject_groups
ADD COLUMN subjects JSON NOT NULL;

-- 2. Thêm các cột còn thiếu vào bảng applications
ALTER TABLE applications
ADD COLUMN cccd_number VARCHAR(20),
ADD COLUMN scores JSON,
ADD COLUMN submitted_at TIMESTAMP NULL,
ADD COLUMN reject_reason VARCHAR(1000) NULL; 

-- 3. Sửa cột file_type trong bảng files thành ENUM
ALTER TABLE files
MODIFY COLUMN file_type ENUM('TRANSCRIPT', 'CCCD_FRONT', 'CCCD_BACK', 'CERTIFICATE'),
MODIFY COLUMN file_url VARCHAR(1000);

