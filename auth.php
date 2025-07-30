<?php
header('Content-Type: application/json');
require_once 'db.php';

$response = ['success' => false, 'message' => ''];

try {
    $action = $_POST['action'] ?? '';
    
    if ($action === 'signup') {
        // Signup logic
        $name = trim($_POST['name']);
        $email = trim($_POST['email']);
        $password = trim($_POST['password']);
        $confirmPassword = trim($_POST['confirmPassword']);
        
        // Validation
        if (empty($name) {
            throw new Exception('Name is required');
        }
        if (empty($email) {
            throw new Exception('Email is required');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception('Invalid email format');
        }
        if (empty($password)) {
            throw new Exception('Password is required');
        }
        if (strlen($password) < 6) {
            throw new Exception('Password must be at least 6 characters');
        }
        if ($password !== $confirmPassword) {
            throw new Exception('Passwords do not match');
        }
        
        // Check if email exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->rowCount() > 0) {
            throw new Exception('Email already registered');
        }
        
        // Hash password
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        
        // Insert user
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)");
        $stmt->execute([$name, $email, $hashedPassword]);
        
        $response['success'] = true;
        $response['message'] = 'Account created successfully! Please sign in.';
        
    } elseif ($action === 'signin') {
        // Signin logic
        $email = trim($_POST['email']);
        $password = trim($_POST['password']);
        
        if (empty($email) {
            throw new Exception('Email is required');
        }
        if (empty($password)) {
            throw new Exception('Password is required');
        }
        
        // Get user
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user || !password_verify($password, $user['password'])) {
            throw new Exception('Invalid email or password');
        }
        
        // Return user data (without password)
        unset($user['password']);
        $response['success'] = true;
        $response['message'] = 'Signed in successfully!';
        $response['user'] = $user;
        
    } else {
        throw new Exception('Invalid action');
    }
    
} catch (Exception $e) {
    $response['message'] = $e->getMessage();
}

echo json_encode($response);
?>