-- Otzaria Library Database Schema
-- MySQL 8.0+

-- Drop tables if exist (for fresh install)
DROP TABLE IF EXISTS page_history;
DROP TABLE IF EXISTS message_replies;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS uploads;
DROP TABLE IF EXISTS pages;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  points INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Books table
CREATE TABLE books (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(255),
  description TEXT,
  thumbnail_path VARCHAR(500),
  total_pages INT DEFAULT 0,
  source_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pages table
CREATE TABLE pages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book_id VARCHAR(100) NOT NULL,
  page_number INT NOT NULL,
  status ENUM('available', 'in-progress', 'completed') DEFAULT 'available',
  editor_id VARCHAR(36),
  editor_name VARCHAR(255),
  content LONGTEXT,
  thumbnail_path VARCHAR(500),
  claimed_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (editor_id) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_book_page (book_id, page_number),
  INDEX idx_status (status),
  INDEX idx_editor (editor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Page history (for tracking changes)
CREATE TABLE page_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  page_id INT NOT NULL,
  user_id VARCHAR(36),
  action ENUM('claimed', 'released', 'completed', 'edited') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_page (page_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Messages table
CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id VARCHAR(36) NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  recipient_id VARCHAR(36),
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('unread', 'read', 'replied') DEFAULT 'unread',
  is_admin_message BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_sender (sender_id),
  INDEX idx_recipient (recipient_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Message replies
CREATE TABLE message_replies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  message_id INT NOT NULL,
  sender_id VARCHAR(36) NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_message (message_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Page content (for two-column editing)
CREATE TABLE page_content (
  id INT AUTO_INCREMENT PRIMARY KEY,
  page_id INT NOT NULL UNIQUE,
  content LONGTEXT,
  left_column LONGTEXT,
  right_column LONGTEXT,
  two_columns BOOLEAN DEFAULT FALSE,
  is_content_split BOOLEAN DEFAULT FALSE,
  right_column_name VARCHAR(100) DEFAULT 'חלק 1',
  left_column_name VARCHAR(100) DEFAULT 'חלק 2',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
  INDEX idx_page (page_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Uploads table (for book submissions)
CREATE TABLE uploads (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  book_name VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  reviewed_by VARCHAR(36),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
