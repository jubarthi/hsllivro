<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    exit;
}

try {
    // Receber dados do formulário
    $nome = trim($_POST['nome'] ?? '');
    $whatsapp = trim($_POST['whatsapp'] ?? '');
    $email = trim($_POST['email'] ?? '');
    
    // Validações básicas
    if (empty($nome) || empty($whatsapp) || empty($email)) {
        throw new Exception('Todos os campos são obrigatórios');
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('E-mail inválido');
    }
    
    // Preparar dados para salvar
    $novoLead = [
        'nome' => $nome,
        'whatsapp' => $whatsapp,
        'email' => $email,
        'data' => date('Y-m-d H:i:s')
    ];
    
    // Ler arquivo existente ou criar array vazio
    $arquivo = 'leads.json';
    $leads = [];
    
    if (file_exists($arquivo)) {
        $conteudo = file_get_contents($arquivo);
        $leads = json_decode($conteudo, true) ?: [];
    }
    
    // Adicionar novo lead
    $leads[] = $novoLead;
    
    // Salvar no arquivo
    if (file_put_contents($arquivo, json_encode($leads, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
        echo json_encode(['success' => true, 'message' => 'Lead salvo com sucesso']);
    } else {
        throw new Exception('Erro ao salvar no arquivo');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
 
