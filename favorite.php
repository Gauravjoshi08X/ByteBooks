<?php
header('Content-Type: application/json');
require_once 'db.php';

$response = ['success' => false, 'message' => ''];

try {
    // For GET requests (loading favorites)
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $userId = $_GET['user_id'] ?? 0;
        
        if (empty($userId)) {
            throw new Exception('User ID is required');
        }
        
        $stmt = $pdo->prepare("SELECT * FROM favorites WHERE user_id = ?");
        $stmt->execute([$userId]);
        $favorites = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $response['success'] = true;
        $response['favorites'] = $favorites;
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // For POST requests (adding/removing favorites)
        $data = json_decode(file_get_contents('php://input'), true);
        $action = $data['action'] ?? '';
        $userId = $data['user_id'] ?? 0;
        
        if (empty($userId)) {
            throw new Exception('User ID is required');
        }
        
        if ($action === 'add') {
            // Add favorite
            $bookId = $data['book_id'] ?? '';
            $title = $data['title'] ?? '';
            
            if (empty($bookId) {
                throw new Exception('Book ID is required');
            }
            if (empty($title)) {
                throw new Exception('Title is required');
            }
            
            $stmt = $pdo->prepare("INSERT INTO favorites 
                (user_id, book_id, title, author, cover_image, description, source) 
                VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $userId,
                $bookId,
                $title,
                $data['author'] ?? '',
                $data['cover_image'] ?? '',
                $data['description'] ?? '',
                $data['source'] ?? 'unknown'
            ]);
            
            $response['success'] = true;
            $response['message'] = 'Added to favorites';
            
        } elseif ($action === 'remove') {
            // Remove favorite
            $bookId = $data['book_id'] ?? '';
            
            if (empty($bookId)) {
                throw new Exception('Book ID is required');
            }
            
            $stmt = $pdo->prepare("DELETE FROM favorites WHERE user_id = ? AND book_id = ?");
            $stmt->execute([$userId, $bookId]);
            
            $response['success'] = true;
            $response['message'] = 'Removed from favorites';
            
        } else {
            throw new Exception('Invalid action');
        }
    }
    
} catch (Exception $e) {
    $response['message'] = $e->getMessage();
}

echo json_encode($response);
?>